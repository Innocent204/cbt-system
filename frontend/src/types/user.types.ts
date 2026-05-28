// User Types
export type UserRole = 'admin' | 'examiner' | 'student';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  profile_picture?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  password: string;
  password_confirm: string;
  phone?: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  password?: string;
  phone?: string;
  is_active?: boolean;
}

export interface AuditLog {
  id: number;
  user: number;
  user_username: string;
  action: string;
  action_display: string;
  model_name: string;
  object_id?: number;
  description: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}