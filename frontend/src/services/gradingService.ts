import api from './api';
import { ApiResponse } from '../types';

export interface PendingGradingAnswer {
  id: number;
  attempt: number;
  question: number;
  question_text: string;
  question_marks: string;
  answer_text: string;
  is_correct: boolean | null;
  marks_obtained: string;
  is_graded: boolean;
  feedback: string | null;
  answered_at: string;
}

class GradingService {
  /**
   * Fetch answers requiring manual grading
   */
  async getPendingGrading(examId?: number): Promise<ApiResponse<PendingGradingAnswer[]>> {
    try {
      const params = examId ? { exam_id: examId } : {};
      const response = await api.get('/questions/answers/pending_grading/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch pending answers'
      };
    }
  }

  /**
   * Submit grade and feedback for an answer
   */
  async submitGrade(answerId: number, data: { marks_obtained: number; feedback: string }): Promise<ApiResponse<any>> {
    try {
      const response = await api.post(`/questions/answers/${answerId}/submit_grade/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to submit grade'
      };
    }
  }
}

export default new GradingService();
