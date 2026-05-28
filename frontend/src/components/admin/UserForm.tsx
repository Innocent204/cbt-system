import React, { useState, useEffect } from 'react';
import { User, CreateUserData, UpdateUserData } from '../../types';
import { User as UserIcon, Mail, Shield, Key, CheckCircle } from 'lucide-react';

interface UserFormProps {
    initialData?: User;
    onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit }) => {
    const [formData, setFormData] = useState<any>({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'student',
        password: '',
        is_active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                username: initialData.username || '',
                email: initialData.email || '',
                first_name: initialData.first_name || '',
                last_name: initialData.last_name || '',
                role: initialData.role || 'student',
                password: '',
                is_active: initialData.is_active ?? true
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full pl-12 pr-4 py-4 bg-dark-tertiary/50 border border-dark-border-primary rounded-xl focus:ring-1 focus:ring-dark-accent-indigo outline-none text-sm text-white placeholder:text-dark-text-muted transition-all";
    const labelClasses = "text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-2 block ml-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className={labelClasses}>First Name</label>
                    <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" size={18} />
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="John"
                            className={inputClasses}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={labelClasses}>Last Name</label>
                    <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" size={18} />
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Doe"
                            className={inputClasses}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className={labelClasses}>Username</label>
                <div className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" size={18} />
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="john_doe"
                        className={inputClasses}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className={labelClasses}>Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" size={18} />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className={inputClasses}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className={labelClasses}>Role</label>
                    <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" size={18} />
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={`${inputClasses} appearance-none cursor-pointer`}
                            required
                        >
                            <option value="student">Student</option>
                            <option value="examiner">Examiner</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={labelClasses}>Password</label>
                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" size={18} />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={initialData ? "Leave blank to keep current" : "Min 8 characters"}
                            className={inputClasses}
                            required={!initialData}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-dark-tertiary/20 rounded-2xl border border-dark-border-primary/50">
                <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-dark-accent-emerald' : 'bg-dark-tertiary'}`}>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : ''}`} />
                        </div>
                    </div>
                    <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-white group-hover:text-dark-accent-emerald transition-colors">
                        Account Status: {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                </label>
            </div>

            <div className="flex gap-4 pt-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-dark-accent-indigo text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : initialData ? (
                        <CheckCircle size={18} />
                    ) : (
                        <Shield size={18} />
                    )}
                    <span>{initialData ? 'Save Changes' : 'Create User'}</span>
                </button>
            </div>
        </form>
    );
};

export default UserForm;
