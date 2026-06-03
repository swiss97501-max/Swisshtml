import { normalize } from "./normalize.js";

export function extractClaims(text) {

    const sentences = text
        .split(/[.!?]/)
        .map(x => x.trim())
        .filter(Boolean);

    return sentences.map((sentence, index) => {

        return {
            id: `CLM-${Date.now()}-${index}`,
            original: sentence,
            normalized: normalize(sentence),
            confidence: 50,
            sources: [],
            createdAt: new Date().toISOString()
        };

    });

}
