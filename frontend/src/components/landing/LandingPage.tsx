import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import { motion } from 'framer-motion';
import {
    Shield, Zap, BarChart3, Users, BookOpen, ArrowRight,
    Target, Clock, GraduationCap, LayoutDashboard, Terminal, Activity,
    Database, Lock
} from 'lucide-react';
import authService from '../../services/authService';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const isAuthenticated = authService.isAuthenticated();

    const getPortalRoute = () => {
        const role = authService.getUserRole();
        switch (role) {
            case 'admin': return '/admin';
            case 'examiner': return '/examiner';
            case 'student': return '/student';
            default: return '/login';
        }
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-dark-primary text-white font-['Inter',sans-serif] selection:bg-dark-accent-indigo selection:text-white">
            
            {/* Header / Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
                scrolled ? 'bg-dark-primary/95 backdrop-blur-md border-dark-border-primary py-4' : 'bg-transparent border-transparent py-6'
            }`}>
                <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
                    <Logo size={32} />
                    
                    <div className="hidden md:flex items-center gap-10">
                        {['Features', 'How It Works', 'Security'].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        {!isAuthenticated ? (
                            <>
                                <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted hover:text-white transition-colors">
                                    Sign In
                                </button>
                                <button onClick={() => navigate('/register')} className="bg-white text-dark-primary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dark-accent-indigo hover:text-white transition-all">
                                    Get Started
                                </button>
                            </>
                        ) : (
                            <button onClick={() => navigate(getPortalRoute())} className="flex items-center gap-3 bg-dark-secondary px-6 py-2.5 rounded-xl border border-dark-border-primary text-[10px] font-black uppercase tracking-widest hover:bg-dark-tertiary transition-all">
                                <LayoutDashboard size={14} className="text-dark-accent-indigo" />
                                <span>Go to Dashboard</span>
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-40 pb-24 px-8 flex flex-col items-center justify-center min-h-[90vh]">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
                    />
                    
                    <div className="relative text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-dark-secondary border border-dark-border-primary text-dark-accent-indigo text-[10px] font-black uppercase tracking-[0.2em] mb-10"
                        >
                            <Terminal size={12} />
                            v2.0.4 Unified Evaluation Interface
                        </motion.div>

                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9] uppercase"
                        >
                            Standardizing <br />
                            <span className="text-dark-text-muted italic">Academic</span> <br />
                            Evaluation.
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-dark-text-secondary max-w-2xl mx-auto leading-relaxed mb-12 font-medium"
                        >
                            A comprehensive exam management platform designed for institutions that demand 
                            security, reliability, and detailed analytics.
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            {!isAuthenticated ? (
                                <button onClick={() => navigate('/register')} className="group bg-white text-dark-primary px-10 py-5 rounded-2xl flex items-center gap-4 hover:bg-dark-accent-indigo hover:text-white transition-all shadow-2xl active:scale-95 font-black text-[10px] uppercase tracking-widest ring-1 ring-white/10">
                                    Get Started
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button onClick={() => navigate(getPortalRoute())} className="group bg-white text-dark-primary px-10 py-5 rounded-2xl flex items-center gap-4 hover:bg-dark-accent-indigo hover:text-white transition-all shadow-2xl active:scale-95 font-black text-[10px] uppercase tracking-widest ring-1 ring-white/10">
                                    <LayoutDashboard size={18} />
                                    Go to Dashboard
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </motion.div>
                    </div>

                    {/* Scroll Hint */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-32 text-dark-text-muted flex flex-col items-center gap-3 animate-pulse"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Learn More</span>
                        <div className="w-px h-12 bg-dark-border-primary" />
                    </motion.div>
                </section>

                {/* Intelligence Modules Section */}
                <section id="architecture" className="py-32 px-8 border-t border-dark-border-primary bg-dark-secondary/10">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-accent-indigo">Built for Everyone</p>
                                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight">Three Powerful <span className="text-dark-text-muted">Roles.</span></h2>
                                    <p className="text-lg text-dark-text-secondary font-medium leading-relaxed max-w-xl">
                                        A complete platform with dedicated tools for administrators, examiners, and students.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                   {[
                                       { icon: Terminal, title: 'For Examiners', sub: 'Create exams, manage questions, grade submissions, and track student performance with powerful analytics.' },
                                       { icon: GraduationCap, title: 'For Students', sub: 'Take exams in a secure, focused environment with real-time feedback and instant results.' },
                                       { icon: Shield, title: 'For Admins', sub: 'Manage users, monitor system activity, review audit logs, and configure platform settings.' }
                                   ].map((item, i) => (
                                       <div key={i} className="flex gap-6 p-6 bg-dark-secondary border border-dark-border-primary rounded-2xl hover:border-dark-text-muted transition-all group">
                                           <div className="w-12 h-12 rounded-xl bg-dark-tertiary flex items-center justify-center text-dark-accent-indigo group-hover:bg-dark-accent-indigo group-hover:text-white transition-all shrink-0">
                                               <item.icon size={20} />
                                           </div>
                                           <div className="space-y-1">
                                               <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{item.title}</h3>
                                               <p className="text-sm text-dark-text-secondary leading-relaxed">{item.sub}</p>
                                           </div>
                                       </div>
                                   ))}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="aspect-square bg-dark-secondary border border-dark-border-primary rounded-[3rem] p-4 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-dark-accent-indigo/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative h-full border border-dark-border-primary rounded-[2.5rem] p-10 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted">System Status</p>
                                            <p className="text-4xl font-black text-white tracking-tighter">100%</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-dark-accent-emerald">Ready</p>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="h-2 w-full bg-dark-tertiary rounded-full overflow-hidden">
                                                <div className="h-full w-2/3 bg-dark-accent-indigo" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-dark-tertiary rounded-2xl">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-1">Status</p>
                                                    <p className="text-sm font-bold text-white">READY</p>
                                                </div>
                                                <div className="p-4 bg-dark-tertiary rounded-2xl">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-1">Health</p>
                                                    <p className="text-sm font-bold text-dark-accent-emerald uppercase">Excellent</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-dark-accent-indigo/10 blur-[100px] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Protocols Section */}
                <section id="protocols" className="py-32 px-8 bg-dark-primary">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-24 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-accent-indigo">How It Works</p>
                            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">Simple. Fast. <span className="text-dark-text-muted italic">Effective.</span></h2>
                            <p className="text-lg text-dark-text-secondary font-medium max-w-xl mx-auto">
                                A streamlined workflow designed to make exam management effortless.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: Activity, label: 'Step 1', title: 'Create Account', sub: 'Quick and secure onboarding for your institution.' },
                                { icon: BookOpen, label: 'Step 2', title: 'Build Exams', sub: 'Create comprehensive tests with our intuitive exam editor.' },
                                { icon: Target, label: 'Step 3', title: 'Conduct Testing', sub: 'Secure proctoring with real-time monitoring and auto-save.' },
                                { icon: Database, label: 'Step 4', title: 'Get Results', sub: 'Automatic grading with detailed analytics and insights.' }
                            ].map((item, i) => (
                                <div key={i} className="bg-dark-secondary p-8 rounded-3xl border border-dark-border-primary hover:border-dark-accent-indigo transition-all duration-500 group">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-8 group-hover:text-dark-accent-indigo transition-colors">{item.label}</p>
                                    <div className="w-12 h-12 bg-dark-tertiary rounded-2xl flex items-center justify-center text-white mb-6">
                                        <item.icon size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">{item.title}</h3>
                                    <p className="text-sm text-dark-text-secondary leading-relaxed">{item.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section id="security" className="py-32 px-8 border-t border-dark-border-primary bg-dark-secondary/[0.02]">
                    <div className="max-w-5xl mx-auto text-center space-y-12">
                        <div className="space-y-4">
                            <div className="w-20 h-20 rounded-3xl bg-dark-secondary border border-dark-border-primary flex items-center justify-center mx-auto text-dark-accent-indigo mb-8 shadow-2xl">
                                <Lock size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-accent-indigo">Security First</p>
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tight">Enterprise <span className="text-dark-text-muted italic">Security.</span></h2>
                            <p className="text-lg md:text-xl text-dark-text-secondary font-medium leading-relaxed max-w-2xl mx-auto italic">
                                "Built for institutions that prioritize exam security and data integrity."
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {!isAuthenticated ? (
                                <button onClick={() => navigate('/register')} className="bg-white text-dark-primary px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dark-accent-indigo hover:text-white transition-all shadow-2xl active:scale-95">
                                    Create Account
                                </button>
                            ) : (
                                <button onClick={() => navigate(getPortalRoute())} className="bg-white text-dark-primary px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dark-accent-indigo hover:text-white transition-all shadow-2xl active:scale-95">
                                    Go to Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-16 px-8 border-t border-dark-border-primary bg-dark-primary">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex flex-col items-center md:items-start gap-3">
                        <Logo size={28} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted italic">Exam Management Platform</p>
                    </div>
                    
                    <div className="flex items-center gap-12">
                        <div className="text-right">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted mb-2">Platform Status</p>
                             <div className="flex items-center gap-2 justify-end">
                                <div className="w-1.5 h-1.5 rounded-full bg-dark-accent-emerald animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-white">Operational</p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted mb-2">Version</p>
                             <p className="text-[10px] font-black uppercase tracking-widest text-white">v2.0.4</p>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-dark-border-primary/50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted">© {new Date().getFullYear()} Academix. All rights reserved.</p>
                    <div className="flex items-center gap-8">
                        {['Privacy', 'Legal', 'Security', 'Compliance'].map(item => (
                            <a key={item} href="#" className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
