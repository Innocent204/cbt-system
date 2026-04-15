import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

interface LoadingScreenProps {
    fullScreen?: boolean;
    message?: string;
    transparent?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    fullScreen = true,
    message = "Synchronizing",
    transparent = false
}) => {
    return (
        <div className={`
            flex flex-col items-center justify-center 
            ${fullScreen ? 'min-h-screen fixed inset-0 z-[100]' : 'min-h-[400px] w-full relative'} 
            ${transparent ? 'bg-transparent' : 'bg-slate-950'} 
            transition-colors duration-300
        `}>
            {fullScreen && !transparent && (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
                </>
            )}

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
            >
                <div className="relative mb-8">
                    <Logo size={fullScreen ? 64 : 48} showText={false} className="animate-pulse" />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"
                    />
                </div>

                <div className="flex flex-col items-center gap-3">
                    <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1"
                    >
                        {message}
                    </motion.p>

                    <div className="w-32 md:w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ left: "-100%" }}
                            animate={{ left: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full"
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
