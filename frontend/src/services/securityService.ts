import api from './api';
import { ApiResponse } from '../types';

// Extend Document interface for fullscreen support
declare global {
  interface Document {
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }

  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }
}

export interface SecurityConfig {
  maxAttempts: number;
  timeLimit: number;
  ipRestriction: boolean;
  allowedIPs: string[];
  browserRestriction: boolean;
  allowedBrowsers: string[];
  preventCopyPaste: boolean;
  preventRightClick: boolean;
  fullScreenRequired: boolean;
  detectTabSwitch: boolean;
  detectWindowFocus: boolean;
  logActivity: boolean;
}

export interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  actionDisplay: string;
  resource: string;
  resourceId?: number;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityViolation {
  id: number;
  userId: number;
  examId?: number;
  violationType: 'tab_switch' | 'window_focus_lost' | 'copy_attempt' | 'right_click' | 'fullscreen_exit' | 'time_exceeded' | 'multiple_attempts' | 'ip_mismatch';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: number;
}

export interface ExamSession {
  id: string;
  userId: number;
  examId: number;
  startTime: string;
  endTime?: string;
  ipAddress: string;
  userAgent: string;
  status: 'active' | 'completed' | 'terminated' | 'suspended';
  violations: SecurityViolation[];
  lastActivity: string;
}

class SecurityService {
  private config: SecurityConfig = {
    maxAttempts: 3,
    timeLimit: 7200, // 2 hours in seconds
    ipRestriction: false,
    allowedIPs: [],
    browserRestriction: false,
    allowedBrowsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    preventCopyPaste: true,
    preventRightClick: true,
    fullScreenRequired: false,
    detectTabSwitch: true,
    detectWindowFocus: true,
    logActivity: true,
  };

  private activeExamId: number | null = null;
  private activityListeners: Array<() => void> = [];
  private violationCallbacks: Array<(violation: SecurityViolation) => void> = [];

  constructor() {
    this.initializeSecurity();
  }

  // Set current exam context
  setExamContext(examId: number | null): void {
    this.activeExamId = examId;
  }

  // Initialize security measures
  private initializeSecurity(): void {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.setupCopyProtection();
      this.setupFullscreenDetection();
    }
  }

  // Setup event listeners for security monitoring
  private setupEventListeners(): void {
    // Monitor tab switching
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logViolation('tab_switch', 'User switched away from exam tab', this.activeExamId || undefined);
      }
    });

    // Monitor window focus
    window.addEventListener('blur', () => {
      this.logViolation('window_focus_lost', 'User lost focus on exam window', this.activeExamId || undefined);
    });

    // Monitor context menu (right-click)
    document.addEventListener('contextmenu', (e) => {
      if (this.config.preventRightClick) {
        e.preventDefault();
        this.logViolation('right_click', 'User attempted to right-click', this.activeExamId || undefined);
      }
    });

    // Monitor copy/paste attempts
    document.addEventListener('copy', (e) => {
      if (this.config.preventCopyPaste) {
        e.preventDefault();
        this.logViolation('copy_attempt', 'User attempted to copy content', this.activeExamId || undefined);
      }
    });

    document.addEventListener('paste', (e) => {
      if (this.config.preventCopyPaste) {
        e.preventDefault();
        this.logViolation('copy_attempt', 'User attempted to paste content', this.activeExamId || undefined);
      }
    });

    // Monitor keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+X
      if (this.config.preventCopyPaste && (e.ctrlKey || e.metaKey)) {
        if (['c', 'v', 'x'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          this.logViolation('copy_attempt', `User attempted keyboard shortcut: ${e.key}`, this.activeExamId || undefined);
        }
      }

      // Prevent F12 (developer tools)
      if (e.key === 'F12' || (e.key === 'I' && e.shiftKey && e.ctrlKey)) {
        e.preventDefault();
        this.logViolation('copy_attempt', 'User attempted to open developer tools', this.activeExamId || undefined);
      }
    });
  }

  // Setup copy protection
  private setupCopyProtection(): void {
    if (!this.config.preventCopyPaste) return;

    // Disable text selection
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup fullscreen detection
  private setupFullscreenDetection(): void {
    if (!this.config.fullScreenRequired) return;

    const checkFullscreen = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement &&
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        this.logViolation('fullscreen_exit', 'User exited fullscreen mode', this.activeExamId || undefined);
      }
    };

    // Monitor fullscreen changes
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);
  }

  // Log security violation
  private async logViolation(type: SecurityViolation['violationType'], description: string, examId?: number): Promise<void> {
    const violation: SecurityViolation = {
      id: Date.now(),
      userId: this.getCurrentUserId(),
      examId,
      violationType: type,
      description,
      severity: this.getViolationSeverity(type),
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      resolved: false,
    };

    // Store violation locally (backup)
    this.storeViolation(violation);

    // Push to backend in real-time
    try {
      await api.post('/accounts/audit-logs/', {
        action: 'security_violation',
        description: `${type}: ${description}`,
        model_name: 'SecurityViolation',
        object_id: 0 // No specific object ID for generic violations
      });
    } catch (error) {
      console.error('Failed to log violation to server:', error);
    }

    // Notify callbacks
    this.violationCallbacks.forEach(callback => callback(violation));

    // Log to console (in development)
    if (import.meta.env.DEV) {
      console.warn('Security Violation:', violation);
    }
  }

  // Get violation severity based on type
  private getViolationSeverity(type: SecurityViolation['violationType']): SecurityViolation['severity'] {
    switch (type) {
      case 'tab_switch':
      case 'window_focus_lost':
        return 'medium';
      case 'copy_attempt':
      case 'right_click':
        return 'low';
      case 'fullscreen_exit':
        return 'high';
      case 'time_exceeded':
      case 'multiple_attempts':
      case 'ip_mismatch':
        return 'critical';
      default:
        return 'medium';
    }
  }

  // Store violation in localStorage
  private storeViolation(violation: SecurityViolation): void {
    const violations = this.getStoredViolations();
    violations.push(violation);

    // Keep only last 100 violations
    if (violations.length > 100) {
      violations.splice(0, violations.length - 100);
    }

    localStorage.setItem('security_violations', JSON.stringify(violations));
  }

  // Get stored violations
  private getStoredViolations(): SecurityViolation[] {
    try {
      const stored = localStorage.getItem('security_violations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Get current user ID
  private getCurrentUserId(): number {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || 0;
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return 0;
  }

  // Get current username
  private getCurrentUsername(): string {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.username || 'System';
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return 'Unknown';
  }

  // Get client IP
  private getClientIP(): string {
    // In a production environment, this should be handled by the backend
    // but for logging purposes we can try to get it if needed.
    return 'Client-Reported';
  }

  // Check if user has exceeded max attempts
  async checkMaxAttempts(userId: number, examId: number): Promise<ApiResponse<boolean>> {
    try {
      const attempts = await this.getUserAttempts(userId, examId);
      const hasExceeded = attempts >= this.config.maxAttempts;

      if (hasExceeded) {
        this.logViolation('multiple_attempts', `User exceeded maximum attempts (${this.config.maxAttempts})`);
      }

      return { success: true, data: hasExceeded };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check attempts',
      };
    }
  }

  // Get user attempts for an exam
  async getUserAttempts(userId: number, examId: number): Promise<number> {
    // In a real implementation, this would fetch from the API
    const key = `attempts_${userId}_${examId}`;
    const attempts = localStorage.getItem(key);
    return attempts ? parseInt(attempts) : 0;
  }

  // Increment user attempts
  async incrementAttempts(userId: number, examId: number): Promise<ApiResponse<void>> {
    try {
      const key = `attempts_${userId}_${examId}`;
      const currentAttempts = await this.getUserAttempts(userId, examId);
      localStorage.setItem(key, (currentAttempts + 1).toString());

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to increment attempts',
      };
    }
  }

  // Start exam session
  async startExamSession(userId: number, examId: number): Promise<ApiResponse<ExamSession>> {
    try {
      const session: ExamSession = {
        id: this.generateSessionId(),
        userId,
        examId,
        startTime: new Date().toISOString(),
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        status: 'active',
        violations: [],
        lastActivity: new Date().toISOString(),
      };

      // Store session
      this.storeSession(session);

      // Log activity
      await this.logActivity({
        userId,
        username: this.getCurrentUsername(),
        action: 'exam_session_started',
        actionDisplay: 'Started exam session',
        resource: 'exam',
        resourceId: examId,
        details: { sessionId: session.id },
      });

      return { success: true, data: session };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start exam session',
      };
    }
  }

  // End exam session
  async endExamSession(sessionId: string): Promise<ApiResponse<void>> {
    try {
      const session = this.getSession(sessionId);
      if (session) {
        session.endTime = new Date().toISOString();
        session.status = 'completed';
        this.storeSession(session);

        await this.logActivity({
          userId: session.userId,
          username: this.getCurrentUsername(),
          action: 'exam_session_ended',
          actionDisplay: 'Ended exam session',
          resource: 'exam',
          resourceId: session.examId,
          details: { sessionId, duration: Date.now() - new Date(session.startTime).getTime() },
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end exam session',
      };
    }
  }

  // Store session
  private storeSession(session: ExamSession): void {
    const sessions = this.getStoredSessions();
    const index = sessions.findIndex(s => s.id === session.id);

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem('exam_sessions', JSON.stringify(sessions));
  }

  // Get session
  private getSession(sessionId: string): ExamSession | null {
    const sessions = this.getStoredSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // Get stored sessions
  private getStoredSessions(): ExamSession[] {
    try {
      const stored = localStorage.getItem('exam_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log activity
  async logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'severity'>): Promise<ApiResponse<void>> {
    try {
      const log: ActivityLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        severity: 'low',
        ...activity,
      };

      // Store activity log
      const logs = this.getStoredLogs();
      logs.push(log);

      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      localStorage.setItem('activity_logs', JSON.stringify(logs));

      // Push to backend
      try {
        await api.post('/accounts/audit-logs/', {
          action: 'update', // generic action, could be refined
          description: log.actionDisplay || log.action,
          model_name: log.resource || 'Activity',
          object_id: log.resourceId || 0
        });
      } catch (error) {
        console.error('Failed to log activity to server:', error);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log activity',
      };
    }
  }

  // Get stored logs
  private getStoredLogs(): ActivityLog[] {
    try {
      const stored = localStorage.getItem('activity_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Get activity logs
  async getActivityLogs(filters?: {
    userId?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
    severity?: ActivityLog['severity'];
  }): Promise<ApiResponse<ActivityLog[]>> {
    try {
      let logs = this.getStoredLogs();

      // Apply filters
      if (filters) {
        if (filters.userId) {
          logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.action) {
          logs = logs.filter(log => log.action === filters.action);
        }
        if (filters.startDate) {
          logs = logs.filter(log => log.timestamp >= filters.startDate!);
        }
        if (filters.endDate) {
          logs = logs.filter(log => log.timestamp <= filters.endDate!);
        }
        if (filters.severity) {
          logs = logs.filter(log => log.severity === filters.severity);
        }
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { success: true, data: logs };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get activity logs',
      };
    }
  }

  // Get security violations
  async getSecurityViolations(filters?: {
    userId?: number;
    examId?: number;
    violationType?: SecurityViolation['violationType'];
    severity?: SecurityViolation['severity'];
    resolved?: boolean;
  }): Promise<ApiResponse<SecurityViolation[]>> {
    try {
      let violations = this.getStoredViolations();

      // Apply filters
      if (filters) {
        if (filters.userId) {
          violations = violations.filter(v => v.userId === filters.userId);
        }
        if (filters.examId) {
          violations = violations.filter(v => v.examId === filters.examId);
        }
        if (filters.violationType) {
          violations = violations.filter(v => v.violationType === filters.violationType);
        }
        if (filters.severity) {
          violations = violations.filter(v => v.severity === filters.severity);
        }
        if (filters.resolved !== undefined) {
          violations = violations.filter(v => v.resolved === filters.resolved);
        }
      }

      // Sort by timestamp (newest first)
      violations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { success: true, data: violations };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get security violations',
      };
    }
  }

  // Resolve security violation
  async resolveViolation(violationId: number, resolvedBy: number): Promise<ApiResponse<void>> {
    try {
      const violations = this.getStoredViolations();
      const violation = violations.find(v => v.id === violationId);

      if (violation) {
        violation.resolved = true;
        violation.resolvedAt = new Date().toISOString();
        violation.resolvedBy = resolvedBy;

        localStorage.setItem('security_violations', JSON.stringify(violations));
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve violation',
      };
    }
  }

  // Get security configuration
  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Update security configuration
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('security_config', JSON.stringify(this.config));
  }

  // Add violation callback
  onViolation(callback: (violation: SecurityViolation) => void): void {
    this.violationCallbacks.push(callback);
  }

  // Remove violation callback
  removeViolationCallback(callback: (violation: SecurityViolation) => void): void {
    const index = this.violationCallbacks.indexOf(callback);
    if (index > -1) {
      this.violationCallbacks.splice(index, 1);
    }
  }

  // Check browser compatibility
  checkBrowserCompatibility(): { compatible: boolean; browser: string; version: string } {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';

    // Detect browser
    if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
      version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge';
      version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }

    const compatible = this.config.allowedBrowsers.includes(browser);

    return { compatible, browser, version };
  }

  // Request fullscreen
  async requestFullscreen(): Promise<boolean> {
    try {
      const element = document.documentElement;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to request fullscreen:', error);
      return false;
    }
  }

  // Exit fullscreen
  async exitFullscreen(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }

  // Clear all security data
  clearSecurityData(): void {
    localStorage.removeItem('security_violations');
    localStorage.removeItem('activity_logs');
    localStorage.removeItem('exam_sessions');
    localStorage.removeItem('security_config');
  }
}

export default new SecurityService();
