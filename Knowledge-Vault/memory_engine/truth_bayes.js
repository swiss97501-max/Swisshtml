/**
 * TRUTH_BAYES - Bayesian belief update engine for claims
 *
 * Provides a minimal research-grade epistemic model using odds & likelihood ratios.
 * - Prior / posterior belief for claim: P(T)
 * - Uses log-odds for numerical stability
 * - Evidence contributes via Likelihood Ratio (LR = P(E|T) / P(E|¬T))
 * - Source reliability modulates LR
 */

const beliefs = new Map();

// Helper: clamp probability into (eps, 1-eps)
function clampProb(p) {
  const eps = 1e-6;
  return Math.max(eps, Math.min(1 - eps, p));
}

// Initialize belief for a claimId with a prior (0..1)
export function initClaimBelief(claimId, prior = 0.5) {
  const p = clampProb(prior);
  const logOdds = Math.log(p / (1 - p));
  beliefs.set(claimId, { p, logOdds, history: [] });
  return beliefs.get(claimId);
}

// Get current belief; if missing initialize with 0.5
export function getBelief(claimId) {
  if (!beliefs.has(claimId)) {
    initClaimBelief(claimId, 0.5);
  }
  const b = beliefs.get(claimId);
  return { id: claimId, p: b.p, logOdds: b.logOdds, history: b.history.slice() };
}

// Convert probability to log-odds and back
function pToLogOdds(p) {
  p = clampProb(p);
  return Math.log(p / (1 - p));
}
function logOddsToP(logOdds) {
  const odds = Math.exp(logOdds);
  return odds / (1 + odds);
}

/**
 * Compute a simple Likelihood Ratio for an evidence item.
 * Evidence schema (recommended): { type, strength, source: { trust: 0..1 } }
 * - type: 'direct'|'statistical'|'testimonial'|'inference'|'contradiction'
 * - strength: 0..1 (confidence of extraction)
 * - source.trust: 0..1 (domain reliability)
 *
 * Returns LR (>1 supports claim, <1 opposes)
 */
export function computeLikelihoodRatio(evidence) {
  if (!evidence) return 1.0;

  const typeMap = {
    direct: 20.0,        // strong supporting evidence
    statistical: 8.0,
    experimental: 12.0,
    peer_review: 10.0,
    testimonial: 2.0,
    inference: 1.2,
    anecdotal: 1.1,
    contradiction: 0.01, // strong refutation
    unknown: 1.0
  };

  const base = typeMap[evidence.type] || 1.0;
  const strength = typeof evidence.strength === 'number' ? evidence.strength : 0.7;
  const sourceTrust = evidence.source && typeof evidence.source.trust === 'number' ? evidence.source.trust : 0.5;

  // Combine base LR with strength and sourceTrust
  // We use an exponent to moderate influence: LR^(strength * f(trust))
  const trustFactor = Math.max(0.01, sourceTrust);
  const effectiveLR = Math.pow(base, strength * trustFactor);

  // If evidence is marked as contradiction, invert
  if (evidence.type === 'contradiction') {
    return Math.max(1e-6, 1 / effectiveLR);
  }

  return Math.max(1e-6, effectiveLR);
}

/**
 * Update belief for claimId with a single evidence item.
 * Stores history entry with LR and posterior.
 */
export function updateBeliefWithEvidence(claimId, evidence) {
  if (!beliefs.has(claimId)) initClaimBelief(claimId, 0.5);
  const entry = beliefs.get(claimId);

  const lr = computeLikelihoodRatio(evidence);
  const logLR = Math.log(lr);
  entry.logOdds = (entry.logOdds || pToLogOdds(entry.p || 0.5)) + logLR;
  entry.p = clampProb(logOddsToP(entry.logOdds));

  entry.history.push({ evidence, lr, logLR, p: entry.p, ts: new Date().toISOString() });
  return { id: claimId, p: entry.p, lr, logOdds: entry.logOdds };
}

/**
 * Incorporate multiple evidence items (batch update)
 */
export function updateBeliefBatch(claimId, evidences = []) {
  let last = null;
  evidences.forEach(ev => {
    last = updateBeliefWithEvidence(claimId, ev);
  });
  return last || getBelief(claimId);
}

/**
 * Apply a contradiction explicitly (strong negative LR)
 */
export function applyContradiction(claimId, contradictionEvidence = { type: 'contradiction', strength: 1.0, source: { trust: 1.0 } }) {
  return updateBeliefWithEvidence(claimId, contradictionEvidence);
}

/**
 * Set belief directly (override) - useful for seeding priors
 */
export function setBelief(claimId, p) {
  const pClamped = clampProb(p);
  const logOdds = pToLogOdds(pClamped);
  beliefs.set(claimId, { p: pClamped, logOdds, history: [{ note: 'seed', p: pClamped, ts: new Date().toISOString() }] });
  return getBelief(claimId);
}

/**
 * Export internal beliefs map for inspection
 */
export function exportBeliefs() {
  const out = [];
  beliefs.forEach((v, k) => out.push({ id: k, p: v.p, history: v.history }));
  return out;
}

export default {
  initClaimBelief,
  getBelief,
  updateBeliefWithEvidence,
  updateBeliefBatch,
  applyContradiction,
  setBelief,
  exportBeliefs
};
