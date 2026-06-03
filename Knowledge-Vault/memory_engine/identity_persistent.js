import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as persistence from './persistence.js';

// Identity + Merge helper (persistence-backed)

export function normalize(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function contentHash(text) {
  const norm = normalize(text);
  return crypto.createHash('sha256').update(norm).digest('hex');
}

export function shingle(text, k = 5) {
  const norm = normalize(text);
  const tokens = norm.split(/\s+/);
  const shingles = new Set();
  for (let i = 0; i <= tokens.length - k; i++) {
    shingles.add(tokens.slice(i, i + k).join(' '));
  }
  if (shingles.size === 0 && tokens.length > 0) shingles.add(tokens.join(' '));
  return Array.from(shingles);
}

// fast similarity (Jaccard) using shingles
export function jaccard(aShingles, bShingles) {
  const A = new Set(aShingles);
  const B = new Set(bShingles);
  const inter = new Set([...A].filter(x => B.has(x))).size;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

export async function findCandidates(fragment, threshold = 0.3) {
  // Read current canonicals from persistence and compare
  const result = [];
  const exportAll = await persistence.exportAll();
  const fragmentShingles = shingle(fragment.text || '');
  for (const [id, canonical] of Object.entries(exportAll.canonicals)) {
    const view = (canonical.views && canonical.views.lexical) || canonical.text || '';
    const cShingles = shingle(view);
    const score = jaccard(fragmentShingles, cShingles);
    if (score >= threshold) {
      result.push({ canonicalId: id, score, canonical });
    }
  }
  // sort by score desc
  result.sort((a, b) => b.score - a.score);
  return result;
}

// deterministic selection rule per policy: trust (not implemented) > earliest created_at > longest text > fragment id
function deterministicSelect(candidates) {
  if (!candidates || candidates.length === 0) return null;
  // candidates have canonical.value with created_at and views.lexical
  candidates.sort((a, b) => {
    const aTime = a.canonical.created_at || 0;
    const bTime = b.canonical.created_at || 0;
    if (aTime !== bTime) return aTime - bTime; // earliest first
    const aLen = ((a.canonical.views && a.canonical.views.lexical) || '').length;
    const bLen = ((b.canonical.views && b.canonical.views.lexical) || '').length;
    if (aLen !== bLen) return bLen - aLen; // longest text first
    return a.canonical.id.localeCompare(b.canonical.id);
  });
  return candidates[0];
}

export async function indexFragment(fragment) {
  // compute id if not present
  if (!fragment.id) fragment.id = `frag:${contentHash(fragment.text || uuidv4())}`;
  // normalize and attach metadata
  const stored = {
    ...fragment,
    text: normalize(fragment.text || ''),
    contentHash: contentHash(fragment.text || ''),
    timestamp: fragment.timestamp || Date.now(),
  };

  // persist fragment first (persistence = truth)
  const persisted = await persistence.putFragment(stored);

  // find candidates
  const candidates = await findCandidates(persisted);
  let canonicalId = null;
  let candidateClusters = [];
  if (candidates.length > 0) {
    candidateClusters = candidates.map(c => ({ canonicalId: c.canonicalId, score: c.score }));
    const selected = deterministicSelect(candidates);
    if (selected) canonicalId = selected.canonicalId;
  }

  // If no canonical found -> create new canonical via merge engine
  if (!canonicalId) {
    // lazy load merge_engine to avoid circular
    const { createCanonical } = await import('./merge_engine.js');
    const canonical = await createCanonical({
      text: persisted.text,
      fragments: [persisted.id],
      source: persisted.source || null,
      created_at: Date.now(),
      views: { lexical: persisted.text }
    });
    canonicalId = canonical.id;
    // record merge event already created inside createCanonical
  } else {
    // attach fragment -> canonical mapping as merge event (idempotent)
    await persistence.appendMergeEvent({
      type: 'MERGE_FRAGMENT_TO_CANONICAL',
      fragmentId: persisted.id,
      canonicalId,
      merge_method: 'similarity:shingle_jaccard',
      merge_confidence: candidateClusters[0] && candidateClusters[0].score || 0,
      timestamp: Date.now()
    });
    // update canonical fragments list (append-only semantics via putCanonical merging)
    const canonical = await persistence.getCanonical(canonicalId);
    const fragments = new Set((canonical && canonical.fragments) || []);
    fragments.add(persisted.id);
    const updated = {
      ...(canonical || {}),
      fragments: Array.from(fragments),
      views: { ...(canonical && canonical.views), lexical: (canonical && canonical.views && canonical.views.lexical) || persisted.text }
    };
    await persistence.putCanonical(updated);
  }

  // return deterministic mapping info
  return { fragment: persisted, canonicalId, candidateClusters };
}
