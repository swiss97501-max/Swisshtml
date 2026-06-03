// memory_engine/reasoning/causal.js

const causalGraph = new Map();
const reverseGraph = new Map();

// normalize key กัน graph แตก
function normalize(node) {
  return node.trim().toLowerCase();
}

// เพิ่มความสัมพันธ์เหตุ → ผล พร้อม weight
export function addCause(cause, effect, weight = 1.0) {

  const c = normalize(cause);
  const e = normalize(effect);

  // forward graph
  if (!causalGraph.has(c)) {
    causalGraph.set(c, []);
  }

  const edges = causalGraph.get(c);

  const exists = edges.find(x => x.node === e);

  if (!exists) {
    edges.push({ node: e, weight });
  }

  // reverse graph (สำคัญมากสำหรับ reasoning backward)
  if (!reverseGraph.has(e)) {
    reverseGraph.set(e, []);
  }

  const rev = reverseGraph.get(e);

  const revExists = rev.find(x => x.node === c);

  if (!revExists) {
    rev.push({ node: c, weight });
  }
}

// ดูผลทั้งหมดของสาเหตุ
export function getEffects(cause) {
  return causalGraph.get(normalize(cause)) || [];
}

// ดู “สาเหตุย้อนกลับ” (สำคัญมากสำหรับ truth checking)
export function getCauses(effect) {
  return reverseGraph.get(normalize(effect)) || [];
}

// ดูกราฟทั้งหมด
export function getGraph() {
  return {
    forward: Object.fromEntries(causalGraph),
    reverse: Object.fromEntries(reverseGraph)
  };
}

// วิเคราะห์ strength ของ causal chain
export function causalStrength(cause, effect) {
  const c = normalize(cause);
  const e = normalize(effect);

  const edges = causalGraph.get(c) || [];
  const match = edges.find(x => x.node === e);

  return match ? match.weight : 0;
}
