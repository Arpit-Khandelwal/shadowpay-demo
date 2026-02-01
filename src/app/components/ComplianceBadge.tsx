'use client';

import { ComplianceStatus } from '../types';

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  walletAddress?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function ComplianceBadge({ 
  status, 
  walletAddress, 
  size = 'md',
  showDetails = false 
}: ComplianceBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (status.isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 ${sizeClasses[size]}`}>
        <svg className={`${iconSizes[size]} animate-spin text-zinc-400`} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
        </svg>
        <span className="font-mono text-zinc-400">Checking compliance...</span>
      </div>
    );
  }

  if (status.isSanctioned) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 ${sizeClasses[size]}`}>
        <svg className={`${iconSizes[size]} text-red-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span className="font-mono text-red-400">SANCTIONED</span>
      </div>
    );
  }

  if (!status.isCompliant) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/30 ${sizeClasses[size]}`}>
        <svg className={`${iconSizes[size]} text-orange-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="font-mono text-orange-400">HIGH RISK</span>
        {showDetails && (
          <span className="font-mono text-orange-400/60">Score: {status.riskScore}/10</span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 ${sizeClasses[size]}`}>
      <svg className={`${iconSizes[size]} text-emerald-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span className="font-mono text-emerald-400 uppercase tracking-wider">Compliant</span>
      {showDetails && (
        <span className="font-mono text-emerald-400/60 text-xs">via Range</span>
      )}
    </div>
  );
}

export function ComplianceBadgeInline({ isCompliant, isLoading }: { isCompliant: boolean; isLoading: boolean }) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-zinc-400">
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
        </svg>
      </span>
    );
  }

  if (isCompliant) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-red-400">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    </span>
  );
}
