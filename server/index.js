import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Import memory engine modules (ES modules expected)
import identity from '../Knowledge-Vault/memory_engine/identity.js';
import mergeEngine from '../Knowledge-Vault/memory_engine/merge_engine.js';
import truthBayes from '../Knowledge-Vault/memory_engine/truth_bayes.js';
import autonomy from '../Knowledge-Vault/memory_engine/autonomy_loop.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Ingest fragment -> indexFragment (identity layer)
app.post('/ingest', async (req, res) => {
  try {
    const fragment = req.body;
    if (!fragment || !fragment.id || !fragment.text) return res.status(400).json({ error: 'fragment.id and fragment.text required' });
    const result = await identity.indexFragment(fragment);
    return res.json(result);
  } catch (err) {
    console.error('ingest error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Trigger merge for a cluster of fragment IDs
app.post('/merge', (req, res) => {
  try {
    const { fragmentIds, method } = req.body;
    if (!Array.isArray(fragmentIds) || fragmentIds.length === 0) return res.status(400).json({ error: 'fragmentIds required' });
    const canonical = mergeEngine.createCanonicalFromFragments(fragmentIds, method || 'lexical');
    return res.json({ canonical });
  } catch (err) {
    console.error('merge error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Get canonical node
app.get('/canonical/:id', (req, res) => {
  try {
    const id = req.params.id;
    const canon = identity.getCanonical(id);
    if (!canon) return res.status(404).json({ error: 'not found' });
    return res.json(canon);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Get fragment
app.get('/fragment/:id', (req, res) => {
  try {
    const id = req.params.id;
    const frag = identity.getFragment(id);
    if (!frag) return res.status(404).json({ error: 'not found' });
    return res.json(frag);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Export index snapshot
app.get('/export', (req, res) => {
  try {
    const idx = identity.exportIndex();
    return res.json(idx);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Belief endpoints (canonical-first)
app.post('/belief/update', (req, res) => {
  try {
    const { canonicalId, evidence } = req.body;
    if (!canonicalId || !evidence) return res.status(400).json({ error: 'canonicalId and evidence required' });
    // truth_bayes expects evidence: { type, strength, sourceTrust }
    const updated = truthBayes.updateBeliefWithEvidence(canonicalId, evidence);
    return res.json({ canonicalId, belief: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/belief/:canonicalId', (req, res) => {
  try {
    const id = req.params.canonicalId;
    const b = truthBayes.getBelief(id);
    if (b === undefined) return res.status(404).json({ error: 'not found' });
    return res.json({ canonicalId: id, belief: b });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// MergeGraph build
app.get('/merge-graph', (req, res) => {
  try {
    const graph = mergeEngine.buildMergeGraph();
    return res.json(graph);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Start autonomy loop if available (non-blocking)
(async () => {
  try {
    if (autonomy && typeof autonomy.start === 'function') {
      console.log('Starting autonomy loop...');
      // call start and pass hooks to interact with server if supported
      autonomy.start({ interval: process.env.AUTONOMY_INTERVAL || 60000 });
    } else if (autonomy && typeof autonomy.run === 'function') {
      console.log('Starting autonomy.run (fallback)...');
      autonomy.run({ interval: process.env.AUTONOMY_INTERVAL || 60000 });
    } else {
      console.log('Autonomy loop module found but no start/run function exported. Skipping auto-start.');
    }
  } catch (err) {
    console.error('autonomy start failed', err);
  }
})();

app.listen(PORT, () => console.log(`Memory engine server listening on port ${PORT}`));
