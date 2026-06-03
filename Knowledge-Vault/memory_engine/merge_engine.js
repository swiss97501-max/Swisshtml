/**
 * MERGE ENGINE - merge_engine.js
 *
 * Responsibilities:
 * - Cluster candidate fragments deterministically
 * - Create canonical nodes (immutable id with multi-view 'views')
 * - Apply directed merge edges (append-only event log semantics backed by persistence)
 * - Build canonical-level similarity + contradiction graphs
 *
 * Constraints implemented:
 * - Canonical IDs immutable (hash-based)
 * - Merge is append-only: record event log entries via persistence.appendMergeEvent
 * - Canonical nodes include multi-view representation: lexical, tfidf (placeholder), summary
 * - Merge policy deterministic using: trust > earliest timestamp > longest text > fragment id
 */

import * as persistence from './persistence.js';
import identity from './identity.js';

// Canonical-level similarity & contradiction graphs (in-memory cache; persistence is source-of-truth)
const canonicalSimilarityEdges = []; // { from, to, score, ts }
const canonicalContradictionEdges = []; // { from, to, type, evidence, ts }

// Deterministic selection order comparator
function deterministicComparator(a, b) {
  const tA = (a.source && a.source.trust) || 0.5;
  const tB = (b.source && b.source.trust) || 0.5;
  if (tA !== tB) return tB - tA; // higher trust first
  const tsA = new Date(a.extractedAt || a.timestamp || 0).getTime();
  const tsB = new Date(b.extractedAt || b.timestamp || 0).getTime();
  if (tsA !== tsB) return tsA - tsB; // earlier first
  if ((a.normalized && a.normalized.length) !== (b.normalized && b.normalized.length)) {
    return (b.normalized && b.normalized.length) - (a.normalized && a.normalized.length); // longer first
  }
  return (a.id || '').localeCompare(b.id || ''); // fragment id
}

// clusterCandidates: receives candidate list from identity.findCandidates results and clusters deterministically
export function clusterCandidates(fragmentId, candidates, options = {}) {
  const threshold = options.threshold || 0.8; // jaccard threshold for auto-cluster
  const center = identity.getFragment(fragmentId);
  if (!center) throw new Error('unknown fragmentId');

  const candidateObjs = candidates.map(c => identity.getFragment(c.fragmentId)).filter(Boolean);
  const selected = candidateObjs.filter((f, idx) => (candidates[idx] && candidates[idx].score >= threshold));
  const cluster = [center, ...selected];
  cluster.sort(deterministicComparator);
  return cluster.map(f => f.id);
}

// computeMergeConfidence deterministic heuristic: base on candidate similarity, source trust & fragment confidence
function computeMergeConfidence(rep, frag) {
  const sim = identity.jaccardFromShingles(rep.shingles || [], frag.shingles || []) || 0.0;
  const sourceTrust = (frag.source && frag.source.trust) || 0.5;
  const fragConf = typeof frag.confidence === 'number' ? frag.confidence : 0.7;
  const conf = ((0.4 * sim) + (0.4 * sourceTrust) + (0.2 * fragConf));
  return Math.max(0.0, Math.min(1.0, Math.round(conf * 100) / 100));
}

// createCanonicalFromCluster: create canonical node and persist via persistence, append merge events (append-only)
export async function createCanonicalFromCluster(fragmentIds, mergeMethod = 'lexical') {
  if (!Array.isArray(fragmentIds) || fragmentIds.length === 0) throw new Error('fragmentIds required');

  // deterministically pick representative fragment per comparator
  const frags = fragmentIds.map(id => identity.getFragment(id)).filter(Boolean);
  frags.sort(deterministicComparator);
  const representative = frags[0];

  // create canonical in memory first (to get id) but persistence is authoritative: we will persist canonical and events first
  const canonical = identity.createCanonicalNode(representative.text, representative.id, { createdBy: 'merge_engine', mergeMethod });

  // ensure multi-view structure
  canonical.views = canonical.views || { lexical: representative.normalized || representative.text, tfidf: null, summary: null };

  // Build canonical payload to persist
  const canonicalPayload = {
    id: canonical.id,
    text: canonical.text,
    normalized: canonical.normalized,
    created_at: canonical.createdAt || new Date().toISOString(),
    version: canonical.version || 1,
    views: canonical.views,
    fragments: fragmentIds.slice(),
    provenance: canonical.provenance || [],
    mergeMeta: canonical.mergeMeta || {}
  };

  // Persist canonical (persistence = truth)
  await persistence.putCanonical(canonicalPayload);

  // Append merge events for each fragment (append-only)
  for (const fid of fragmentIds) {
    const frag = identity.getFragment(fid);
    const mergeConfidence = frag ? computeMergeConfidence(representative, frag) : 0.5;
    const event = await persistence.appendMergeEvent({
      type: 'MERGE_FRAGMENT_TO_CANONICAL',
      fragmentId: fid,
      canonicalId: canonical.id,
      mergeConfidence,
      mergeMethod,
      ts: new Date().toISOString()
    });
    // update in-memory mapping AFTER successful persistence (memory = cache)
    try {
      if (frag) identity.addMergeEdge(fid, canonical.id, mergeConfidence, mergeMethod);
    } catch (e) {
      // non-fatal: memory cache might not be initialized, continue
      // but we keep persistence as source-of-truth
    }
  }

  return canonicalPayload;
}

// Compatibility API used by identity_persistent: createCanonical(payload)
export async function createCanonical(payload = {}) {
  const fragments = Array.isArray(payload.fragments) ? payload.fragments : (payload.fragments ? [payload.fragments] : []);
  return await createCanonicalFromCluster(fragments, payload.mergeMethod || 'lexical');
}

// buildMergeGraph: construct canonical-level similarity & contradiction edges based on persisted canonicals/mergeLog
export async function buildMergeGraph() {
  canonicalSimilarityEdges.length = 0;
  canonicalContradictionEdges.length = 0;

  const data = await persistence.exportAll();
  const canonicals = Object.values(data.canonicals || {});

  for (let i = 0; i < canonicals.length; i++) {
    for (let j = i + 1; j < canonicals.length; j++) {
      const a = canonicals[i];
      const b = canonicals[j];
      const shA = (a.views && a.views.lexical) ? identity.shingle(a.views.lexical) : identity.shingle(a.normalized || a.text || '');
      const shB = (b.views && b.views.lexical) ? identity.shingle(b.views.lexical) : identity.shingle(b.normalized || b.text || '');
      const sim = identity.jaccardFromShingles(shA, shB);
      if (sim > 0.2) canonicalSimilarityEdges.push({ from: a.id, to: b.id, score: sim, ts: new Date().toISOString() });
      if (detectSimpleContradiction(a.normalized || a.text || '', b.normalized || b.text || '')) {
        canonicalContradictionEdges.push({ from: a.id, to: b.id, type: 'weak', evidence: null, ts: new Date().toISOString() });
      }
    }
  }
  return { similarity: canonicalSimilarityEdges.slice(), contradictions: canonicalContradictionEdges.slice() };
}

// simple contradiction detection heuristic: checks for negation patterns
function detectSimpleContradiction(aText, bText) {
  if (!aText || !bText) return false;
  const negationWords = [' not ', ' no ', ' never ', "doesn't", "isn't", "can't", ' without '];
  const aHasNeg = negationWords.some(w => aText.includes(w));
  const bHasNeg = negationWords.some(w => bText.includes(w));
  if (aHasNeg !== bHasNeg) {
    const shA = identity.shingle(aText);
    const shB = identity.shingle(bText);
    const sim = identity.jaccardFromShingles(shA, shB);
    return sim > 0.4;
  }
  return false;
}

// mergePolicy: deterministic decision to merge cluster or not based on thresholds
export function mergePolicy(clusterFragmentIds, options = {}) {
  const autoMergeThreshold = options.autoMergeThreshold || 0.8;
  const candidate = clusterFragmentIds[0];
  const rep = identity.getFragment(candidate);
  let allSims = [];
  for (const fid of clusterFragmentIds) {
    const f = identity.getFragment(fid);
    if (!f) continue;
    const sim = identity.jaccardFromShingles(rep.shingles || [], f.shingles || []);
    allSims.push(sim);
  }
  const avgSim = allSims.length === 0 ? 0 : (allSims.reduce((a, b) => a + b, 0) / allSims.length);
  const shouldAutoMerge = avgSim >= autoMergeThreshold;
  return { avgSim, shouldAutoMerge };
}

// Expose mergeLog and graphs (mergeLog is persisted; here we expose persisted log reading)
export async function exportMergeLog() { const log = await persistence.getMergeLog(); return log; }
export function exportCanonicalGraph() { return { similarity: canonicalSimilarityEdges.slice(), contradictions: canonicalContradictionEdges.slice() }; }

export default {
  clusterCandidates,
  createCanonicalFromCluster,
  createCanonical,
  mergePolicy,
  buildMergeGraph,
  exportMergeLog,
  exportCanonicalGraph
};
