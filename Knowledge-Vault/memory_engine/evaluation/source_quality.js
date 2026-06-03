// Source Quality Evaluation Module

const sourceQualityWeights = {
    "peer-reviewed": 1.0,
    "book": 0.8,
    "news": 0.6,
    "internet": 0.4,
    "social-media": 0.2
};

export function evaluateSourceQuality(source) {
    return sourceQualityWeights[source.type] || 0.3;
}

export function rankSourcesByQuality(sources) {
    return sources.sort((a, b) => {
        return evaluateSourceQuality(b) - evaluateSourceQuality(a);
    });
}
