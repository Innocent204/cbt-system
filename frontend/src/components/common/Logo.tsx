import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, showText = true, className = '' }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img 
                src="/favicon.svg"
                alt="AXIS CBT Logo"
                className="object-contain"
                style={{ 
                    width: `${size}px`, 
                    height: `${size}px`
                }}
            />
            {showText && (
                <span className="text-white font-semibold text-lg">
                    AXIS CBT
                </span>
            )}
        </div>
    );
};

export default Logo;
