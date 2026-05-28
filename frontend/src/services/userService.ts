import api from './api';
import { User, ApiResponse } from '../types';

class UserService {
    // Get all users (admin only)
    async getUsers(params?: any): Promise<ApiResponse<User[]>> {
        try {
            const response = await api.get<User[]>('/accounts/users/', { params });
            return { success: true, data: response.data };
        } catch (error: any) {
            let errorMessage = 'Failed to fetch users';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data) {
                errorMessage = typeof error.response.data === 'string'
                    ? error.response.data
                    : JSON.stringify(error.response.data);
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication required. Please log in again.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Access denied. You do not have permission to view users.';
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    // Create new user
    async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await api.post<User>('/accounts/users/', userData);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data || 'Failed to create user',
            };
        }
    }

    // Update user
    async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await api.patch<User>(`/accounts/users/${id}/`, userData);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data || 'Failed to update user',
            };
        }
    }

    // Delete user (soft delete - marks as inactive)
    async deleteUser(id: number): Promise<ApiResponse<void>> {
        try {
            await api.delete(`/accounts/users/${id}/`);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data || 'Failed to delete user',
            };
        }
    }

    // Hard delete user (permanent deletion - admin only)
    async hardDeleteUser(id: number): Promise<ApiResponse<void>> {
        try {
            await api.delete(`/accounts/users/${id}/hard_delete/`);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to permanently delete user',
            };
        }
    }

    // Get audit logs (admin only)
    async getAuditLogs(params?: any): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get<any[]>('/accounts/audit-logs/', { params });
            const data = (response.data as any).results !== undefined ? (response.data as any).results : response.data;
            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch audit logs',
            };
        }
    }
}

export default new UserService();
