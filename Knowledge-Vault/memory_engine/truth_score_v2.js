/**
 * TRUTH SCORE v2 - ระบบตรวจความจริงแบบ Multi-Factor
 */

import { getGraph as getCausalGraph } from './causal.js';
import { detect as detectContradictions } from './contradiction_v2.js';

const truthScoreDatabase = new Map();

/**
 * 1. EVIDENCE STRENGTH
 */
export function calculateEvidenceStrength(claim, evidence = []) {
    if (!evidence || evidence.length === 0) return 0;
    
    const strengthMap = {
        'direct': 100,
        'statistical': 85,
        'expert_testimony': 80,
        'peer_review': 90,
        'experimental': 95,
        'observational': 70,
        'anecdotal': 40,
        'hearsay': 10,
        'unknown': 50
    };
    
    let totalStrength = 0;
    evidence.forEach(ev => {
        const type = ev.type || 'unknown';
        totalStrength += strengthMap[type] || 50;
    });
    
    return Math.round(totalStrength / evidence.length);
}

/**
 * 2. SOURCE RELIABILITY
 */
export function calculateSourceReliability(sources = []) {
    if (!sources || sources.length === 0) return 50;
    
    const reliabilityMap = {
        'peer_reviewed': 95,
        'academic': 90,
        'government': 85,
        'major_news': 75,
        'reputable_organization': 80,
        'domain_expert': 85,
        'verified_user': 60,
        'unverified_user': 30,
        'social_media': 20,
        'blog': 40,
        'forum': 35,
        'unknown': 50
    };
    
    let totalReliability = 0;
    sources.forEach(source => {
        const category = source.category || 'unknown';
        totalReliability += reliabilityMap[category] || 50;
    });
    
    return Math.round(totalReliability / sources.length);
}

/**
 * 3. CONTRADICTION CHECK
 */
export function calculateContradictionPenalty(claim) {
    const contradictions = detectContradictions();
    if (!contradictions) return 0;
    
    let contradictionCount = 0;
    let severeContradiction = false;
    
    contradictions.forEach(c => {
        if (c.claim1.includes(claim.slice(0, 30)) || c.claim2.includes(claim.slice(0, 30))) {
            contradictionCount++;
            if (c.severity === 'direct_contradiction') {
                severeContradiction = true;
            }
        }
    });
    
    if (severeContradiction) return 100;
    if (contradictionCount > 3) return 70;
    if (contradictionCount > 0) return 40;
    return 0;
}

/**
 * 4. CAUSAL VALIDITY
 */
export function calculateCausalValidity(claim, causalRelations = []) {
    const causalGraph = getCausalGraph();
    
    if (!causalRelations || causalRelations.length === 0) {
        return 50;
    }
    
    let validityScore = 0;
    let validCount = 0;
    
    causalRelations.forEach(relation => {
        const cause = relation.cause;
        const effect = relation.effect;
        
        if (causalGraph[cause] && causalGraph[cause].includes(effect)) {
            validityScore += 90;
        } else if (isPlausibleCausality(cause, effect)) {
            validityScore += 60;
        } else {
            validityScore += 20;
        }
        validCount++;
    });
    
    return validCount > 0 ? Math.round(validityScore / validCount) : 50;
}

/**
 * Check if causality is plausible
 */
function isPlausibleCausality(cause, effect) {
    const causeLower = cause.toLowerCase();
    const effectLower = effect.toLowerCase();
    
    const temporalIndicators = ['causes', 'leads', 'results', 'produces', 'affects', 'influences'];
    return temporalIndicators.some(indicator => 
        causeLower.includes(indicator) || effectLower.includes(indicator)
    );
}

/**
 * 5. CROSS-SOURCE AGREEMENT
 */
export function calculateCrossSourceAgreement(claim, sources = []) {
    if (!sources || sources.length === 0) return 50;
    
    const supportingSources = sources.filter(s => s.supportsClaim === true);
    const sourceCount = supportingSources.length;
    
    if (sourceCount >= 3) return 95;
    if (sourceCount === 2) return 80;
    if (sourceCount === 1) return 60;
    return 20;
}

/**
 * COMPOSITE TRUTH SCORE
 */
export function calculateCompositeTruthScore(claimData) {
    const {
        claim,
        evidence = [],
        sources = [],
        causalRelations = [],
        contradictionCount = 0
    } = claimData;
    
    const evidenceStrength = calculateEvidenceStrength(claim, evidence);
    const sourceReliability = calculateSourceReliability(sources);
    const causalValidity = calculateCausalValidity(claim, causalRelations);
    const crossSourceAgreement = calculateCrossSourceAgreement(claim, sources);
    const contradictionPenalty = Math.min(100, calculateContradictionPenalty(claim));
    
    const truthScore = Math.round(
        (evidenceStrength * 0.25) +
        (sourceReliability * 0.25) +
        (causalValidity * 0.20) +
        (crossSourceAgreement * 0.20) -
        (contradictionPenalty * 0.10)
    );
    
    const finalScore = Math.max(0, Math.min(100, truthScore));
    
    return {
        score: finalScore,
        breakdown: {
            evidenceStrength,
            sourceReliability,
            causalValidity,
            crossSourceAgreement,
            contradictionPenalty
        },
        confidence: Math.round(
            (evidenceStrength + sourceReliability + causalValidity) / 3
        ),
        recommendation: getTruthRecommendation(finalScore)
    };
}

/**
 * Get Recommendation
 */
function getTruthRecommendation(score) {
    if (score >= 90) return 'HIGHLY_CREDIBLE';
    if (score >= 75) return 'CREDIBLE';
    if (score >= 50) return 'QUESTIONABLE';
    if (score >= 25) return 'LIKELY_FALSE';
    return 'HIGHLY_DUBIOUS';
}

/**
 * Store Truth Score
 */
export function storeTruthScore(claimId, truthScoreData) {
    truthScoreDatabase.set(claimId, {
        ...truthScoreData,
        storedAt: new Date().toISOString()
    });
}

/**
 * Get Truth Score
 */
export function getTruthScore(claimId) {
    return truthScoreDatabase.get(claimId);
}

/**
 * Batch Calculate Truth Scores
 */
export function calculateBatchTruthScores(claims) {
    return claims.map(claim => {
        const result = calculateCompositeTruthScore(claim);
        storeTruthScore(claim.id, result);
        return {
            id: claim.id,
            claim: claim.claim,
            ...result
        };
    });
}

/**
 * Generate Truth Report
 */
export function generateTruthReport(claims) {
    const scores = calculateBatchTruthScores(claims);
    
    const credible = scores.filter(s => s.score >= 75);
    const questionable = scores.filter(s => s.score >= 50 && s.score < 75);
    const dubious = scores.filter(s => s.score < 50);
    
    return {
        summary: {
            totalClaims: scores.length,
            credibleCount: credible.length,
            questionableCount: questionable.length,
            dubiousCount: dubious.length,
            averageScore: Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
        },
        byCategory: {
            credible,
            questionable,
            dubious
        },
        detailedScores: scores,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Compare Truth Scores
 */
export function compareTruthScores(claim1Data, claim2Data) {
    const score1 = calculateCompositeTruthScore(claim1Data);
    const score2 = calculateCompositeTruthScore(claim2Data);
    
    const diff = score1.score - score2.score;
    const winner = diff > 0 ? claim1Data.claim : claim2Data.claim;
    
    return {
        score1,
        score2,
        difference: Math.abs(diff),
        more_credible: winner,
        conclusion: diff > 20 ? 'SIGNIFICANT_DIFFERENCE' : 'SIMILAR_CREDIBILITY'
    };
}

export {
    calculateEvidenceStrength,
    calculateSourceReliability,
    calculateContradictionPenalty,
    calculateCausalValidity,
    calculateCrossSourceAgreement,
    calculateCompositeTruthScore
};