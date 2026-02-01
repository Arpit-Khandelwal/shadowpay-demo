'use client';

import { useState } from 'react';

interface DepositFormProps {
  onDeposit: (amount: number) => Promise<void>;
  isDepositing: boolean;
  maxAmount: number;
}

export function DepositForm({ onDeposit, isDepositing, maxAmount }: DepositFormProps) {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    const value = parseFloat(amount);
    if (!isNaN(value) && value > 0) {
      await onDeposit(value);
      setAmount('');
    }
  };

  return (
    <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Shield Funds
      </h3>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in SOL"
            className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-800 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
          />
          {maxAmount > 0 && (
            <button
              onClick={() => setAmount(maxAmount.toString())}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono text-emerald-500 hover:text-emerald-400 uppercase"
            >
              Max
            </button>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isDepositing || !amount}
          className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          {isDepositing ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          )}
          Shield
        </button>
      </div>
      <p className="text-[10px] font-mono text-zinc-600 mt-2">
        Available: {maxAmount.toFixed(4)} SOL • Funds will be hidden from chain explorers
      </p>
    </div>
  );
}
