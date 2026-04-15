import api from './api';
import { ApiResponse } from '../types';

export interface AdminStats {
    totalUsers: number;
    userGrowth: number;
    activeExams: number;
    newExamsToday: number;
    systemHealth: number;
    storageUsed: string;
    storageCapacity: number;
    // Sidebar Badges
    unread_notifications?: number;
    users_badge?: number;
    courses_badge?: number;
}

export interface ExaminerStats {
    totalQuestions: number;
    questionsAddedToday: number;
    activeExams: number;
    examsPublishedToday: number;
    studentsTested: number;
    studentGrowth: number;
    averageScore: number;
    scoreImprovement: number;
    // Sidebar Badges
    unread_notifications?: number;
    questions_badge?: number;
    results_badge?: number;
}

export interface StudentStats {
    examsCompleted: number;
    averageScore: number;
    upcomingExams: number;
    activeLearningTime: string;
    // Sidebar Badges
    unread_notifications?: number;
    exams_badge?: number;
}

class StatsService {
    async getAdminStats(): Promise<ApiResponse<AdminStats>> {
        try {
            const response = await api.get<AdminStats>('/accounts/dashboard-stats/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to fetch admin stats',
            };
        }
    }

    async getExaminerStats(): Promise<ApiResponse<ExaminerStats>> {
        try {
            const response = await api.get<ExaminerStats>('/accounts/dashboard-stats/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to fetch examiner stats',
            };
        }
    }

    async getStudentStats(): Promise<ApiResponse<StudentStats>> {
        try {
            const response = await api.get<StudentStats>('/accounts/dashboard-stats/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to fetch student stats',
            };
        }
    }

    async getChartStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/accounts/dashboard-stats/charts/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to fetch chart stats',
            };
        }
    }

    async getMaintenanceStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/accounts/dashboard-stats/maintenance/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to fetch maintenance stats',
            };
        }
    }

    async getReportSummary(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get('/accounts/dashboard-stats/reports_summary/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to fetch report summary',
            };
        }
    }
}

export default new StatsService();
