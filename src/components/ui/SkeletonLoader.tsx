import React from 'react';
import { motion } from 'motion/react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  variant?: 'rectangular' | 'circular' | 'text';
}

export default function SkeletonLoader({ 
  className = "", 
  count = 1, 
  variant = 'rectangular' 
}: SkeletonLoaderProps) {
  const baseClasses = "bg-white/5 animate-pulse";
  const variantClasses = {
    rectangular: "rounded-2xl",
    circular: "rounded-full",
    text: "rounded h-4 w-3/4 mb-2"
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2 animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20" />
        <div className="h-4 w-48 bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonLoader count={4} className="h-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonLoader className="lg:col-span-2 h-96" />
        <SkeletonLoader className="h-96" />
      </div>
      <p className="text-center text-slate-500 text-xs font-medium animate-pulse py-4">
        Synthesizing health telemetry...
      </p>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonLoader className="h-8 w-64" />
          <SkeletonLoader className="h-4 w-96" />
        </div>
        <SkeletonLoader className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-8 pl-8 relative">
            <div className="absolute left-0 top-0 w-px h-full bg-white/5" />
            <SkeletonLoader variant="circular" className="w-12 h-12 -ml-14" />
            <SkeletonLoader className="flex-1 h-32 rounded-[40px]" />
          </div>
        ))}
      </div>
      <p className="text-center text-slate-500 text-xs font-medium animate-pulse py-4">
        Reconstructing clinical narrative...
      </p>
    </div>
  );
}

export function SpecialistsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonLoader count={3} className="h-64 rounded-[40px]" />
      </div>
      <SkeletonLoader className="h-96 rounded-[40px]" />
      <p className="text-center text-slate-500 text-xs font-medium animate-pulse py-4">
        Connecting with specialist intelligence...
      </p>
    </div>
  );
}
