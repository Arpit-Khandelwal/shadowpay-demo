'use client';

import { BalanceInfo } from '../types';

interface ShieldedBalanceProps {
  balance: BalanceInfo;
  onRefresh?: () => void;
  showPublic?: boolean;
}

export function ShieldedBalance({ balance, onRefresh, showPublic = true }: ShieldedBalanceProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
          Shielded Vault
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {balance.isLoading ? '...' : balance.shielded.toFixed(2)}
          </span>
          <span className="text-sm text-emerald-400/50">SOL</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <svg className="w-3 h-3 text-emerald-500/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-[10px] font-mono text-zinc-600">Hidden on-chain</span>
        </div>
      </div>

      {showPublic && (
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
            Public Balance
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-zinc-400">
              {balance.isLoading ? '...' : balance.public.toFixed(2)}
            </span>
            <span className="text-sm text-zinc-500">SOL</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="text-[10px] font-mono text-zinc-600">Visible on explorer</span>
          </div>
        </div>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={balance.isLoading}
          className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-xs font-mono"
        >
          <svg 
            className={`w-3 h-3 ${balance.isLoading ? 'animate-spin' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {balance.isLoading ? 'Refreshing...' : 'Refresh Balances'}
        </button>
      )}
    </div>
  );
}

export function BalanceCard({ 
  label, 
  amount, 
  suffix = 'SOL',
  color = 'emerald',
  isLoading = false 
}: { 
  label: string; 
  amount: number; 
  suffix?: string;
  color?: 'emerald' | 'cyan' | 'purple' | 'zinc';
  isLoading?: boolean;
}) {
  const colorClasses = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    zinc: 'text-zinc-400',
  };

  const suffixClasses = {
    emerald: 'text-emerald-400/50',
    cyan: 'text-cyan-400/50',
    purple: 'text-purple-400/50',
    zinc: 'text-zinc-500',
  };

  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-mono font-bold ${colorClasses[color]}`}>
          {isLoading ? '...' : amount.toFixed(2)}
        </span>
        <span className={`text-sm ${suffixClasses[color]}`}>{suffix}</span>
      </div>
    </div>
  );
}
