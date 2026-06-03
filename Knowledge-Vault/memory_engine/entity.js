export function extractEntities(text) {

    const words = text.match(/\b[A-Z][a-zA-Z]+\b/g);

    if(!words) return [];

    return [...new Set(words)];

}
