import api from './api';
import { ApiResponse } from '../types';

export interface Question {
    id: number;
    course: number;
    exam?: number;
    question_type: 'mcq' | 'true_false' | 'short_answer';
    difficulty: 'easy' | 'medium' | 'hard';
    text: string;
    image?: string;
    marks: number;
    order: number;
    correct_answer_text?: string;
    options?: Option[];
    created_at?: string;
    updated_at?: string;
}

export interface Option {
    id: number;
    question: number;
    text: string;
    is_correct: boolean;
    order: number;
}

class QuestionService {
    /**
     * Fetch all questions, optionally filtered by exam
     */
    async getQuestions(examId?: number, courseId?: number): Promise<ApiResponse<Question[]>> {
        try {
            const params: any = {};
            if (examId) params.exam_id = examId;
            if (courseId) params.course_id = courseId;

            const response = await api.get<any>('/questions/questions/', { params });
            const data = response.data.results !== undefined ? response.data.results : response.data;
            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch questions'
            };
        }
    }

    /**
     * Bulk import questions from a file (CSV/JSON)
     */
    async bulkImport(examId: number | undefined, file: File, bankId?: number, courseId?: number): Promise<ApiResponse<{ message: string; created_count: number; errors?: string[] }>> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (examId) formData.append('exam_id', examId.toString());
            if (bankId) formData.append('bank_id', bankId.toString());
            if (courseId) formData.append('course_id', courseId.toString());

            const response = await api.post('/questions/questions/bulk_import/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorData = error.response?.data;
            let errorMessage = errorData?.error || 'Failed to import questions';

            if (errorData?.errors && Array.isArray(errorData.errors)) {
                errorMessage = `${errorMessage} (${errorData.errors[0]})`;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Get a single question by ID
     */
    async getQuestion(id: number): Promise<ApiResponse<Question>> {
        try {
            const response = await api.get<Question>(`/questions/questions/${id}/`);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch question'
            };
        }
    }

    /**
     * Create a new question
     */
    async createQuestion(data: any): Promise<ApiResponse<Question>> {
        try {
            const response = await api.post<Question>('/questions/questions/', data);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create question'
            };
        }
    }

    /**
     * Update an existing question
     */
    async updateQuestion(id: number, data: any): Promise<ApiResponse<Question>> {
        try {
            const response = await api.patch<Question>(`/questions/questions/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update question'
            };
        }
    }

    /**
     * Delete a question
     */
    async deleteQuestion(id: number): Promise<ApiResponse<void>> {
        try {
            await api.delete(`/questions/questions/${id}/`);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete question'
            };
        }
    }

    /**
     * Get distractor analysis stats for a question
     */
    async getDistractorAnalysis(questionId: number): Promise<ApiResponse<any>> {
        try {
            const response = await api.get(`/questions/questions/${questionId}/distractor_analysis/`);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch distractor analysis'
            };
        }
    }

    /**
     * Get all question banks
     */
    async getQuestionBanks(): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get<any>('/questions/pools/');
            let data = response.data;
            if (data.banks !== undefined) {
                data = data.banks;
            } else if (data.results !== undefined) {
                data = data.results;
            }
            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch question banks'
            };
        }
    }

    /**
     * Create a new question bank
     */
    async createQuestionBank(data: {
        name: string;
        description: string;
        course_id: number;
        easy_percentage?: number;
        medium_percentage?: number;
        hard_percentage?: number;
    }): Promise<ApiResponse<any>> {
        try {
            const response = await api.post('/questions/pools/', data);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create question bank'
            };
        }
    }

    /**
     * Update an existing question bank
     */
    async updateQuestionBank(id: number, data: Partial<{
        name: string;
        description: string;
        easy_percentage: number;
        medium_percentage: number;
        hard_percentage: number;
    }>): Promise<ApiResponse<any>> {
        try {
            const response = await api.patch(`/questions/pools/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update question bank'
            };
        }
    }
}

export default new QuestionService();
