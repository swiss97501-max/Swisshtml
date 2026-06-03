export function calculateTruthScore(claim) {

    let score = 50; // base neutral

    // 1. Evidence
    if (claim.evidence && claim.evidence.length > 0) {
        score += Math.min(claim.evidence.length * 8, 25);
    }

    // 2. Source quality
    if (claim.sourceType === "peer-reviewed") {
        score += 20;
    } else if (claim.sourceType === "book") {
        score += 10;
    } else if (claim.sourceType === "internet") {
        score += 3;
    }

    // 3. Consistency bonus
    if (!claim.hasContradiction) {
        score += 15;
    }

    // 4. Confidence clamp
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return score;
}
