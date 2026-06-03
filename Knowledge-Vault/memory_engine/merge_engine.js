/**
 * MERGE ENGINE - merge_engine.js
 *
 * Responsibilities:
 * - Cluster candidate fragments deterministically
 * - Create canonical nodes (immutable id with multi-view 'views')
 * - Apply directed merge edges (append-only event log semantics)
 * - Build canonical-level similarity + contradiction graphs
 *
 * Constraints implemented:
 * - Canonical IDs immutable (hash-based)
 * - Merge is append-only: record event log entries rather than overwrite
 * - Canonical nodes include multi-view representation: lexical, tfidf (placeholder), summary
 * - Merge policy deterministic using: trust > earliest timestamp > longest text > fragment id
 */

import identity from './identity.js';

// In-memory append-only merge event log
const mergeLog = []; // entries: { eventId, fragmentId, canonicalId, mergeConfidence, mergeMethod, ts }
let eventCounter = 0;

// Canonical-level similarity & contradiction graphs
const canonicalSimilarityEdges = []; // { from, to, score, ts }
const canonicalContradictionEdges = []; // { from, to, type, evidence, ts }

// Deterministic selection order comparator
function deterministicComparator(a, b) {
  // Rule priority: trust (descending) > earliest timestamp (ascending) > longest normalized text (descending) > fragmentId (ascending)
  const tA = (a.source && a.source.trust) || 0.5;
  const tB = (b.source && b.source.trust) || 0.5;
  if (tA !== tB) return tB - tA; // higher trust first
  const tsA = new Date(a.extractedAt).getTime();
  const tsB = new Date(b.extractedAt).getTime();
  if (tsA !== tsB) return tsA - tsB; // earlier first
  if (a.normalized.length !== b.normalized.length) return b.normalized.length - a.normalized.length; // longer first
  return a.id < b.id ? -1 : 1; // fragment id
}

// clusterCandidates: receives candidate list from identity.findCandidates results and clusters deterministically
export function clusterCandidates(fragmentId, candidates, options = {}) {
  // candidates: [{ fragmentId, score }]
  // We will form a cluster consisting of the fragment + top candidates above threshold
  const threshold = options.threshold || 0.8; // jaccard threshold for auto-cluster
  const center = identity.getFragment(fragmentId);
  if (!center) throw new Error('unknown fragmentId');

  // collect candidate fragments objects
  const candidateObjs = candidates.map(c => identity.getFragment(c.fragmentId)).filter(Boolean);

  // filter by score threshold
  const selected = candidateObjs.filter((f, idx) => (candidates[idx] && candidates[idx].score >= threshold));

  // cluster includes center and selected
  const cluster = [center, ...selected];

  // sort deterministically
  cluster.sort(deterministicComparator);
  return cluster.map(f => f.id);
}

// Create canonical from cluster of fragment ids (ensures immutability and multi-view representation)
export function createCanonicalFromCluster(fragmentIds, mergeMethod = 'lexical') {
  if (!Array.isArray(fragmentIds) || fragmentIds.length === 0) throw new Error('fragmentIds required');

  // deterministically pick representative fragment per comparator
  const frags = fragmentIds.map(id => identity.getFragment(id)).filter(Boolean);
  frags.sort(deterministicComparator);
  const representative = frags[0];

  // create canonical node using identity.createCanonicalNode (id is hash of representative normalized text)
  const canonical = identity.createCanonicalNode(representative.text, representative.id, { createdBy: 'merge_engine', mergeMethod });

  // ensure multi-view structure
  canonical.views = canonical.views || { lexical: representative.normalized, tfidf: null, summary: null };

  // append merge events for each fragment
  for (const fid of fragmentIds) {
    const frag = identity.getFragment(fid);
    const mergeConfidence = computeMergeConfidence(representative, frag);
    const meta = identity.addMergeEdge(fid, canonical.id, mergeConfidence, mergeMethod);
    // append-only event log entry
    mergeLog.push({ eventId: ++eventCounter, fragmentId: fid, canonicalId: canonical.id, mergeConfidence, mergeMethod, ts: new Date().toISOString() });
  }

  return canonical;
}

// computeMergeConfidence deterministic heuristic: base on candidate similarity, source trust & fragment confidence
function computeMergeConfidence(rep, frag) {
  // basic formula: 0.4 * similarity_estimate + 0.4 * sourceTrust + 0.2 * fragment.confidence
  const sim = identity.jaccardFromShingles(rep.shingles, frag.shingles) || 0.0;
  const sourceTrust = (frag.source && frag.source.trust) || 0.5;
  const fragConf = typeof frag.confidence === 'number' ? frag.confidence : 0.7;
  const conf = Math.round(((0.4 * sim) + (0.4 * sourceTrust) + (0.2 * fragConf)) * 100) / 100;
  return Math.max(0.0, Math.min(1.0, conf));
}

// buildMergeGraph: construct canonical-level similarity & contradiction edges based on fragments
export function buildMergeGraph() {
  canonicalSimilarityEdges.length = 0;
  canonicalContradictionEdges.length = 0;

  // naive approach: for each canonical, compare its representative to others using identity.estimateSimilarityFromSignatures
  const canonals = identity.exportIndex().canonicalMap || [];
  for (let i = 0; i < canonals.length; i++) {
    for (let j = i + 1; j < canonals.length; j++) {
      const a = canonals[i];
      const b = canonals[j];
      // compute similarity via jaccard between views.lexical shingles if available
      const shA = identity.shingle(a.normalized || a.text);
      const shB = identity.shingle(b.normalized || b.text);
      const sim = identity.jaccardFromShingles(shA, shB);
      if (sim > 0.2) {
        canonicalSimilarityEdges.push({ from: a.id, to: b.id, score: sim, ts: new Date().toISOString() });
      }
      // detect simple contradiction via presence of negation words (placeholder rule-based)
      if (detectSimpleContradiction(a.normalized || a.text, b.normalized || b.text)) {
        canonicalContradictionEdges.push({ from: a.id, to: b.id, type: 'weak', evidence: null, ts: new Date().toISOString() });
      }
    }
  }
  return { similarity: canonicalSimilarityEdges, contradictions: canonicalContradictionEdges };
}

// simple contradiction detection heuristic: checks for negation patterns
function detectSimpleContradiction(aText, bText) {
  if (!aText || !bText) return false;
  const negationWords = ['not', 'no', 'never', "doesn't", "isn't", "can't", 'without'];
  // if a contains negation word AND rest of content overlaps with b
  const aHasNeg = negationWords.some(w => aText.includes(w));
  const bHasNeg = negationWords.some(w => bText.includes(w));
  if (aHasNeg !== bHasNeg) {
    // check overlap
    const shA = identity.shingle(aText);
    const shB = identity.shingle(bText);
    const sim = identity.jaccardFromShingles(shA, shB);
    return sim > 0.4; // heuristic
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
    const sim = identity.jaccardFromShingles(rep.shingles, f.shingles);
    allSims.push(sim);
  }
  const avgSim = allSims.length === 0 ? 0 : (allSims.reduce((a, b) => a + b, 0) / allSims.length);
  const shouldAutoMerge = avgSim >= autoMergeThreshold;
  return { avgSim, shouldAutoMerge };
}

// Expose mergeLog and graphs
export function exportMergeLog() { return mergeLog.slice(); }
export function exportCanonicalGraph() { return { similarity: canonicalSimilarityEdges.slice(), contradictions: canonicalContradictionEdges.slice() }; }

export default {
  clusterCandidates,
  createCanonicalFromCluster,
  mergePolicy,
  buildMergeGraph,
  exportMergeLog,
  exportCanonicalGraph
};
