import api from './api';
import {
  User,
  LoginCredentials,
  LoginResponse,
  ChangePasswordData,
  UserRole,
  RegisterData,
  ApiResponse
} from '../types';

class AuthService {
  // Login
  async login(username: string, password: string): Promise<ApiResponse<User>> {
    try {
      const loginUrl = '/accounts/auth/login/'.trim();
      console.log('Attempting login to:', loginUrl);
      console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

      const response = await api.post<LoginResponse>(loginUrl, {
        username,
        password
      });

      const { user, tokens } = response.data;

      // Store tokens and user info
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, data: user };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  }

  // Register
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      const response = await api.post<LoginResponse>('/accounts/auth/register/', data);

      const { user, tokens } = response.data;

      // Store tokens and user info
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, data: user };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/accounts/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Get user role
  getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  // Check if user is examiner
  isExaminer(): boolean {
    return this.getUserRole() === 'examiner';
  }

  // Check if user is student
  isStudent(): boolean {
    return this.getUserRole() === 'student';
  }

  // Change password
  async changePassword(
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<ApiResponse<void>> {
    try {
      await api.post('/accounts/users/change_password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || 'Password change failed',
      };
    }
  }

  // Get current user from API
  async getCurrentUserFromAPI(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<User>('/accounts/auth/me/');

      // Update stored user
      localStorage.setItem('user', JSON.stringify(response.data));

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch user',
      };
    }
  }
}

export default new AuthService();