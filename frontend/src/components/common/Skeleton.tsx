import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    variant = 'rectangular',
    width,
    height,
    lines = 1
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 rounded';
    const combinedClasses = `${baseClasses} ${className}`;

    const getStyle = () => {
        const style: React.CSSProperties = {};
        if (width) style.width = typeof width === 'number' ? `${width}px` : width;
        if (height) style.height = typeof height === 'number' ? `${height}px` : height;
        return style;
    };

    switch (variant) {
        case 'text':
            return (
                <div className={combinedClasses} style={getStyle()}>
                    {Array.from({ length: lines }, (_, index) => (
                        <div 
                            key={index} 
                            className="h-4 mb-2 last:mb-0" 
                            style={{
                                width: index === lines - 1 ? '75%' : '100%'
                            }}
                        />
                    ))}
                </div>
            );

        case 'circular':
            return (
                <div 
                    className={`${combinedClasses} rounded-full`}
                    style={{
                        ...getStyle(),
                        width: width || '40px',
                        height: height || '40px'
                    }}
                />
            );

        case 'rectangular':
        default:
            return (
                <div 
                    className={combinedClasses}
                    style={getStyle()}
                />
            );
    }
};

export default Skeleton;
