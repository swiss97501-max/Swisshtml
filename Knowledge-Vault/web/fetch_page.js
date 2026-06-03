// Page Fetching Module
// Fetches and retrieves HTML content from URLs

export async function fetchPage(url) {
    try {
        const response = await fetch(url);
        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}
