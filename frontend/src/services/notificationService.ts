import api from './api';
import { ApiResponse } from '../types';

export interface Notification {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error' | 'security';
    type_display: string;
    title: string;
    message: string;
    is_read: boolean;
    actor_username?: string;
    created_at: string;
    related_object_id?: number;
    related_model_name?: string;
}

class NotificationService {
    async getNotifications(): Promise<ApiResponse<Notification[]>> {
        try {
            const response = await api.get<any>('/accounts/notifications/');
            // Handle paginated response if present
            const data = response.data.results !== undefined ? response.data.results : response.data;
            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to fetch notifications',
            };
        }
    }

    async markAsRead(id: number): Promise<ApiResponse<void>> {
        try {
            await api.post(`/accounts/notifications/${id}/mark_as_read/`);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to mark notification as read',
            };
        }
    }

    async markAllAsRead(): Promise<ApiResponse<void>> {
        try {
            await api.post('/accounts/notifications/mark_all_as_read/');
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to mark all as read',
            };
        }
    }

    async deleteNotification(id: number): Promise<ApiResponse<void>> {
        try {
            await api.delete(`/accounts/notifications/${id}/`);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to delete notification',
            };
        }
    }
}

export default new NotificationService();
