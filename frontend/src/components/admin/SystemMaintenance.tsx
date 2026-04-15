import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Users,
  Activity,
  RefreshCw,
  Trash2,
  FileText,
  Server
} from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';
import { toast } from 'react-toastify';
import statsService from '../../services/statsService';
import userService from '../../services/userService';

interface SystemStatus {
  database: {
    status: 'healthy' | 'warning' | 'error';
    size: string;
    lastBackup: string;
    connections: number;
  };
  server: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    cpu: number;
    memory: number;
    disk: number;
  };
  security: {
    status: 'healthy' | 'warning' | 'error';
    activeSessions: number;
    violations: number;
    lastScan: string;
  };
  users: {
    total: number;
    active: number;
    online: number;
    newThisMonth: number;
  };
}

interface BackupRecord {
  id: string;
  filename: string;
  size: string;
  createdAt: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'in_progress' | 'failed';
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  module: string;
  userId?: number;
  details?: Record<string, unknown>;
}

const SystemMaintenance: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'backups' | 'logs' | 'settings'>('status');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, logsRes, maintenanceRes] = await Promise.all([
          statsService.getAdminStats(),
          userService.getAuditLogs(),
          statsService.getMaintenanceStats()
        ]);

        if (statsRes.success && statsRes.data) {
          const s = statsRes.data;
          const m = maintenanceRes.success ? maintenanceRes.data : null;

          setSystemStatus({
            database: {
              status: s.systemHealth > 80 ? 'healthy' : (s.systemHealth > 40 ? 'warning' : 'error'),
              size: s.storageUsed || 'Unknown',
              lastBackup: m?.lastBackup || new Date().toISOString(),
              connections: 12 // Mocked as not in API yet
            },
            server: {
              status: 'healthy',
              uptime: m?.performance?.uptime || '14d 6h 22m',
              cpu: m?.performance?.cpu || 0,
              memory: m?.performance?.ram || 0,
              disk: m?.performance?.disk || 0
            },
            security: {
              status: 'healthy',
              activeSessions: s.activeExams || 0,
              violations: 0,
              lastScan: new Date().toISOString()
            },
            users: {
              total: s.totalUsers || 0,
              active: s.totalUsers || 0,
              online: Math.floor(s.totalUsers * 0.15),
              newThisMonth: Math.floor(s.userGrowth * s.totalUsers / 100)
            }
          });
        }

        if (logsRes.success && logsRes.data) {
          setLogs(logsRes.data.map((l: any) => ({
            id: l.id.toString(),
            timestamp: l.timestamp,
            level: l.level === 'success' ? 'info' : (l.level === 'error' ? 'error' : (l.level === 'warning' ? 'warning' : 'info')),
            message: l.action,
            module: l.details || 'System',
            userId: l.user_id,
            details: {}
          })));
        }

        if (maintenanceRes.success && maintenanceRes.data.backups) {
          const mappedBackups: BackupRecord[] = maintenanceRes.data.backups.map((b: any) => ({
            id: `bkp_${b.id}`,
            filename: b.name,
            size: b.size,
            createdAt: b.date === 'Yesterday, 03:00 AM' ? new Date(Date.now() - 86400000).toISOString() : new Date().toISOString(),
            type: 'automatic',
            status: b.status.toLowerCase() as any
          }));
          setBackups(mappedBackups);
        }

      } catch (error) {
        console.error('Error fetching maintenance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'error': return <AlertTriangle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
      case 'debug': return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    // Simulate backup creation
    setTimeout(() => {
      const newBackup: BackupRecord = {
        id: `backup_${Date.now()}`,
        filename: `axis_manual_backup_${new Date().toISOString().split('T')[0]}.sql`,
        size: '242 MB',
        createdAt: new Date().toISOString(),
        type: 'manual',
        status: 'completed',
      };
      setBackups([newBackup, ...backups]);
      setIsCreatingBackup(false);
    }, 3000);
  };

  const handleRestoreBackup = async (backupId: string) => {
    setIsRestoringBackup(true);
    setSelectedBackup(backupId);
    // Simulate backup restoration
    setTimeout(() => {
      setIsRestoringBackup(false);
      setSelectedBackup(null);
      toast.success('Backup restored successfully!');
    }, 5000);
  };

  const handleDeleteBackup = (backupId: string) => {
    setBackups(backups.filter(backup => backup.id !== backupId));
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleDownloadBackup = (backup: BackupRecord) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = backup.filename;
    link.click();
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Analyzing System Health" transparent />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">System Maintenance</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary">Monitor system health, manage backups, and view logs</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
            <RefreshCw size={20} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Database size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">Database</h3>
              </div>
              <span className={`flex items-center space-x-1 ${getStatusColor(systemStatus.database.status)}`}>
                {getStatusIcon(systemStatus.database.status)}
                <span className="text-sm font-medium">{systemStatus.database.status}</span>
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Size:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.database.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Connections:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.database.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Backup:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {new Date(systemStatus.database.lastBackup).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Server size={20} className="text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">Server</h3>
              </div>
              <span className={`flex items-center space-x-1 ${getStatusColor(systemStatus.server.status)}`}>
                {getStatusIcon(systemStatus.server.status)}
                <span className="text-sm font-medium">{systemStatus.server.status}</span>
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.server.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">CPU Usage:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.server.cpu}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.server.memory}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Disk:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.server.disk}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">Security</h3>
              </div>
              <span className={`flex items-center space-x-1 ${getStatusColor(systemStatus.security.status)}`}>
                {getStatusIcon(systemStatus.security.status)}
                <span className="text-sm font-medium">{systemStatus.security.status}</span>
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Sessions:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.security.activeSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Violations:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.security.violations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Scan:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {new Date(systemStatus.security.lastScan).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users size={20} className="text-orange-600 dark:text-orange-400" />
                <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">Users</h3>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.users.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.users.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Online:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.users.online}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">New This Month:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.users.newThisMonth}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Tabs */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
        <div className="border-b border-gray-200 dark:border-dark-border-primary">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${activeTab === 'status'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              System Status
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${activeTab === 'backups'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Backups ({backups.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${activeTab === 'logs'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              System Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">System Health Monitor</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
                  <RefreshCw size={16} />
                  <span>Run Health Check</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {systemStatus && (
                  <div className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">CPU Usage</span>
                          <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.server.cpu}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemStatus.server.cpu}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                          <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.server.memory}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${systemStatus.server.memory}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Disk Usage</span>
                          <span className="font-medium text-gray-900 dark:text-dark-text-primary">{systemStatus.server.disk}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${systemStatus.server.disk}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                      <span className="text-gray-900 dark:text-dark-text-primary">Automatic backup completed</span>
                      <span className="text-gray-500 dark:text-gray-400">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Activity size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-900 dark:text-dark-text-primary">Database optimization completed</span>
                      <span className="text-gray-500 dark:text-gray-400">5 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
                      <span className="text-gray-900 dark:text-dark-text-primary">High memory usage detected</span>
                      <span className="text-gray-500 dark:text-gray-400">8 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Backup Management</h3>
                <button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isCreatingBackup ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Creating Backup...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Create Backup</span>
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-dark-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-primary divide-y divide-gray-200 dark:divide-gray-700">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                          {backup.filename}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {backup.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${backup.type === 'automatic'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                            }`}>
                            {backup.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(backup.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${backup.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                            : backup.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                            }`}>
                            {backup.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDownloadBackup(backup)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={isRestoringBackup}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                            title="Restore"
                          >
                            {isRestoringBackup && selectedBackup === backup.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Upload size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">System Logs</h3>
                <button
                  onClick={handleClearLogs}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Clear Logs</span>
                </button>
              </div>

              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                            {log.message}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Module: {log.module}</span>
                          <span>Time: {new Date(log.timestamp).toLocaleString()}</span>
                          {log.userId && <span>User ID: {log.userId}</span>}
                        </div>
                      </div>
                      <FileText size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">System Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-4">Backup Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Enable automatic backups</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Backup Frequency
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary">
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Retention Period
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary">
                        <option>7 days</option>
                        <option>30 days</option>
                        <option>90 days</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-4">Log Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Enable debug logging</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Log user activities</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Log Retention
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary">
                        <option>7 days</option>
                        <option>30 days</option>
                        <option>90 days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMaintenance;
