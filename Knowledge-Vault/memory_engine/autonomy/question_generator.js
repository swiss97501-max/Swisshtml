// Question Generator Module
// AI generates questions to explore and fill knowledge gaps

export function generateQuestions(knowledgeGaps, context) {
    const questions = [];
    
    // Generate clarifying questions
    knowledgeGaps.forEach(gap => {
        questions.push(`What is the relationship between ${gap.entity1} and ${gap.entity2}?`);
    });
    
    return questions;
}

export function prioritizeQuestions(questions, interestLevel) {
    return questions.sort((a, b) => b.priority - a.priority);
}
