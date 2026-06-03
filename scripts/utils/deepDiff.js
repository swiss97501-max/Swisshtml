import fs from 'fs';

export function deepDiff(a, b) {
  // simple structural diff for nodes/edges/beliefs
  const diffs = { nodesMissing: [], nodesExtra: [], beliefDiffs: [], mergeLogDiffs: [] };

  const aNodes = Object.keys(a.canonicals || {}).sort();
  const bNodes = Object.keys(b.canonicals || {}).sort();

  for (const n of aNodes) if (!bNodes.includes(n)) diffs.nodesMissing.push(n);
  for (const n of bNodes) if (!aNodes.includes(n)) diffs.nodesExtra.push(n);

  for (const n of aNodes) {
    if (!b.canonicals || !b.canonicals[n]) continue;
    const pa = (a.canonicals[n].belief && a.canonicals[n].belief.p) || null;
    const pb = (b.canonicals[n].belief && b.canonicals[n].belief.p) || null;
    if (pa === null && pb === null) continue;
    if (Math.abs((pa || 0) - (pb || 0)) > 1e-6) diffs.beliefDiffs.push({ id: n, before: pa, after: pb });
  }

  // mergeLog structural comparison by sequence
  const aLog = (a.mergeLog || []).map(e => JSON.stringify(e.value || e)).sort();
  const bLog = (b.mergeLog || []).map(e => JSON.stringify(e.value || e)).sort();
  for (const entry of aLog) if (!bLog.includes(entry)) diffs.mergeLogDiffs.push({ missingInB: entry });
  for (const entry of bLog) if (!aLog.includes(entry)) diffs.mergeLogDiffs.push({ extraInB: entry });

  return diffs;
}

export function saveReport(filePath, report) {
  fs.mkdirSync(filePath.replace(/\/[^/]*$/,''), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
}
