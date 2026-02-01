'use client';

import { useState } from 'react';
import { Employee } from '../types';
import { ComplianceBadgeInline } from './ComplianceBadge';

interface EmployeeListProps {
  employees: Employee[];
  onParseCSV: (csv: string) => void;
  onClear: () => void;
  onCheckCompliance?: (employee: Employee) => Promise<void>;
}

const SAMPLE_CSV = `emp001,7xKXr9mPq4n8s2vL5hDqW3bN6cR8tY1zQwErTyUiOp,5.25,Alice Chen
emp002,3mNzT5wQ7rK9pL2xS4vB8cD1fG6hJ0kEaSdFgHjKlZ,8.00,Bob Martinez
emp003,9pQrS2tU4vW6xY8zA0bC3dE5fG7hI1jKmNbVcXzLkJ,3.75,Carol Williams`;

export function EmployeeList({ employees, onParseCSV, onClear, onCheckCompliance }: EmployeeListProps) {
  const [csvInput, setCsvInput] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400';
      case 'processing': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-zinc-800 text-zinc-500';
    }
  };

  const getStatusIcon = (status: Employee['status'], index: number) => {
    switch (status) {
      case 'paid': return '✓';
      case 'processing': return '◌';
      case 'failed': return '✗';
      default: return index + 1;
    }
  };

  const totalAmount = employees.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Employee List (CSV)
        </h3>
        
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setCsvInput(SAMPLE_CSV)}
            className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase hover:bg-cyan-500/10 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Load Sample
          </button>
          <label className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-mono uppercase hover:bg-zinc-800 cursor-pointer transition-colors flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload CSV
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          </label>
          {employees.length > 0 && (
            <button
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-mono uppercase hover:bg-red-500/10 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <textarea
          value={csvInput}
          onChange={(e) => setCsvInput(e.target.value)}
          placeholder="id,wallet,amount,name&#10;emp1,7xKXt...,5.0,Alice&#10;emp2,3mNzT...,8.0,Bob"
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-800 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none transition-colors resize-none"
        />
        
        <button
          onClick={() => onParseCSV(csvInput)}
          disabled={!csvInput.trim()}
          className="mt-3 w-full px-4 py-2.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm uppercase tracking-wider transition-colors"
        >
          Parse Employees
        </button>
      </div>

      {employees.length > 0 && (
        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Employee Registry</span>
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
              <span>{employees.length} recipients</span>
              <span className="text-emerald-400">{totalAmount.toFixed(2)} SOL</span>
            </div>
          </div>
          <div className="divide-y divide-zinc-800/50 max-h-64 overflow-y-auto">
            {employees.map((emp, idx) => (
              <div key={emp.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono ${getStatusColor(emp.status)}`}>
                    {getStatusIcon(emp.status, idx)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white">{emp.name}</span>
                      <ComplianceBadgeInline 
                        isCompliant={emp.complianceStatus === 'compliant'} 
                        isLoading={emp.complianceStatus === 'checking'} 
                      />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600">
                      {emp.wallet.slice(0, 8)}...{emp.wallet.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-emerald-400">{emp.amount} SOL</div>
                  <div className={`text-[10px] font-mono uppercase ${
                    emp.status === 'paid' ? 'text-emerald-500' :
                    emp.status === 'processing' ? 'text-yellow-500' :
                    emp.status === 'failed' ? 'text-red-500' :
                    'text-zinc-600'
                  }`}>
                    {emp.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
