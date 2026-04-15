import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoadingScreen from '../common/LoadingScreen';
import { BarChart3, Users, FileText, Activity, Download, Calendar, TrendingUp } from 'lucide-react';
import statsService from '../../services/statsService';
import userService from '../../services/userService';

interface SystemLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  action: string;
  user: string;
  details: string;
  ip: string;
}

interface SystemReport {
  id: number;
  name: string;
  description: string;
  generatedAt: string;
  type: 'users' | 'exams' | 'performance' | 'activity';
  size: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalExams: number;
  completedExams: number;
  averageScore: number;
  systemUptime: string;
  storageUsed: string;
  apiCalls: number;
}

const SystemReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'reports'>('overview');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<string>('all');

  useEffect(() => {
    const fetchSystemData = async () => {
      setLoading(true);
      try {
        const [statsRes, logsRes, reportRes] = await Promise.all([
          statsService.getAdminStats(),
          userService.getAuditLogs({ limit: 50 }),
          statsService.getReportSummary()
        ]);

        if (statsRes.success && statsRes.data) {
          const s = statsRes.data;
          const r = reportRes.success ? reportRes.data.summary : {};
          setStats({
            totalUsers: s.totalUsers,
            activeUsers: r.activeUsers || Math.floor(s.totalUsers * 0.6),
            totalExams: s.activeExams,
            completedExams: r.completedExams || 0,
            averageScore: r.averageScore || 0,
            systemUptime: s.systemHealth + '%',
            storageUsed: s.storageUsed,
            apiCalls: r.apiCalls || 0
          });
        }

        if (logsRes.success && logsRes.data) {
          const mappedLogs: SystemLog[] = logsRes.data.map((log: any) => ({
            id: log.id,
            timestamp: log.timestamp,
            level: log.severity === 'critical' || log.severity === 'high' ? 'error' : (log.severity === 'medium' ? 'warning' : (log.action === 'login' ? 'success' : 'info')),
            action: log.action_display || log.action,
            user: log.user_username || 'Unknown',
            details: log.description,
            ip: log.ip_address
          }));
          setLogs(mappedLogs);
        }

        if (reportRes.success && reportRes.data.reports) {
          const mappedReports: SystemReport[] = reportRes.data.reports.map((report: any) => ({
            id: report.id,
            name: report.title,
            description: `Generated report for ${report.type} monitoring`,
            generatedAt: new Date().toISOString(), // In a real app, this would come from backend
            type: report.type.toLowerCase() as any,
            size: '2.1 MB'
          }));
          setReports(mappedReports);
        }

      } catch (error) {
        console.error('Error fetching system data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, []);

  const filteredLogs = logs.filter(log =>
    logFilter === 'all' || log.level === logFilter
  );

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'users': return <Users size={20} className="text-blue-600" />;
      case 'exams': return <FileText size={20} className="text-purple-600" />;
      case 'performance': return <BarChart3 size={20} className="text-green-600" />;
      case 'activity': return <Activity size={20} className="text-orange-600" />;
      default: return <FileText size={20} className="text-gray-600" />;
    }
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Loading Intelligence Data" transparent />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white font-display tracking-tight mb-2">System Intelligence</h2>
          <p className="text-slate-500 font-medium">Monitor infrastructure health, security logs, and performance analytics.</p>
        </div>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] flex items-center space-x-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 font-black text-xs uppercase tracking-widest">
          <Download size={20} strokeWidth={3} />
          <span>Export Analytics</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="glass rounded-[2rem] shadow-xl border border-white/5 overflow-hidden">
        <div className="border-b border-white/5 bg-white/5">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-5 px-6 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'overview'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Intelligence Overview
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-500 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-5 px-6 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'logs'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Security & Audit Logs
              {activeTab === 'logs' && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-500 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-5 px-6 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'reports'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Archived Reports
              {activeTab === 'reports' && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-500 rounded-t-full"></div>
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Users</p>
                      <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-tighter">{stats.activeUsers} active today</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <Users size={24} className="text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Exams</p>
                      <p className="text-3xl font-black text-white">{stats.totalExams}</p>
                      <p className="text-[10px] text-purple-400 font-bold mt-1 uppercase tracking-tighter">{stats.completedExams} completed</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                      <FileText size={24} className="text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Average Score</p>
                      <p className="text-3xl font-black text-white">{stats.averageScore}%</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center uppercase tracking-tighter">
                        <TrendingUp size={10} className="mr-1" />
                        +2.3% improvement
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                      <BarChart3 size={24} className="text-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">System Uptime</p>
                      <p className="text-3xl font-black text-white">{stats.systemUptime}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">Last 30 days stable</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                      <Activity size={24} className="text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/[0.04] p-8 rounded-[2rem] border border-white/5 border-dashed">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Infrastructure Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                      <span className="text-sm font-bold text-slate-300">Cloud Storage</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="w-[45%] h-full bg-blue-500"></div>
                        </div>
                        <span className="text-xs font-black text-white">{stats.storageUsed}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                      <span className="text-sm font-bold text-slate-300">API Throughput</span>
                      <span className="text-sm font-black text-indigo-400">{stats.apiCalls.toLocaleString()} calls / 24h</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.04] p-8 rounded-[2rem] border border-white/5 border-dashed">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Real-time Intelligence</h3>
                  <div className="space-y-3">
                    {logs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.level === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500'}`}></div>
                          <span className="text-xs font-bold text-slate-300">{log.action}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">by {log.user}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Log Filter - glassmorphic pill style */}
              <div className="flex flex-wrap items-center gap-3">
                {['all', 'info', 'success', 'warning', 'error'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setLogFilter(level)}
                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === level
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>

              {/* Logs Table */}
              <div className="border border-white/5 rounded-3xl overflow-hidden bg-white/[0.02]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Level</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">User</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Details</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.04] transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${log.level === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              log.level === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-200">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                            {log.user}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-xs truncate">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-600">
                            {log.ip}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-black text-white">{report.name}</h3>
                        <span className="px-2 py-0.5 bg-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-md">
                          {report.size}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">{report.description}</p>
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                            <Calendar size={12} />
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                            {report.type}
                          </span>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/10">
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemReports;
