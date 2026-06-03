/**
 * AUTONOMY LOOP - upgraded with curiosity pressure and consolidation
 * Integrates Bayesian belief engine (truth_bayes) and consolidation cycle.
 */

import { getGraph as getCausalGraph } from './causal.js';
import { detect } from './contradiction_v2.js';
import {
  getBelief,
  updateBeliefWithEvidence,
  applyContradiction,
  exportBeliefs
} from './truth_bayes.js';

// State
const autonomyState = {
  isRunning: false,
  questionQueue: [],
  exploredQuestions: new Set(),
  knowledgeGaps: [],
  contradictionMap: new Map(),
  trustLevel: 0,
  lastUpdate: null,
  loopIteration: 0,
  consolidationInterval: 25 // default
};

// Exploration param
let EPSILON = 0.2; // exploration probability

/**
 * Basic impact heuristic: degree centrality from causal graph
 */
function computeImpact(node) {
  const graph = getCausalGraph();
  const out = (graph[node] && graph[node].length) || 0;
  // incoming degree
  const incoming = Object.keys(graph).reduce((sum, k) => sum + (graph[k].includes(node) ? 1 : 0), 0);
  return out + incoming;
}

/**
 * Curiosity priority scoring
 * priority = uncertainty * (1 + impact) * (1 + contradiction_density)
 */
function computePriorityForClaim(claimId, globalContradictionDensity) {
  const belief = getBelief(claimId);
  const uncertainty = 1 - (belief.p || 0.5);
  const impact = computeImpact(claimId) || 0;
  return uncertainty * (1 + impact) * (1 + globalContradictionDensity);
}

/**
 * Generate a question using curiosity pressure.
 * Picks highest-priority claim from causal graph.
 */
function generateQuestion() {
  const graph = getCausalGraph();
  const contradictions = detect() || [];
  const totalNodes = Object.keys(graph).length || 1;
  const contradictionDensity = contradictions.length / totalNodes;

  // Build priority list
  const priorities = Object.keys(graph).map(node => ({
    node,
    priority: computePriorityForClaim(node, contradictionDensity)
  }));

  priorities.sort((a, b) => b.priority - a.priority);

  if (priorities.length === 0) return null;

  // ε-greedy: with EPSILON pick random, else top
  if (Math.random() < EPSILON) {
    const r = priorities[Math.floor(Math.random() * priorities.length)];
    return { type: 'WHAT', template: `นิยามของ ${r.node} คืออะไ���?`, subject: r.node, priority: r.priority };
  }

  const top = priorities[0];
  return { type: 'WHAT', template: `นิยามของ ${top.node} คืออะไร?`, subject: top.node, priority: top.priority };
}

function identifyKnowledgeGaps() {
  const causalGraph = getCausalGraph();
  const gaps = { definitions: [], causality: [], mechanisms: [], contradictions: [] };
  Object.keys(causalGraph).forEach(cause => {
    if (!causalGraph[cause] || causalGraph[cause].length === 0) {
      gaps.definitions.push(cause);
    }
  });
  const contradictions = detect();
  if (contradictions && contradictions.length > 0) {
    gaps.contradictions = contradictions;
  }
  return gaps;
}

function makeDecision(state) {
  const decision = { action: null, reason: null, confidence: 0 };
  if (state.contradictionMap.size > 5) {
    decision.action = 'REFINE_SEARCH';
    decision.reason = 'high_contradiction_level';
    decision.confidence = 85;
  } else if (state.trustLevel < 40) {
    decision.action = 'EXPAND_SEARCH';
    decision.reason = 'low_confidence';
    decision.confidence = 90;
  } else if (state.loopIteration > 1000) {
    decision.action = 'CONSOLIDATE';
    decision.reason = 'iteration_limit_reached';
    decision.confidence = 95;
  } else if (state.knowledgeGaps.length === 0) {
    decision.action = 'STOP';
    decision.reason = 'no_more_gaps';
    decision.confidence = 100;
  } else {
    decision.action = 'CONTINUE';
    decision.reason = 'knowledge_gaps_remain';
    decision.confidence = 75;
  }
  return decision;
}

/**
 * Consolidation utilities
 */
function merge_similar_claims() {
  // Minimal placeholder: use belief export and merge identical text ids
  // In production: use fuzzy matching / embedding similarity
  const beliefs = exportBeliefs();
  // naive dedupe by exact id prefix (e.g., same normalized text)
  // This is a stub for an actual merge algorithm
  console.log('  ↺ merge_similar_claims (stub) — candidates:', beliefs.length);
}

function resolve_contradictions() {
  const contradictions = detect() || [];
  contradictions.forEach(c => {
    // Simple heuristic: apply contradiction to the second claim
    try {
      applyContradiction(c.claim2 || c.claimId2 || 'unknown');
    } catch (e) {
      // ignore
    }
  });
  console.log(`  ↺ resolve_contradictions: applied ${contradictions.length}`);
}

function compress_graph() {
  const graph = getCausalGraph();
  // remove low-confidence leaves (p < 0.1)
  const nodes = Object.keys(graph);
  let removed = 0;
  nodes.forEach(n => {
    const belief = getBelief(n);
    const degree = (graph[n] && graph[n].length) || 0;
    if (degree === 0 && belief.p < 0.05) {
      // delete node by removing its adjacency (cannot actually delete module-level graph here)
      removed++;
    }
  });
  console.log(`  ↺ compress_graph (stub): removed(${removed})`);
}

function update_beliefs_after_consolidation() {
  // Placeholder - in a full system we would recompute beliefs after merging evidence
  console.log('  ↺ update_beliefs_after_consolidation (stub)');
}

export function runConsolidation() {
  console.log('\n[Consolidation] Running consolidation cycle...');
  merge_similar_claims();
  resolve_contradictions();
  compress_graph();
  update_beliefs_after_consolidation();
  console.log('[Consolidation] Done\n');
}

/**
 * Main Autonomy Loop
 */
export async function startAutonomyLoop(initialQuestion = null, options = {}) {
  if (options.epsilon !== undefined) EPSILON = options.epsilon;
  if (options.consolidationInterval) autonomyState.consolidationInterval = options.consolidationInterval;

  autonomyState.isRunning = true;
  autonomyState.loopIteration = 0;

  console.log('🧠 AUTONOMY LOOP STARTED (curiosity-enabled)');

  if (initialQuestion) autonomyState.questionQueue.push(initialQuestion);

  while (autonomyState.isRunning && autonomyState.loopIteration < 10000) {
    autonomyState.loopIteration++;

    console.log(`\n📍 ITERATION ${autonomyState.loopIteration}`);

    // Consolidation check
    if (autonomyState.loopIteration % autonomyState.consolidationInterval === 0) {
      runConsolidation();
    }

    // Populate queue if empty
    if (autonomyState.questionQueue.length === 0) {
      const newQ = generateQuestion();
      if (!newQ) { console.log('✅ No more questions to ask'); break; }
      autonomyState.questionQueue.push(newQ);
    }

    const currentQuestion = autonomyState.questionQueue.shift();
    console.log(`❓ Question: ${currentQuestion.template}`);

    if (autonomyState.exploredQuestions.has(JSON.stringify(currentQuestion))) {
      console.log('⏭️ Already explored this question');
      continue;
    }
    autonomyState.exploredQuestions.add(JSON.stringify(currentQuestion));

    autonomyState.knowledgeGaps = identifyKnowledgeGaps();

    // Detect contradictions and populate map
    const newContradictions = detect() || [];
    if (newContradictions) {
      newContradictions.forEach(c => {
        const key = `${c.claim1 || c.claimId1}---${c.claim2 || c.claimId2}`;
        if (!autonomyState.contradictionMap.has(key)) {
          autonomyState.contradictionMap.set(key, { ...c, discoveredAt: autonomyState.loopIteration });
        }
      });
    }

    autonomyState.trustLevel = calculateSystemTrustLevel();
    console.log(`🎯 Trust Level: ${autonomyState.trustLevel}%`);

    const decision = makeDecision(autonomyState);
    console.log(`🤖 Decision: ${decision.action} (confidence: ${decision.confidence}%)`);

    executeDecision(decision);

    autonomyState.lastUpdate = new Date().toISOString();

    if (autonomyState.loopIteration % 10 === 0) {
      console.log(`[Loop Health Check] Gaps: ${autonomyState.knowledgeGaps.length}, Contradictions: ${autonomyState.contradictionMap.size}`);
    }
  }

  autonomyState.isRunning = false;
  console.log(`\n✅ AUTONOMY LOOP ENDED (iterations: ${autonomyState.loopIteration})`);
  return { finalState: autonomyState, summary: generateSummary() };
}

function executeDecision(decision) {
  switch (decision.action) {
    case 'EXPAND_SEARCH':
      console.log('🔍 Expanding search...');
      const gaps = identifyKnowledgeGaps();
      gaps.definitions.forEach(def => autonomyState.questionQueue.push({ type: 'WHAT', subject: def, priority: 'high', template: `นิยามของ ${def} คืออะไร?` }));
      break;

    case 'REFINE_SEARCH':
      console.log('🔬 Refining questions for contradictions...');
      autonomyState.contradictionMap.forEach((contradiction) => {
        autonomyState.questionQueue.push({ type: 'WHY', subject: 'contradiction', claim1: contradiction.claim1, claim2: contradiction.claim2, priority: 'critical', template: `ทำไม ${contradiction.claim1} และ ${contradiction.claim2} ขัดแย้งกัน?` });
      });
      break;

    case 'CONSOLIDATE':
      console.log('📊 Consolidating knowledge (on demand)...');
      runConsolidation();
      break;

    case 'CONTINUE':
      console.log('⏩ Continuing...');
      break;

    case 'STOP':
      autonomyState.isRunning = false;
      console.log('🛑 Stopping autonomy loop');
      break;
  }
}

function calculateSystemTrustLevel() {
  const graph = getCausalGraph();
  const contradictions = detect() || [];
  const totalNodes = Object.keys(graph).length;
  if (totalNodes === 0) return 0;
  const contradictionPenalty = (contradictions.length / totalNodes) * 100;
  const baseTrust = Math.min(100, totalNodes * 3);
  return Math.max(0, baseTrust - contradictionPenalty);
}

function generateSummary() {
  return {
    totalIterations: autonomyState.loopIteration,
    questionsAsked: autonomyState.exploredQuestions.size,
    contradictionsFound: autonomyState.contradictionMap.size,
    finalTrustLevel: autonomyState.trustLevel,
    lastUpdate: autonomyState.lastUpdate,
    status: autonomyState.isRunning ? 'running' : 'stopped'
  };
}

export function getAutonomyState() {
  return { ...autonomyState, exploredQuestions: Array.from(autonomyState.exploredQuestions), contradictionMap: Array.from(autonomyState.contradictionMap.entries()) };
}

export function stopAutonomyLoop() { autonomyState.isRunning = false; }
export function resetAutonomy() {
  autonomyState.isRunning = false; autonomyState.questionQueue = []; autonomyState.exploredQuestions.clear(); autonomyState.knowledgeGaps = []; autonomyState.contradictionMap.clear(); autonomyState.trustLevel = 0; autonomyState.loopIteration = 0; autonomyState.lastUpdate = null;
}

export { generateQuestion, identifyKnowledgeGaps, makeDecision, computeImpact, runConsolidation };
