import { ApiResponse } from '../../types';
import {
    Question,
    ExamSubmission,
    GradingResult,
    QuestionResult,
    StudentAnswer
} from './types';
import { calculateGrade, compareTextAnswers } from './utils';

class GradingService {
    async gradeExam(
        questions: Question[],
        submission: ExamSubmission
    ): Promise<ApiResponse<GradingResult>> {
        try {
            const questionResults: QuestionResult[] = [];
            let totalPoints = 0;
            let obtainedPoints = 0;
            let correctAnswers = 0;

            const answerMap = new Map(
                submission.answers.map(answer => [answer.questionId, answer])
            );

            for (const question of questions) {
                const answer = answerMap.get(question.id);
                const questionResult = this.gradeQuestion(question, answer);

                questionResults.push(questionResult);
                totalPoints += question.points;
                obtainedPoints += questionResult.obtainedPoints;

                if (questionResult.isCorrect) {
                    correctAnswers++;
                }
            }

            const percentage = totalPoints > 0 ? (obtainedPoints / totalPoints) * 100 : 0;
            const grade = calculateGrade(percentage);
            const passed = percentage >= 50;

            const result: GradingResult = {
                examId: submission.examId,
                studentId: submission.studentId,
                totalQuestions: questions.length,
                attemptedQuestions: submission.answers.length,
                correctAnswers,
                totalPoints,
                obtainedPoints,
                percentage: Math.round(percentage * 100) / 100,
                grade,
                passed,
                timeSpent: submission.timeSpent,
                submittedAt: submission.submittedAt,
                gradedAt: new Date().toISOString(),
                questionResults,
            };

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Grading failed',
            };
        }
    }

    private gradeQuestion(question: Question, answer?: StudentAnswer): QuestionResult {
        const baseResult = {
            questionId: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            correctAnswer: question.correctAnswer,
            points: question.points,
            explanation: question.explanation,
            timeSpent: answer?.timeSpent || 0,
            markedForReview: answer?.markedForReview || false,
        };

        if (!answer) {
            return {
                ...baseResult,
                studentAnswer: 'Not attempted',
                isCorrect: false,
                obtainedPoints: 0,
            };
        }

        switch (question.questionType) {
            case 'multiple_choice':
                return this.gradeMultipleChoice(question, answer);
            case 'true_false':
                return this.gradeTrueFalse(question, answer);
            case 'short_answer':
                return this.gradeShortAnswer(question, answer);
            case 'essay':
                return this.gradeEssay(question, answer);
            default:
                return {
                    ...baseResult,
                    studentAnswer: 'Unknown question type',
                    isCorrect: false,
                    obtainedPoints: 0,
                };
        }
    }

    private gradeMultipleChoice(question: Question, answer: StudentAnswer): QuestionResult {
        const selectedOption = question.options?.find(opt => opt.id === answer.selectedOption);
        const studentAnswer = selectedOption?.text || 'Not selected';
        const isCorrect = selectedOption?.text === question.correctAnswer;

        return {
            ...this.getBaseResult(question, answer),
            studentAnswer,
            isCorrect,
            obtainedPoints: isCorrect ? question.points : 0,
        };
    }

    private gradeTrueFalse(question: Question, answer: StudentAnswer): QuestionResult {
        const selectedOption = question.options?.find(opt => opt.id === answer.selectedOption);
        const studentAnswer = selectedOption?.text || 'Not selected';
        const isCorrect = studentAnswer.toLowerCase() === question.correctAnswer.toString().toLowerCase();

        return {
            ...this.getBaseResult(question, answer),
            studentAnswer,
            isCorrect,
            obtainedPoints: isCorrect ? question.points : 0,
        };
    }

    private gradeShortAnswer(question: Question, answer: StudentAnswer): QuestionResult {
        const studentAnswer = answer.textAnswer || 'Not answered';
        const correctAnswer = Array.isArray(question.correctAnswer)
            ? question.correctAnswer[0]
            : question.correctAnswer;

        const isCorrect = compareTextAnswers(studentAnswer, correctAnswer as string);

        return {
            ...this.getBaseResult(question, answer),
            correctAnswer,
            studentAnswer,
            isCorrect,
            obtainedPoints: isCorrect ? question.points : 0,
        };
    }

    private gradeEssay(question: Question, answer: StudentAnswer): QuestionResult {
        const studentAnswer = answer.textAnswer || 'Not answered';

        return {
            ...this.getBaseResult(question, answer),
            studentAnswer,
            isCorrect: false,
            obtainedPoints: 0,
        };
    }

    private getBaseResult(question: Question, answer: StudentAnswer) {
        return {
            questionId: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            correctAnswer: question.correctAnswer,
            points: question.points,
            explanation: question.explanation,
            timeSpent: answer.timeSpent,
            markedForReview: answer.markedForReview,
        };
    }

    async batchGrade(
        questions: Question[],
        submissions: ExamSubmission[]
    ): Promise<ApiResponse<GradingResult[]>> {
        try {
            const results: GradingResult[] = [];
            for (const submission of submissions) {
                const result = await this.gradeExam(questions, submission);
                if (result.success && result.data) results.push(result.data);
            }
            return { success: true, data: results };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Batch grading failed',
            };
        }
    }

    async getGradingStatistics(_examId: number): Promise<ApiResponse<any>> {
        const mockStats = {
            totalSubmissions: 45,
            averageScore: 72.5,
            passRate: 78.5,
            gradeDistribution: { 'A+': 5, 'A': 8, 'F': 8 },
            averageTimeSpent: 5400,
        };
        return { success: true, data: mockStats };
    }
}

export default new GradingService();
