import { ApiResponse } from '../../types';

export interface Question {
    id: number;
    questionText: string;
    questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    options?: Array<{
        id: number;
        text: string;
    }>;
    correctAnswer: string | string[];
    points: number;
    explanation?: string;
}

export interface StudentAnswer {
    questionId: number;
    selectedOption?: number;
    textAnswer?: string;
    timeSpent: number; // in seconds
    markedForReview: boolean;
}

export interface ExamSubmission {
    examId: number;
    studentId: number;
    answers: StudentAnswer[];
    startTime: string;
    endTime: string;
    timeSpent: number; // in seconds
    submittedAt: string;
}

export interface GradingResult {
    examId: number;
    studentId: number;
    totalQuestions: number;
    attemptedQuestions: number;
    correctAnswers: number;
    totalPoints: number;
    obtainedPoints: number;
    percentage: number;
    grade: string;
    passed: boolean;
    timeSpent: number;
    submittedAt: string;
    gradedAt: string;
    questionResults: QuestionResult[];
}

export interface QuestionResult {
    questionId: number;
    questionText: string;
    questionType: string;
    correctAnswer: string | string[];
    studentAnswer: string;
    isCorrect: boolean;
    points: number;
    obtainedPoints: number;
    explanation?: string;
    timeSpent: number;
    markedForReview: boolean;
}
