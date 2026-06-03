// Web Content Reader
// Extracts knowledge from web pages

import { fetchPage } from './fetch_page.js';
import { parseHTML } from './parser_html.js';

export async function readPage(url) {
    const html = await fetchPage(url);
    if (!html) return null;
    
    const text = parseHTML(html);
    return {
        url,
        text,
        extractedAt: new Date().toISOString()
    };
}
