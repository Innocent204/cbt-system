import { describe, it, expect } from 'vitest';
import { calculateGrade, compareTextAnswers } from './utils';

describe('Grading Utils', () => {
    describe('calculateGrade', () => {
        it('should return A+ for scores >= 90', () => {
            expect(calculateGrade(95)).toBe('A+');
            expect(calculateGrade(90)).toBe('A+');
        });

        it('should return B for scores between 70 and 75', () => {
            expect(calculateGrade(72)).toBe('B');
        });

        it('should return F for scores < 45', () => {
            expect(calculateGrade(40)).toBe('F');
        });
    });

    describe('compareTextAnswers', () => {
        it('should return true for exact matches', () => {
            expect(compareTextAnswers('React', 'React')).toBe(true);
        });

        it('should return true for case-insensitive matches', () => {
            expect(compareTextAnswers('react', 'React')).toBe(true);
        });

        it('should return true if student answer is contained in correct answer', () => {
            expect(compareTextAnswers('DNA', 'Deoxyribonucleic Acid (DNA)')).toBe(true);
        });

        it('should handle common variations like articles', () => {
            expect(compareTextAnswers('the apple', 'apple')).toBe(true);
            expect(compareTextAnswers('apple', 'the apple')).toBe(true);
        });
    });
});
