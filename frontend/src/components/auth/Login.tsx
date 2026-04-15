import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, User, Lock, Loader2, ShieldCheck, Zap } from 'lucide-react';
import authService from '../../services/authService';
import { UserRole } from '../../types';

import Logo from '../common/Logo';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const redirectToDashboard = (role: UserRole | null): void => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'examiner':
        navigate('/examiner');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;
    if (!isDevelopment && authService.isAuthenticated()) {
      redirectToDashboard(authService.getUserRole());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    const result = await authService.login(credentials.username, credentials.password);
    setLoading(false);

    if (result.success && result.data) {
      toast.success('Login successful!');
      redirectToDashboard(result.data.role);
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background Elements */}
      <div className="mesh-bg opacity-30" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="glass rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-white/10 backdrop-blur-2xl">
          <div className="text-center mb-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <Logo size={84} showText={true} className="flex-col !gap-6" />
            </motion.div>
            <p className="text-slate-400 font-medium tracking-wide flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-bold text-slate-300 ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-blue-500">
                  <User size={18} className="text-slate-500" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="admin_doe"
                  disabled={loading}
                  autoFocus
                  className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-slate-300 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-blue-500">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-4 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group
                ${loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
                }`}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processing...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span>Log In to System</span>
                    <Zap size={18} className="group-hover:text-yellow-400 transition-colors" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-medium tracking-wide">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-400 transition-colors font-bold">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
