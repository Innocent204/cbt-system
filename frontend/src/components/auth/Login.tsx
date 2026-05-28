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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-dark-primary italic">
      {/* Background Elements - Professional Minimalism */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-dark-accent-indigo/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-dark-accent-indigo/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="bg-dark-secondary rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-dark-border-primary ring-1 ring-white/5 relative overflow-hidden">
          <div className="text-center mb-12 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Logo size={64} showText={false} />
            </motion.div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">
              Sign <span className="text-dark-text-muted">In</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-accent-indigo flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-dark-accent-indigo animate-pulse" />
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="username" className="block text-[10px] font-black uppercase tracking-widest text-dark-text-muted ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-dark-accent-indigo">
                  <User size={18} className="text-dark-text-muted" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  disabled={loading}
                  autoFocus
                  className="w-full pl-14 pr-6 py-5 bg-dark-tertiary border border-dark-border-primary rounded-2xl text-white placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-dark-accent-indigo/20 focus:border-dark-accent-indigo transition-all duration-300 font-black text-[10px] uppercase tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-dark-text-muted ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-dark-accent-indigo">
                  <Lock size={18} className="text-dark-text-muted" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-14 pr-6 py-5 bg-dark-tertiary border border-dark-border-primary rounded-2xl text-white placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-dark-accent-indigo/20 focus:border-dark-accent-indigo transition-all duration-300 font-black text-[10px] uppercase tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 mt-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group border border-white/10
                ${loading
                  ? 'bg-dark-tertiary text-dark-text-muted cursor-not-allowed'
                  : 'bg-white text-dark-primary shadow-2xl hover:bg-dark-accent-indigo hover:text-white hover:-translate-y-0.5 active:translate-y-0'
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
                    <span>Validating...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span>Sign In</span>
                    <Zap size={18} className="group-hover:text-amber-400 transition-colors" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-dark-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:text-dark-accent-indigo transition-colors border-b border-white/20 pb-0.5">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
