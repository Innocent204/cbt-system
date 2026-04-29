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
      {/* Header - Redesigned */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-dark-border-primary pb-10">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-dark-accent-indigo">Infrastructure Monitoring</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">System <span className="text-dark-text-muted">Intelligence</span></h2>
          <p className="text-dark-text-secondary font-medium text-lg max-w-2xl leading-relaxed">
            Real-time diagnostics, evaluation of deployment nodes, and encrypted audit trails.
          </p>
        </div>
        <button className="bg-white text-dark-primary px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-dark-accent-indigo hover:text-white transition-all shadow-2xl active:scale-95 font-black text-[10px] uppercase tracking-widest border border-white/10 group">
          <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
          <span>Export Analytics</span>
        </button>
      </div>

      {/* Navigation - Minimalist */}
      <div className="flex items-center gap-1 bg-dark-secondary p-1 rounded-2xl border border-dark-border-primary ring-1 ring-white/5 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'logs', label: 'Audit Logs', icon: Activity },
          { id: 'reports', label: 'Archives', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? 'bg-dark-accent-indigo text-white shadow-xl shadow-dark-accent-indigo/20'
                : 'text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Network Nodes', value: stats.totalUsers, sub: `${stats.activeUsers} authorized`, icon: Users, color: 'text-dark-accent-indigo' },
                { label: 'Task Deployment', value: stats.totalExams, sub: `${stats.completedExams} executed`, icon: FileText, color: 'text-dark-accent-cyan' },
                { label: 'Evaluation Mean', value: `${stats.averageScore}%`, sub: '+2.3% gain', icon: BarChart3, color: 'text-dark-accent-emerald' },
                { label: 'Infrastructure', value: stats.systemUptime, sub: 'Nominal state', icon: Activity, color: 'text-dark-accent-amber' },
              ].map((item, i) => (
                <div key={i} className="bg-dark-secondary p-6 rounded-2xl border border-dark-border-primary hover:border-dark-text-muted transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-dark-tertiary ${item.color}`}>
                      <item.icon size={20} />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-dark-tertiary animate-pulse" />
                  </div>
                  <p className="text-3xl font-black text-white mb-1 tracking-tight">{item.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-3">{item.label}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.sub}</p>
                </div>
              ))}
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
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'info', 'success', 'warning', 'error'].map((level) => (
                <button
                  key={level}
                  onClick={() => setLogFilter(level)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === level
                    ? 'bg-dark-accent-indigo text-white shadow-lg shadow-dark-accent-indigo/20 border border-white/10'
                    : 'bg-dark-secondary text-dark-text-muted border border-dark-border-primary hover:text-dark-text-primary hover:bg-dark-tertiary'
                    }`}
                >
                  {level === 'all' ? 'All Channels' : level}
                </button>
              ))}
            </div>

            {/* Logs Table */}
            {/* Logs Table - High Contrast */}
            <div className="border border-dark-border-primary rounded-3xl overflow-hidden bg-dark-secondary/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-dark-tertiary/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Channel</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Action</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Identifier</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Node</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border-primary/30">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-dark-accent-indigo/[0.02] transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap text-[10px] font-black text-dark-text-muted uppercase">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded border ${log.level === 'error' ? 'bg-dark-accent-rose/10 text-dark-accent-rose border-dark-accent-rose/20' :
                            log.level === 'warning' ? 'bg-dark-accent-amber/10 text-dark-accent-amber border-dark-accent-amber/20' :
                              'bg-dark-accent-indigo/10 text-dark-accent-indigo border-dark-accent-indigo/20'
                            }`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-white group-hover:text-dark-accent-indigo transition-colors italic">
                          {log.action}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <p className="text-xs font-bold text-dark-text-primary">{log.user}</p>
                          <p className="text-[10px] font-mono text-dark-text-muted mt-1 opacity-50">{log.ip}</p>
                        </td>
                        <td className="px-6 py-5 text-[10px] font-black text-dark-text-muted max-w-xs truncate uppercase tracking-widest">
                          {log.details.replace(/by .*/, '')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reports.map((report) => (
              <div key={report.id} className="bg-dark-secondary border border-dark-border-primary rounded-3xl p-8 hover:border-dark-accent-indigo transition-all group relative overflow-hidden flex flex-col">
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-16 h-16 bg-dark-tertiary rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-dark-accent-indigo group-hover:text-white transition-all shadow-inner">
                    {getReportTypeIcon(report.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-black text-white leading-tight tracking-tight">{report.name}</h3>
                      <span className="px-2 py-0.5 bg-dark-tertiary text-dark-text-muted text-[10px] font-black uppercase tracking-widest rounded-md border border-dark-border-primary">
                        {report.size}
                      </span>
                    </div>
                    <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest italic">{report.type} protocol</p>
                  </div>
                </div>

                <p className="text-sm text-dark-text-secondary font-medium leading-relaxed mb-8">{report.description}</p>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-dark-border-primary/50">
                  <div className="flex items-center gap-3">
                    <Calendar size={12} className="text-dark-text-muted" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-dark-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dark-accent-indigo hover:text-white transition-all active:scale-95 shadow-xl">
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemReports;
