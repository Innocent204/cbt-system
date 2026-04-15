import api from './api';
import { ApiResponse, Result, PaginatedResponse } from '../types';

class ResultService {
  // Get all results
  async getResults(params: Record<string, any> = {}): Promise<ApiResponse<PaginatedResponse<Result>>> {
    try {
      const response = await api.get<PaginatedResponse<Result>>('/results/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data };
    }
  }

  // Get result by ID
  async getResult(id: number): Promise<ApiResponse<Result>> {
    try {
      const response = await api.get<Result>(`/results/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data };
    }
  }

  // Get student's results
  async getMyResults(): Promise<ApiResponse<Result[]>> {
    try {
      const response = await api.get<Result[]>('/results/my-results/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data };
    }
  }

  // Get results for specific exam
  async getExamResults(examId: number): Promise<ApiResponse<Result[]>> {
    try {
      const response = await api.get<Result[]>('/results/', {
        params: { exam: examId }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data };
    }
  }
}

export default new ResultService();