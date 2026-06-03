/**
 * IDENTITY LAYER - identity.js
 *
 * Responsibility:
 * - Normalize fragments
 * - Fingerprint (contentHash)
 * - Shingling and MinHash signatures
 * - Index fragments for dedup/near-duplicate detection
 * - Maintain mapping fragment -> canonical (merge edges)
 * - Emit similarity graph edges and contradiction edges
 *
 * Invariants enforced:
 * - canonical ids are immutable (hash-based)
 * - merges are directed operations recorded as merge edges with method + confidence
 * - contradictions are graph edges with typed relation
 */

// Lightweight dependency-free implementation
// Uses Node's crypto if available for SHA256; falls back to simple hash

let cryptoNode = null;
try {
  // Node.js environment
  // eslint-disable-next-line no-undef
  cryptoNode = require && require('crypto');
} catch (e) {
  cryptoNode = (typeof globalThis !== 'undefined' && globalThis.crypto) ? globalThis.crypto : null;
}

// In-memory stores (simple JSON-serializable structures)
const fragments = new Map(); // fragmentId -> fragment object
const contentHashIndex = new Map(); // contentHash -> Set(fragmentId)
const signatureIndex = new Map(); // signatureKey -> Set(fragmentId) (minhash signature string)
const canonicalMap = new Map(); // canonicalId -> canonical object
const fragmentToCanonical = new Map(); // fragmentId -> { canonicalId, mergeMeta }
const similarityEdges = []; // { from, to, score }
const contradictionEdges = []; // { fromCanonical, toCanonical, type, evidence }

// Parameters
const SHINGLE_K = 5;
const MINHASH_SIZE = 64; // number of hash functions/signature length

// Helpers
export function normalize(text) {
  if (!text) return '';
  // Lowercase
  let s = String(text).toLowerCase();
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // Replace common punctuation
  s = s.replace(/[“”"'`·••]/g, '');
  // Remove html entities rough
  s = s.replace(/&nbsp;|&amp;|&lt;|&gt;/g, ' ');
  // Normalize numbers (collapse runs of digits)
  s = s.replace(/\d{4,}/g, '####'); // long numbers -> placeholder
  s = s.replace(/\d+/g, '#');
  // Remove punctuation except word boundaries
  s = s.replace(/[\.,;:\/\(\)\[\]{}<>\-_+=~*!?@#$%^&]/g, '');
  // Trim
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function contentHash(text) {
  const norm = normalize(text);
  try {
    if (cryptoNode && cryptoNode.createHash) {
      const h = cryptoNode.createHash('sha256').update(norm, 'utf8').digest('hex');
      return h;
    }
  } catch (e) {
    // fall through
  }
  // fallback: simple hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function shingle(text, k = SHINGLE_K) {
  const norm = normalize(text);
  const tokens = norm.split(' ').filter(Boolean);
  const shingles = new Set();
  if (tokens.length <= k) {
    shingles.add(tokens.join(' '));
    return Array.from(shingles);
  }
  for (let i = 0; i <= tokens.length - k; i++) {
    shingles.add(tokens.slice(i, i + k).join(' '));
  }
  return Array.from(shingles);
}

// Simple string hash for minhash family (FNV-1a like)
function strHash(str, seed = 0) {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function computeMinHashSignature(shingles, size = MINHASH_SIZE) {
  const signature = new Array(size).fill(Number.MAX_SAFE_INTEGER);
  for (let i = 0; i < shingles.length; i++) {
    const sh = shingles[i];
    for (let k = 0; k < size; k++) {
      const v = strHash(sh, k);
      if (v < signature[k]) signature[k] = v;
    }
  }
  return signature; // array of ints
}

function signatureToKey(sig) {
  // compress signature to hex string for key
  return sig.map(v => v.toString(16)).join('-');
}

export function jaccardFromShingles(aShingles, bShingles) {
  const A = new Set(aShingles);
  const B = new Set(bShingles);
  const inter = new Set([...A].filter(x => B.has(x))).size;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

// Estimate similarity from minhash signatures
export function estimateSimilarityFromSignatures(sigA, sigB) {
  if (!sigA || !sigB || sigA.length !== sigB.length) return 0;
  let equal = 0;
  for (let i = 0; i < sigA.length; i++) if (sigA[i] === sigB[i]) equal++;
  return equal / sigA.length;
}

// Find candidate fragments by signature similarity
export function findCandidatesBySignature(sig, threshold = 0.6) {
  const candidates = new Set();
  // naive scan signatureIndex keys (suitable for medium size)
  for (const [key, fids] of signatureIndex.entries()) {
    const parts = key.split('-');
    // reconstruct signature array length may be variable in key; skip heavy parse
    // Instead estimate via prefix match
    // For simplicity compute similarity by comparing signatures in stored fragment metadata
    for (const fid of fids) {
      const frag = fragments.get(fid);
      if (!frag || !frag.minhash) continue;
      const sim = estimateSimilarityFromSignatures(sig, frag.minhash);
      if (sim >= threshold) candidates.add(fid);
    }
  }
  return Array.from(candidates);
}

export function findCandidates(fragment, options = {}) {
  const { sigThreshold = 0.6, jaccardThreshold = 0.6, maxResults = 20 } = options;
  const sig = fragment.minhash;
  const sh = fragment.shingles;
  const candidateSet = new Set();

  if (sig) {
    const bySig = findCandidatesBySignature(sig, sigThreshold);
    bySig.forEach(f => candidateSet.add(f));
  }

  // Also check exact contentHash bucket
  if (fragment.contentHash && contentHashIndex.has(fragment.contentHash)) {
    contentHashIndex.get(fragment.contentHash).forEach(f => candidateSet.add(f));
  }

  // Compute Jaccard for candidates and filter
  const scored = [];
  for (const fid of candidateSet) {
    const other = fragments.get(fid);
    if (!other) continue;
    const sim = jaccardFromShingles(sh, other.shingles);
    if (sim >= jaccardThreshold) scored.push({ fid, sim });
  }
  scored.sort((a, b) => b.sim - a.sim);
  return scored.slice(0, maxResults).map(s => ({ fragmentId: s.fid, score: s.sim }));
}

// Index a fragment and return candidate clusters and canonicalId if exists
export function indexFragment(fragment) {
  // fragment: { id, text, source:{url,domain,trust}, confidence, extractedAt }
  if (!fragment || !fragment.id || !fragment.text) throw new Error('fragment.id and text required');

  const norm = normalize(fragment.text);
  const ch = contentHash(norm);
  const shingles = shingle(norm);
  const minhash = computeMinHashSignature(shingles);

  const stored = {
    id: fragment.id,
    text: fragment.text,
    normalized: norm,
    contentHash: ch,
    shingles,
    minhash,
    source: fragment.source || { url: fragment.url || null, domain: fragment.domain || null, trust: (fragment.source && fragment.source.trust) || 0.5 },
    confidence: typeof fragment.confidence === 'number' ? fragment.confidence : 0.7,
    extractedAt: fragment.extractedAt || new Date().toISOString()
  };

  fragments.set(stored.id, stored);

  // Update contentHashIndex
  if (!contentHashIndex.has(ch)) contentHashIndex.set(ch, new Set());
  contentHashIndex.get(ch).add(stored.id);

  // Update signatureIndex with a compact key (first N values)
  const sigKey = signatureToKey(minhash.slice(0, 8)); // use prefix for bucketing
  if (!signatureIndex.has(sigKey)) signatureIndex.set(sigKey, new Set());
  signatureIndex.get(sigKey).add(stored.id);

  // Find candidates
  const candidates = findCandidates(stored);

  // If exact canonical exists via contentHash -> map
  let canonicalId = null;
  if (contentHashIndex.has(ch)) {
    // check if any fragment in same bucket already mapped to canonical
    for (const fid of contentHashIndex.get(ch)) {
      if (fragmentToCanonical.has(fid)) {
        canonicalId = fragmentToCanonical.get(fid).canonicalId;
        break;
      }
    }
  }

  // Return summary
  return { fragment: stored, candidates, canonicalId };
}

// Merge edge: record mapping fragment->canonical with metadata
export function addMergeEdge(fragmentId, canonicalId, mergeConfidence = 0.9, mergeMethod = 'lexical') {
  if (!fragments.has(fragmentId)) throw new Error('unknown fragmentId');
  if (!canonicalMap.has(canonicalId)) throw new Error('unknown canonicalId');
  // record directed mapping
  const meta = { fragmentId, canonicalId, mergeConfidence, mergeMethod, ts: new Date().toISOString() };
  fragmentToCanonical.set(fragmentId, { canonicalId, mergeMeta: meta });
  // add to canonical provenance
  const canon = canonicalMap.get(canonicalId);
  canon.sources = canon.sources || [];
  canon.sources.push({ fragmentId, mergeConfidence, mergeMethod, ts: meta.ts });
  return meta;
}

// Create a new canonical node (immutable canonicalId based on text hash)
export function createCanonicalNode(text, preferredFragmentId = null, meta = {}) {
  const norm = normalize(text);
  const idHash = contentHash(norm);
  const canonicalId = `canonical:${idHash}`; // immutable
  if (canonicalMap.has(canonicalId)) return canonicalMap.get(canonicalId);

  const now = new Date().toISOString();
  const canonical = {
    id: canonicalId,
    text: text,
    normalized: norm,
    createdAt: now,
    version: 1,
    sources: [], // filled via addMergeEdge
    provenance: [],
    mergeMeta: meta
  };
  canonicalMap.set(canonicalId, canonical);
  return canonical;
}

export function createCanonicalFromFragments(fragmentIds, method = 'lexical') {
  if (!Array.isArray(fragmentIds) || fragmentIds.length === 0) throw new Error('fragmentIds required');
  // choose canonical text: prefer highest-trust source, then longest normalized text
  let best = null;
  for (const fid of fragmentIds) {
    const f = fragments.get(fid);
    if (!f) continue;
    if (!best) { best = f; continue; }
    // prefer higher source trust
    const t1 = (f.source && f.source.trust) || 0.5;
    const t2 = (best.source && best.source.trust) || 0.5;
    if (t1 > t2) best = f;
    else if (t1 === t2 && f.normalized.length > best.normalized.length) best = f;
  }
  if (!best) throw new Error('no valid fragments');
  const canonical = createCanonicalNode(best.text);
  // add merge edges for each fragment
  fragmentIds.forEach(fid => {
    const confidence = 0.9; // simple default
    addMergeEdge(fid, canonical.id, confidence, method);
  });
  // return canonical
  return canonical;
}

export function getCanonical(canonicalId) {
  return canonicalMap.get(canonicalId);
}

export function getFragment(fragmentId) {
  return fragments.get(fragmentId);
}

// Similarity graph edge builder (fragment level or canonical level)
export function addSimilarityEdge(fromId, toId, score) {
  similarityEdges.push({ from: fromId, to: toId, score, ts: new Date().toISOString() });
}

export function addContradictionEdge(fromCanonical, toCanonical, type = 'strong', evidence = null) {
  // record typed contradiction between canonical nodes
  if (!canonicalMap.has(fromCanonical) || !canonicalMap.has(toCanonical)) {
    // allow adding even if canonical missing (deferred)
  }
  const edge = { from: fromCanonical, to: toCanonical, type, evidence, ts: new Date().toISOString() };
  contradictionEdges.push(edge);
  return edge;
}

// Export index structures (for persistence/plumbing)
export function exportIndex() {
  return {
    fragments: Array.from(fragments.keys()),
    contentHashIndex: Array.from(contentHashIndex.entries()).map(([k, s]) => [k, Array.from(s)]),
    signatureIndex: Array.from(signatureIndex.entries()).map(([k, s]) => [k, Array.from(s)]),
    canonicalMap: Array.from(canonicalMap.values()),
    fragmentToCanonical: Array.from(fragmentToCanonical.entries()),
    similarityEdges,
    contradictionEdges
  };
}

export default {
  normalize,
  contentHash,
  shingle,
  computeMinHashSignature,
  indexFragment,
  findCandidates,
  addMergeEdge,
  createCanonicalNode,
  createCanonicalFromFragments,
  addSimilarityEdge,
  addContradictionEdge,
  getFragment,
  getCanonical,
  exportIndex
};
