import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User as UserIcon,
    Mail,
    Phone,
    Lock,
    Save,
    Shield,
    UserCheck,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingScreen from '../common/LoadingScreen';
import authService from '../../services/authService';
import userService from '../../services/userService';
import { User } from '../../types';

const ProfileSettings: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');

    // Personal Info Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        new_password_confirm: ''
    });

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        setLoading(true);
        const result = await authService.getCurrentUserFromAPI();
        if (result.success && result.data) {
            setUser(result.data);
            setFormData({
                first_name: result.data.first_name || '',
                last_name: result.data.last_name || '',
                email: result.data.email || '',
                phone: result.data.phone || ''
            });
        } else {
            toast.error('Failed to load profile');
        }
        setLoading(false);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        const result = await userService.updateUser(user.id, formData);
        if (result.success) {
            toast.success('Profile updated successfully');
            // Update local storage via authService
            await authService.getCurrentUserFromAPI();
        } else {
            toast.error(result.error || 'Failed to update profile');
        }
        setSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.new_password_confirm) {
            toast.error('New passwords do not match');
            return;
        }

        setSaving(true);
        const result = await authService.changePassword(
            passwordData.old_password,
            passwordData.new_password,
            passwordData.new_password_confirm
        );

        if (result.success) {
            toast.success('Password changed successfully');
            setPasswordData({
                old_password: '',
                new_password: '',
                new_password_confirm: ''
            });
        } else {
            toast.error(result.error || 'Failed to change password');
        }
        setSaving(false);
    };

    if (loading) {
        return <LoadingScreen fullScreen={false} message="Loading Profile Security" transparent />;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">Profile Settings</h1>
                        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">Manage your account information and security preferences</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' :
                        user?.role === 'examiner' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                        <UserCheck size={16} />
                        <span className="capitalize">{user?.role} Account</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-dark-surface p-1 rounded-xl mb-8 border border-gray-200 dark:border-dark-border-primary max-w-md">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'personal'
                            ? 'bg-white dark:bg-dark-tertiary text-blue-600 dark:text-dark-accent-blue shadow-sm'
                            : 'text-gray-500 dark:text-dark-text-tertiary hover:text-gray-700 dark:hover:text-dark-text-secondary'
                            }`}
                    >
                        <UserIcon size={18} />
                        Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'security'
                            ? 'bg-white dark:bg-dark-tertiary text-blue-600 dark:text-dark-accent-blue shadow-sm'
                            : 'text-gray-500 dark:text-dark-text-tertiary hover:text-gray-700 dark:hover:text-dark-text-secondary'
                            }`}
                    >
                        <Lock size={18} />
                        Security
                    </button>
                </div>

                {/* Content Wrapper */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border-primary overflow-hidden">
                    {activeTab === 'personal' ? (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-8"
                        >
                            <form onSubmit={handleProfileUpdate}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary ml-1">First Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <UserIcon size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-dark-text-primary"
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary ml-1">Last Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <UserIcon size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-dark-text-primary"
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                readOnly={user?.role !== 'admin'}
                                                className={`w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-dark-border-primary rounded-xl outline-none transition-all dark:text-dark-text-primary ${user?.role === 'admin'
                                                    ? 'bg-gray-50 dark:bg-dark-tertiary focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                                    : 'bg-gray-100 dark:bg-dark-secondary cursor-not-allowed text-gray-500'
                                                    }`}
                                                placeholder="Email address"
                                            />
                                        </div>
                                        {user?.role !== 'admin' && (
                                            <p className="text-xs text-gray-500 mt-1 ml-1">Contact your administrator to change your email.</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Phone size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-dark-text-primary"
                                                placeholder="Phone number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border-primary flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary ml-1">Current Password</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                    <Shield size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.old_password}
                                                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-dark-text-primary"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary ml-1">New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.new_password}
                                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-dark-text-primary"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary ml-1">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.new_password_confirm}
                                                    onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-dark-text-primary"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-900/10 dark:shadow-blue-500/20 disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <Shield size={18} />
                                                )}
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 dark:bg-dark-secondary rounded-2xl border border-slate-200 dark:border-dark-border-primary">
                                        <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-dark-text-primary mb-3">
                                            <AlertCircle size={18} className="text-amber-500" />
                                            Security Tips
                                        </h3>
                                        <ul className="space-y-3 text-sm text-gray-600 dark:text-dark-text-secondary">
                                            <li className="flex gap-2">
                                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                Use at least 8 characters
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                Mix letters, numbers and symbols
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                Avoid common words or birthdays
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileSettings;
