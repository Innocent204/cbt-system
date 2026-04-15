export const compareTextAnswers = (studentAnswer: string, correctAnswer: string): boolean => {
    if (!studentAnswer || !correctAnswer) return false;

    const cleanStudent = studentAnswer.trim().toLowerCase();
    const cleanCorrect = correctAnswer.trim().toLowerCase();

    if (cleanStudent === cleanCorrect) return true;
    if (cleanStudent.includes(cleanCorrect) || cleanCorrect.includes(cleanStudent)) return true;

    const variations = getAnswerVariations(cleanCorrect);
    return variations.some(variation => cleanStudent === variation);
};

export const getAnswerVariations = (answer: string): string[] => {
    const variations = [answer];

    if (answer.startsWith('a ') || answer.startsWith('an ') || answer.startsWith('the ')) {
        variations.push(answer.replace(/^(a|an|the)\s+/, ''));
    }

    if (answer.includes('x') || answer.includes('y')) {
        variations.push(answer.replace(/\s+/g, ''));
    }

    return variations;
};

export const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D';
    return 'F';
};
