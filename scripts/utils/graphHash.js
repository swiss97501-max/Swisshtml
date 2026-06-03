import crypto from 'crypto';

export function graphHashFromSnapshot(snapshot) {
  // snapshot: { fragments: {id:frag}, canonicals: {id:canonical}, mergeLog: [{key,value}] }
  const nodes = Object.keys(snapshot.canonicals || {}).sort();
  const nodeParts = [];
  for (const id of nodes) {
    const c = snapshot.canonicals[id] || {};
    const frags = (c.fragments || []).slice().sort();
    const beliefP = (c.belief && typeof c.belief.p === 'number') ? Number(c.belief.p).toFixed(4) : 'null';
    nodeParts.push(`${id}|frags:${frags.join(',')}|p:${beliefP}`);
  }

  const edges = (snapshot.mergeLog || []).map(e => JSON.stringify(e.value || e)).map(s => s).sort();

  const combined = `NODES:${nodeParts.join(';')}||EDGES:${edges.join(';')}`;
  const h = crypto.createHash('sha256').update(combined, 'utf8').digest('hex');
  return { hash: h, combined, nodeCount: nodes.length, edgeCount: edges.length };
}
