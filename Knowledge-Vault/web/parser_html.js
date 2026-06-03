// HTML Parser Module
// Extracts clean text from HTML content

export function parseHTML(htmlContent) {
    // Remove script and style elements
    let text = htmlContent
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    return text;
}

export function extractMainContent(htmlContent) {
    // Extract main content from HTML
    return parseHTML(htmlContent);
}
