'use client';

import { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
  title?: string;
  maxHeight?: string;
}

export function TerminalLog({ logs, title = 'shadowpay.terminal', maxHeight = '16rem' }: TerminalLogProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'system': return 'text-purple-400';
      default: return 'text-cyan-400';
    }
  };

  return (
    <div className="rounded-xl bg-black border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs font-mono text-zinc-500 ml-2">{title}</span>
      </div>
      <div 
        ref={terminalRef}
        className="overflow-y-auto p-4 font-mono text-xs space-y-1"
        style={{ maxHeight, background: 'linear-gradient(180deg, #000 0%, #0a0a0a 100%)' }}
      >
        {logs.length === 0 ? (
          <div className="text-zinc-600">
            <div>{'>'} ShadowPay v1.0.0</div>
            <div>{'>'} Private Payroll System</div>
            <div>{'>'} Powered by ShadowWire + Range</div>
            <div className="text-emerald-500">{'>'} Ready for commands...</div>
          </div>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex">
              <span className="text-zinc-600 mr-2 shrink-0">[{entry.timestamp}]</span>
              <span className={getLogColor(entry.type)}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
