import level from 'level';
import { v4 as uuidv4 } from 'uuid';

let db = null;

export async function init(dbPath = './data/kv') {
  if (db) return db;
  db = level(dbPath, { valueEncoding: 'json' });
  return db;
}

function ensureDB() {
  if (!db) throw new Error('DB not initialized. Call init(dbPath) first.');
}

export async function putFragment(fragment) {
  ensureDB();
  if (!fragment || !fragment.id) throw new Error('fragment.id required');
  const key = `fragment:${fragment.id}`;
  // idempotent write: check existing
  try {
    const existing = await db.get(key);
    // merge metadata: do not overwrite text, append canonicalId if present
    const merged = { ...existing, ...fragment };
    await db.put(key, merged);
    return merged;
  } catch (err) {
    if (err.type === 'NotFoundError') {
      await db.put(key, fragment);
      return fragment;
    }
    throw err;
  }
}

export async function getFragment(id) {
  ensureDB();
  try {
    return await db.get(`fragment:${id}`);
  } catch (err) {
    if (err.type === 'NotFoundError') return null;
    throw err;
  }
}

export async function putCanonical(canonical) {
  ensureDB();
  if (!canonical || !canonical.id) throw new Error('canonical.id required');
  const key = `canonical:${canonical.id}`;
  try {
    const existing = await db.get(key);
    // append-only semantics: do not replace 'views' or 'created_at' if present
    const merged = { ...existing, ...canonical };
    await db.put(key, merged);
    return merged;
  } catch (err) {
    if (err.type === 'NotFoundError') {
      await db.put(key, canonical);
      return canonical;
    }
    throw err;
  }
}

export async function getCanonical(id) {
  ensureDB();
  try {
    return await db.get(`canonical:${id}`);
  } catch (err) {
    if (err.type === 'NotFoundError') return null;
    throw err;
  }
}

export async function appendMergeEvent(event) {
  ensureDB();
  const ts = Date.now();
  const id = event.id || uuidv4();
  const key = `merge:${ts}:${id}`;
  const payload = { id, ts, ...event };
  await db.put(key, payload);
  return payload;
}

export async function getMergeLog() {
  ensureDB();
  return new Promise((resolve, reject) => {
    const res = [];
    db.createReadStream({
      gte: 'merge:',
      lte: 'merge:~'
    })
      .on('data', ({ key, value }) => res.push({ key, value }))
      .on('error', (err) => reject(err))
      .on('end', () => resolve(res));
  });
}

export async function exportAll() {
  ensureDB();
  const out = { fragments: {}, canonicals: {}, mergeLog: [] };
  return new Promise((resolve, reject) => {
    db.createReadStream()
      .on('data', ({ key, value }) => {
        if (key.startsWith('fragment:')) {
          out.fragments[key.slice(9)] = value;
        } else if (key.startsWith('canonical:')) {
          out.canonicals[key.slice(10)] = value;
        } else if (key.startsWith('merge:')) {
          out.mergeLog.push({ key, value });
        }
      })
      .on('error', (err) => reject(err))
      .on('end', () => resolve(out));
  });
}
