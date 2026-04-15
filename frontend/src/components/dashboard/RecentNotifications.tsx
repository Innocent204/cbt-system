import React from 'react';
import { Bell, Clock, User, CheckCircle2, AlertTriangle, Info, XCircle, Trash2, Check } from 'lucide-react';
import notificationService, { Notification } from '../../services/notificationService';
import EmptyState from '../common/EmptyState';

const RecentNotifications: React.FC = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const response = await notificationService.getNotifications();
    if (response.success && response.data) {
      setNotifications(response.data.slice(0, 10)); // Show latest 10
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    const response = await notificationService.markAsRead(id);
    if (response.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const response = await notificationService.markAllAsRead();
    if (response.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleDelete = async (id: number) => {
    const response = await notificationService.deleteNotification(id);
    if (response.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-400" />;
      case 'error': return <XCircle size={14} className="text-rose-400" />;
      case 'security': return <AlertTriangle size={14} className="text-orange-400" />;
      default: return <Info size={14} className="text-blue-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
            Recent Intelligence
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </h2>
          <p className="text-sm text-slate-500 font-medium">System updates and personal alerts</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="glass rounded-[2rem] shadow-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-white/5">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-5 transition-all group relative ${notification.is_read ? 'opacity-60' : 'bg-white/[0.02]'
                  }`}
              >
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                )}

                <div className="mt-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border border-white/5 ${notification.type === 'error' ? 'bg-rose-500/10' :
                    notification.type === 'warning' ? 'bg-amber-500/10' :
                      notification.type === 'success' ? 'bg-emerald-500/10' :
                        'bg-indigo-500/10'
                    }`}>
                    {getIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-white">{notification.title}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        <Clock size={10} />
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-400 transition-colors"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {notification.message}
                  </p>

                  {notification.actor_username && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <User size={10} />
                      <span>{notification.actor_username}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="Silence is Golden"
            description="You're all caught up with your intelligence feed. New alerts will appear here as they arrive."
            className="!bg-transparent !border-none !shadow-none"
          />
        )}
      </div>
    </div>
  );
};

export default RecentNotifications;
