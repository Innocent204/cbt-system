import React from 'react';
import Skeleton from '../common/Skeleton';

const DashboardSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Banner Skeleton */}
            <Skeleton className="h-48 w-full rounded-2xl" />

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                        <div className="flex justify-between items-center">
                            <div className="space-y-3 flex-1">
                                <Skeleton className="h-3 w-1/2" variant="text" />
                                <Skeleton className="h-8 w-3/4" variant="text" />
                                <Skeleton className="h-3 w-1/3" variant="text" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-lg" variant="rect" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <Skeleton className="h-6 w-1/4 mb-4" variant="text" />
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" variant="rect" />
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <Skeleton className="h-6 w-1/4 mb-4" variant="text" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <Skeleton className="h-2 w-2 rounded-full" variant="rect" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-3/4" variant="text" />
                                    <Skeleton className="h-2 w-1/4" variant="text" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
