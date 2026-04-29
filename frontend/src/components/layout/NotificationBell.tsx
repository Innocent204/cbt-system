import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Check, Trash2, BellOff, XCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import notificationService, { Notification } from '../../services/notificationService';
import LoadingScreen from '../common/LoadingScreen';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        const response = await notificationService.getNotifications();
        if (response.success && response.data) {
            setNotifications(response.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
        // Polling for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
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

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const response = await notificationService.deleteNotification(id);
        if (response.success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={16} className="text-emerald-400" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-400" />;
            case 'error': return <XCircle size={16} className="text-rose-400" />;
            case 'security': return <AlertTriangle size={16} className="text-orange-400" />;
            default: return <Info size={16} className="text-blue-400" />;
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
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 group ${isOpen ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}
                title="Intelligence Feed"
            >
                <Bell size={18} className={`transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:rotate-12'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-slate-900"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-dark-secondary rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-dark-border-primary z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-white/5">
                    <div className="p-6 border-b border-dark-border-primary bg-dark-tertiary/30 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Intelligence <span className="text-dark-text-muted italic">Feed</span></h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-dark-accent-indigo animate-pulse" />
                                <p className="text-[10px] font-black text-dark-text-muted uppercase tracking-widest leading-none">
                                    {unreadCount} Priority Alerts Active
                                </p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                            >
                                Silence All
                            </button>
                        )}
                    </div>

                    <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8">
                                <LoadingScreen fullScreen={false} message="Scanning Network..." transparent />
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-5 transition-all hover:bg-dark-accent-indigo/[0.03] group relative cursor-pointer border-b border-dark-border-primary/30 last:border-0 ${!notification.is_read ? 'bg-dark-accent-indigo/[0.02]' : 'opacity-40'}`}
                                        onClick={() => {
                                            if (!notification.is_read) handleMarkAsRead(notification.id, {} as any);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {!notification.is_read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-dark-accent-indigo shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                        )}
                                        <div className="flex items-start gap-5">
                                            <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center border border-dark-border-primary ${notification.type === 'error' ? 'bg-dark-accent-rose/10' :
                                                notification.type === 'warning' ? 'bg-dark-accent-amber/10' :
                                                    notification.type === 'success' ? 'bg-dark-accent-emerald/10' :
                                                        'bg-dark-accent-indigo/10'
                                                }`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest truncate pr-2">{notification.title}</h4>
                                                    <span className="text-[8px] font-black text-dark-text-muted uppercase tracking-[0.2em] flex-shrink-0 italic">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-dark-text-secondary leading-relaxed line-clamp-2 font-medium">
                                                    {notification.message}
                                                </p>
                                                <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                                                    <div className="flex items-center gap-1.5">
                                                        {notification.actor_username && (
                                                            <span className="text-[9px] font-black text-dark-accent-indigo uppercase tracking-widest flex items-center gap-2">
                                                                <span className="w-1 h-1 rounded-full bg-dark-accent-indigo"></span>
                                                                {notification.actor_username}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                                className="p-1 px-3 bg-white text-dark-primary hover:bg-dark-accent-indigo hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all italic shadow-2xl"
                                                            >
                                                                Resolve
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDelete(notification.id, e)}
                                                            className="p-1.5 bg-dark-tertiary border border-dark-border-primary text-dark-text-muted hover:text-dark-accent-rose rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/5">
                                    <BellOff size={24} className="text-slate-600" />
                                </div>
                                <h4 className="text-lg font-black text-white mb-1">Silence is Golden</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Feed is currently offline.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
