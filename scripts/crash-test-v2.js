#!/usr/bin/env node
/**
 * CRASH-TEST-V2 - Crash-level validator for Swisshtml memory engine
 *
 * WARNING: This script WILL spawn and SIGKILL a server process and uses an isolated LevelDB path by default.
 * Do NOT run against production DB paths.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as persistence from '../Knowledge-Vault/memory_engine/persistence.js';
import * as graphHashUtil from './utils/graphHash.js';
import * as deepDiff from './utils/deepDiff.js';

const TEST_DB = process.env.TEST_DB_PATH || './data/kv_crashtest';
const SERVER_CMD = process.env.SERVER_CMD || 'node';
const SERVER_SCRIPT = process.env.SERVER_SCRIPT || 'server/index.js';
const REPORT_PATH = './tests/crash-test-v2-result.json';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function startServer(env = {}) {
  const proc = spawn(SERVER_CMD, [SERVER_SCRIPT], { env: { ...process.env, ...env, TEST_DB_PATH: TEST_DB }, stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stdout.on('data', d => process.stdout.write(`[server stdout] ${d}`));
  proc.stderr.on('data', d => process.stderr.write(`[server stderr] ${d}`));
  return proc;
}

async function killServer(proc) {
  return new Promise((resolve) => {
    try {
      process.kill(proc.pid, 'SIGKILL');
    } catch (e) {
      // ignore if already dead
    }
    proc.on('close', () => resolve());
    // fallback
    setTimeout(resolve, 1000);
  });
}

async function snapshot() {
  return await persistence.exportAll();
}

async function runWorkload() {
  // lightweight workload: ingest a few fragments and run merge via direct module calls
  const identity = await import('../Knowledge-Vault/memory_engine/identity_persistent.js');
  const merge = await import('../Knowledge-Vault/memory_engine/merge_engine.js');
  const truth = await import('../Knowledge-Vault/memory_engine/truth_bayes.js');

  const frag1 = { id: `frag:${Date.now()}:1`, text: 'Water boils at 100°C', source: { trust: 0.8 }, confidence: 0.9 };
  const frag2 = { id: `frag:${Date.now()}:2`, text: 'Boiling point of water is 100 degrees C', source: { trust: 0.7 }, confidence: 0.85 };
  const frag3 = { id: `frag:${Date.now()}:3`, text: 'Water does not boil at 100°C under reduced pressure', source: { trust: 0.6 }, confidence: 0.7 };

  const r1 = await identity.indexFragment(frag1);
  await sleep(50);
  const r2 = await identity.indexFragment(frag2);
  await sleep(50);
  const r3 = await identity.indexFragment(frag3);

  // attempt merge similar fragments
  const canonical = await merge.createCanonical({ fragments: [frag1.id, frag2.id], mergeMethod: 'lexical' });

  // update belief
  await truth.updateBeliefWithEvidence(canonical.id, { type: 'direct', strength: 0.9, source: { trust: 0.8 } });

  // append a BELIEF_REMAP_EVENT simulation
  await truth.remapBeliefsAfterMerge({ mergedFrom: [frag1.id, frag2.id], oldCanonicalId: r1.canonicalId || null, newCanonicalId: canonical.id });

  return { frag1, frag2, frag3, canonical };
}

async function runOnce(runId = 'A') {
  // ensure clean DB path
  if (fs.existsSync(TEST_DB)) fs.rmSync(TEST_DB, { recursive: true, force: true });
  await persistence.init(TEST_DB);

  console.log(`Run ${runId}: starting server`);
  const server = await startServer({ TEST_DB_PATH: TEST_DB });
  // wait for server to boot
  await sleep(1000);

  console.log(`Run ${runId}: running workload`);
  const workload = await runWorkload();

  console.log(`Run ${runId}: snapshot before crash`);
  const snapBefore = await snapshot();
  const beforeHash = graphHashUtil.graphHashFromSnapshot(snapBefore);

  console.log(`Run ${runId}: killing server (SIGKILL)`);
  await killServer(server);

  console.log(`Run ${runId}: restarting server`);
  const server2 = await startServer({ TEST_DB_PATH: TEST_DB });
  await sleep(1000);

  console.log(`Run ${runId}: snapshot after restart`);
  // re-init persistence client
  await persistence.init(TEST_DB);
  const snapAfter = await snapshot();
  const afterHash = graphHashUtil.graphHashFromSnapshot(snapAfter);

  // rebuild graph from mergeLog only (simulate replay)
  console.log(`Run ${runId}: rebuilding graph from mergeLog`);
  const merge = await import('../Knowledge-Vault/memory_engine/merge_engine.js');
  const rebuild = await merge.buildMergeGraph();

  // cleanup server
  await killServer(server2);

  return { snapBefore, snapAfter, beforeHash, afterHash, rebuild };
}

async function runCrashV2() {
  const report = { start: new Date().toISOString(), tests: [] };

  // Run A
  const a = await runOnce('A');
  // Run B (second full run to test determinism)
  const b = await runOnce('B');

  // Compare graph hashes
  const hashesMatch = a.beforeHash.hash === b.beforeHash.hash && a.afterHash.hash === b.afterHash.hash;

  // Compare before vs after for run A
  const runA_consistent = a.beforeHash.hash === a.afterHash.hash;

  // Deep structural diff between snapshots
  const ddA = deepDiff.deepDiff(a.snapBefore, a.snapAfter);
  const ddB = deepDiff.deepDiff(b.snapBefore, b.snapAfter);
  const ddAB = deepDiff.deepDiff(a.snapAfter, b.snapAfter);

  // Event integrity: ensure mergeLog counts preserved and events not mutated
  const mergeCountA = (a.snapAfter.mergeLog || []).length;
  const mergeCountB = (b.snapAfter.mergeLog || []).length;

  report.tests.push({ run: 'A', hashBefore: a.beforeHash, hashAfter: a.afterHash, consistent: runA_consistent, diff: ddA, mergeCount: mergeCountA });
  report.tests.push({ run: 'B', hashBefore: b.beforeHash, hashAfter: b.afterHash, diff: ddB, mergeCount: mergeCountB });
  report.determinism = { hashesMatch, beforeHashA: a.beforeHash.hash, beforeHashB: b.beforeHash.hash, afterHashA: a.afterHash.hash, afterHashB: b.afterHash.hash };
  report.runDiff = ddAB;
  report.end = new Date().toISOString();

  // Save report
  if (!fs.existsSync('./tests')) fs.mkdirSync('./tests', { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('Crash test v2 completed. Report written to', REPORT_PATH);
  console.log('Summary:');
  console.log(' - determinism hashesMatch:', hashesMatch);
  console.log(' - runA consistent (before==after):', runA_consistent);
  console.log(' - merge counts A/B:', mergeCountA, mergeCountB);
}

runCrashV2().catch(err => {
  console.error('crash-test-v2 failed', err);
  process.exit(2);
});
