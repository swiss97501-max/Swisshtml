export async function createLevel(dbPath, opts = { valueEncoding: 'json' }) {
  // Try dynamic ESM import first
  try {
    const mod = await import('level');
    const LevelCtor = mod.Level || mod.default || mod;
    if (typeof LevelCtor === 'function') {
      return new LevelCtor(dbPath, opts);
    }
    // Some versions export a factory function
    if (typeof LevelCtor === 'object' && typeof LevelCtor.level === 'function') {
      return LevelCtor.level(dbPath, opts);
    }
  } catch (e) {
    // fallback to require via createRequire for environments where import('level') fails
    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const modc = require('level');
      const LevelCtor = modc.Level || modc.default || modc;
      if (typeof LevelCtor === 'function') return new LevelCtor(dbPath, opts);
      if (typeof LevelCtor === 'object' && typeof LevelCtor.level === 'function') return LevelCtor.level(dbPath, opts);
    } catch (e2) {
      // rethrow original for visibility
      throw new Error('Failed to load level package: ' + (e && e.message));
    }
  }
  throw new Error('Unsupported level package export shape');
}
