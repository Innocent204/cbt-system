import api from './api';
import { Course, Exam, CreateExamData, ApiResponse, ExamAttempt } from '../types';

class ExamService {
  // --- Courses ---

  async getCourses(params?: any): Promise<ApiResponse<Course[]>> {
    try {
      const response = await api.get<any>('/exams/courses/', { params });
      const data = response.data.results !== undefined ? response.data.results : response.data;
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch courses',
      };
    }
  }

  async createCourse(data: Partial<Course>): Promise<ApiResponse<Course>> {
    try {
      const response = await api.post<Course>('/exams/courses/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create course',
      };
    }
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<ApiResponse<Course>> {
    try {
      const response = await api.patch<Course>(`/exams/courses/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update course',
      };
    }
  }

  async deleteCourse(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/exams/courses/${id}/`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete course',
      };
    }
  }

  // --- Exams ---

  async getExams(params?: any): Promise<ApiResponse<Exam[]>> {
    try {
      const response = await api.get<any>('/exams/exams/', { params });
      const data = response.data.results !== undefined ? response.data.results : response.data;
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch exams',
      };
    }
  }

  async getExam(id: number): Promise<ApiResponse<Exam>> {
    try {
      const response = await api.get<Exam>(`/exams/exams/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch exam details',
      };
    }
  }

  async getExamDetails(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<any>(`/exams/exams/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch exam details',
      };
    }
  }

  async createExam(data: CreateExamData): Promise<ApiResponse<Exam>> {
    try {
      const response = await api.post<Exam>('/exams/exams/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create exam',
      };
    }
  }

  async updateExam(id: number, data: Partial<CreateExamData>): Promise<ApiResponse<Exam>> {
    try {
      const response = await api.patch<Exam>(`/exams/exams/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update exam',
      };
    }
  }

  // Bug Fixes
  // - [x] Fix ExaminerHome 404 and missing React imports <!-- id: 62 -->
  // - [x] Fix Paginated API Response Handling in Services<!-- id: 86 -->

  async deleteExam(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/exams/exams/${id}/`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete exam',
      };
    }
  }

  async getQuestions(examId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<any>(`/questions/questions/`, { params: { exam_id: examId } });
      const data = response.data.results !== undefined ? response.data.results : response.data;
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch questions',
      };
    }
  }

  async saveAnswer(data: {
    attempt: number;
    question: number;
    selected_option?: number;
    answer_text?: string;
    is_marked_for_review?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<any>('/questions/answers/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(' Failed to save answer:', error);
      console.error(' Response data:', error.response?.data);
      console.error(' Response status:', error.response?.status);
      console.error(' Response detail:', error.response?.data?.detail);

      let errorMessage = 'Failed to save answer';
      if (error.response?.data) {
        if (Array.isArray(error.response.data) && error.response.data.length > 0) {
          errorMessage = error.response.data[0];
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async submitExamAttempt(attemptId: number): Promise<ApiResponse<void>> {
    try {
      await api.post(`/exams/attempts/${attemptId}/submit/`);
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Failed to submit exam';
      if (error.response?.data) {
        if (Array.isArray(error.response.data) && error.response.data.length > 0) {
          errorMessage = error.response.data[0];
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getActiveAttempt(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<any>('/exams/attempts/active/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch active attempt',
      };
    }
  }

  async getAvailableExams(): Promise<ApiResponse<Exam[]>> {
    try {
      const response = await api.get<any>('/exams/exams/');
      const data = response.data.results !== undefined ? response.data.results : response.data;
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch available exams',
      };
    }
  }

  async startExam(examId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<any>(`/exams/attempts/`, { exam: examId });
      return { success: true, data: response.data };
    } catch (error: any) {
      let errorMessage = 'Failed to start exam';
      if (error.response?.data) {
        if (Array.isArray(error.response.data) && error.response.data.length > 0) {
          errorMessage = error.response.data[0];
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getAttempt(attemptId: number): Promise<ApiResponse<ExamAttempt>> {
    try {
      const response = await api.get<ExamAttempt>(`/exams/attempts/${attemptId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load exam attempt',
      };
    }
  }

  async sendHeartbeat(attemptId: number, status: string): Promise<ApiResponse<void>> {
    try {
      await api.post(`/exams/attempts/${attemptId}/heartbeat/`, { status });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to send heartbeat',
      };
    }
  }

  async getExamAttempts(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<any>('/exams/attempts/');
      const data = response.data.results !== undefined ? response.data.results : response.data;
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch exam attempts',
      };
    }
  }

  async getExamResults(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<any>('/results/results/');
      const data = response.data.results !== undefined ? response.data.results : response.data;
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch exam results',
      };
    }
  }
}

export default new ExamService();