import { createRequire } from 'module';

/**
 * levelAdapter.createLevel(dbPath, opts)
 *
 * Normalizes different `level` package export shapes so callers can construct
 * a LevelDB instance reliably in both ESM and CJS environments.
 */
export async function createLevel(dbPath, opts = { valueEncoding: 'json' }) {
  // Try dynamic ESM import first
  try {
    const mod = await import('level');

    // If import returns an object wrapper (CJS transpiled), it may look like { module, exports }
    // In that case prefer using require() via createRequire below.
    const candidate = mod && (mod.Level || mod.default || mod);
    if (typeof candidate === 'function') {
      return new candidate(dbPath, opts);
    }

    // Not a constructor/function -> fallback to require
  } catch (e) {
    // swallow and fallback to require below
  }

  // Fallback: require('level') using createRequire to get the real CommonJS export
  try {
    const require = createRequire(import.meta.url);
    const modc = require('level');
    const candidate = modc && (modc.Level || modc.default || modc);
    if (typeof candidate === 'function') {
      return new candidate(dbPath, opts);
    }

    // Some older shapes exposed a factory function under .level
    if (candidate && typeof candidate.level === 'function') {
      return candidate.level(dbPath, opts);
    }

    throw new Error('Unsupported level package export shape — not a constructor');
  } catch (err) {
    throw new Error('Failed to load level package: ' + (err && err.message));
  }
}
