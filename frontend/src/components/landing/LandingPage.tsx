import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    Shield, Zap, BarChart3, Users, BookOpen, CheckCircle, ArrowRight,
    Brain, Lock, Globe, Star, ChevronDown, Sparkles, Target, Clock,
    Award, TrendingUp, Play, X, GraduationCap, LayoutDashboard
} from 'lucide-react';
import authService from '../../services/authService';

// Floating orb background
const FloatingOrbs = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[120px] animate-pulse delay-700" />
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[140px] animate-pulse delay-1000" />
    </div>
);

// Animated counter
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ end, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [inView, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Section fade-in wrapper
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Feature card data
const features = [
    {
        icon: Brain,
        title: 'Adaptive Intelligence',
        description: 'AI-assisted question generation and exam scaffolding adapts to course requirements for maximum learning impact.',
        gradient: 'from-indigo-500 to-blue-600',
        glow: 'group-hover:shadow-indigo-500/20',
    },
    {
        icon: Shield,
        title: 'Proctor-Grade Security',
        description: 'JWT-secured sessions, anti-tab-switch enforcement, and real-time violation logging for exam integrity.',
        gradient: 'from-violet-500 to-purple-600',
        glow: 'group-hover:shadow-purple-500/20',
    },
    {
        icon: Zap,
        title: 'Instant Auto-Scoring',
        description: 'MCQ and True/False answers are graded the moment a student submits, no waiting required.',
        gradient: 'from-amber-500 to-orange-500',
        glow: 'group-hover:shadow-amber-500/20',
    },
    {
        icon: BarChart3,
        title: 'Deep Analytics',
        description: 'Distractor analysis, enrollment trends, and system health dashboards for data-driven decisions.',
        gradient: 'from-emerald-500 to-teal-600',
        glow: 'group-hover:shadow-emerald-500/20',
    },
    {
        icon: Users,
        title: 'Role-Based Access',
        description: 'Granular permissions for Admins, Examiners, and Students — every role sees exactly what they need.',
        gradient: 'from-rose-500 to-pink-600',
        glow: 'group-hover:shadow-rose-500/20',
    },
    {
        icon: Globe,
        title: 'Bulk Question Import',
        description: 'Upload hundreds of questions at once via CSV or JSON. Smart parsing handles edge cases automatically.',
        gradient: 'from-sky-500 to-cyan-600',
        glow: 'group-hover:shadow-sky-500/20',
    },
];

// How it works steps
const steps = [
    { icon: Users, step: '01', title: 'Register & Get Verified', description: 'Students sign up with their institutional email. Admins approve and assign courses instantly.' },
    { icon: BookOpen, step: '02', title: 'Examiners Craft Exams', description: 'Examiners build question banks, schedule assessments, and configure proctoring settings.' },
    { icon: Target, step: '03', title: 'Students Take Exams', description: 'Secure, timed exam interface with real-time auto-save and anti-cheat enforcement.' },
    { icon: Award, step: '04', title: 'Instant Results & Review', description: 'MCQs auto-grade immediately. Subjective answers go to examiner review with student notifications.' },
];

// Main Component
const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [showVideoOverlay, setShowVideoOverlay] = useState(false);
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
        <div className="min-h-screen bg-[#070B14] text-white font-['Inter',sans-serif] overflow-x-hidden">

            {/* NAVBAR */}
            <motion.nav
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#070B14]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl' : ''
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Logo size={38} />

                    {/* Nav links */}
                    <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
                        {['Features', 'How It Works', 'Roles'].map(link => (
                            <a
                                key={link}
                                href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                                className="hover:text-white transition-colors duration-200"
                            >
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex items-center gap-3">
                        {!isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25"
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate(getPortalRoute())}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
                            >
                                <LayoutDashboard size={16} className="text-indigo-400" />
                                <span>Go to Portal</span>
                            </button>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* HERO SECTION */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
                <FloatingOrbs />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="relative z-10 max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8"
                    >
                        <Sparkles size={12} className="text-indigo-400" />
                        Academix Intelligence System
                        <Sparkles size={12} className="text-indigo-400" />
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6"
                    >
                        <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                            Assessment.
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                            Reimagined.
                        </span>
                    </motion.h1>

                    {/* Sub-headline */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
                    >
                        The enterprise-grade Computer-Based Testing platform built for institutions that demand{' '}
                        <span className="text-white font-semibold">speed</span>,{' '}
                        <span className="text-white font-semibold">security</span>, and{' '}
                        <span className="text-white font-semibold">intelligence</span>.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        {!isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex items-center gap-2.5 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-base font-bold transition-all duration-300"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="group flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl text-base font-bold transition-all duration-300 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                                >
                                    Sign Up
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate(getPortalRoute())}
                                className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl text-lg font-bold transition-all duration-300 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                            >
                                <GraduationCap size={24} />
                                <span>Continue to Dashboard</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </motion.div>

                    {/* Scroll hint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="mt-20 flex flex-col items-center gap-2 text-slate-600"
                    >
                        <span className="text-xs tracking-widest uppercase">Explore</span>
                        <ChevronDown size={18} className="animate-bounce" />
                    </motion.div>
                </div>
            </section>

            {/* STATS BAR */}
            <section className="py-16 px-6 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { end: 10000, suffix: '+', label: 'Assessments Delivered' },
                        { end: 99, suffix: '.9%', label: 'Platform Uptime' },
                        { end: 3, suffix: 'ms', label: 'Avg Grading Time' },
                        { end: 100, suffix: '%', label: 'Role Enforcement' },
                    ].map((stat, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <p className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                                <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                            </p>
                            <p className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <FadeIn className="text-center mb-20">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-[0.3em]">Capabilities</span>
                        <h2 className="text-4xl sm:text-5xl font-black mt-3 mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                            Everything you need
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Purpose-built for academic institutions — not bolted together from generic tools.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feat, i) => (
                            <FadeIn key={i} delay={i * 0.08}>
                                <div className={`group relative p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-white/15 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${feat.glow}`}>
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                                        <feat.icon size={22} className="text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-28 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <FadeIn className="text-center mb-20">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-[0.3em]">Process</span>
                        <h2 className="text-4xl sm:text-5xl font-black mt-3 mg-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                            Four steps to flawless exams
                        </h2>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.07] h-full">
                                    {/* Step number */}
                                    <div className="text-5xl font-black text-white/5 absolute top-4 right-5 select-none">{step.step}</div>
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-5">
                                        <step.icon size={18} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>

                                    {/* Connector arrow */}
                                    {i < steps.length - 1 && (
                                        <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                                                <ArrowRight size={12} className="text-slate-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROLES SECTION */}
            <section id="roles" className="py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <FadeIn className="text-center mb-20">
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-[0.3em]">User Roles</span>
                        <h2 className="text-4xl sm:text-5xl font-black mt-3 mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                            Built for every stakeholder
                        </h2>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                role: 'Administrator',
                                icon: Shield,
                                gradient: 'from-rose-500/20 to-pink-600/5',
                                border: 'border-rose-500/20',
                                badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                                perks: ['User provisioning & role assignment', 'System-wide analytics & health', 'Audit logs & security controls', 'Backup & maintenance tools'],
                            },
                            {
                                role: 'Examiner',
                                icon: BookOpen,
                                gradient: 'from-indigo-500/20 to-blue-600/5',
                                border: 'border-indigo-500/20',
                                badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
                                perks: ['Build rich question banks', 'Schedule & proctor exams', 'Manual grading workspace', 'Distractor & performance analysis'],
                                featured: true,
                            },
                            {
                                role: 'Student',
                                icon: GraduationCap,
                                gradient: 'from-emerald-500/20 to-teal-600/5',
                                border: 'border-emerald-500/20',
                                badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                                perks: ['View available exams & schedules', 'Secure, timed exam interface', 'Instant MCQ score feedback', 'Full result history & analytics'],
                            },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 0.12}>
                                <div className={`relative p-8 rounded-3xl bg-gradient-to-b ${item.gradient} border ${item.border} h-full transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${item.featured ? 'ring-1 ring-indigo-500/30' : ''}`}>
                                    {item.featured && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                                            Most Used
                                        </div>
                                    )}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border mb-6 ${item.badge}`}>
                                        <item.icon size={12} />
                                        {item.role}
                                    </div>
                                    <ul className="space-y-3">
                                        {item.perks.map((perk, j) => (
                                            <li key={j} className="flex items-start gap-3 text-sm text-slate-300">
                                                <CheckCircle size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                                                {perk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA BANNER */}
            <FadeIn>
                <section className="py-24 px-6 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-blue-600/20 to-violet-600/20" />
                        <div className="absolute inset-0 backdrop-blur-3xl" />
                    </div>
                    <div className="relative z-10 max-w-3xl mx-auto text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/40">
                            <TrendingUp size={28} className="text-white" />
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Ready to modernize your institution?
                        </h2>
                        <p className="text-slate-400 text-lg mb-10">
                            Join thousands of students and educators already using AXIS for smarter, fairer assessments.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {!isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-base font-bold transition-all duration-300"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="group flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl text-base font-bold transition-all duration-300 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                                    >
                                        Sign Up
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => navigate(getPortalRoute())}
                                    className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl text-lg font-bold transition-all duration-300 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                                >
                                    <LayoutDashboard size={24} />
                                    <span>Manage Your Portal</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </FadeIn>

            {/* FOOTER */}
            <footer className="py-10 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <Logo size={28} />
                    </div>
                    <p>© {new Date().getFullYear()} Academix. All rights reserved.</p>
                    <div className="flex items-center gap-5">
                        {!isAuthenticated ? (
                            <>
                                <button onClick={() => navigate('/login')} className="hover:text-slate-400 transition-colors">Sign In</button>
                                <button onClick={() => navigate('/register')} className="hover:text-slate-400 transition-colors">Register</button>
                            </>
                        ) : (
                            <button onClick={() => navigate(getPortalRoute())} className="hover:text-slate-400 transition-colors font-bold text-indigo-400">Back to Dashboard</button>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
