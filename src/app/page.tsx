'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ShadowWireClient, initWASM, isWASMSupported } from '@radr/shadowwire';
import { Transaction, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { 
  deriveKeypair, 
  deriveAddress, 
  splitAmount, 
  calculatePrivacyScore,
  createKeypairSigner 
} from '../lib/privacy-utils';

let logIdCounter = 0;
function generateLogId(): string {
  return `log-${Date.now()}-${++logIdCounter}`;
}

// Types
interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'system';
}

interface Employee {
  id: string;
  wallet: string;
  amount: number;
  name: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
}

interface ScheduledWithdrawal {
  id: string;
  amount: number;
  targetAddress: string;
  scheduledTime: number;
  status: 'pending' | 'ready' | 'executed';
}

interface FreshAddress {
  index: number;
  publicKey: string;
  used: boolean;
}

type View = 'landing' | 'employer' | 'employee';

// Sample CSV for employers
const SAMPLE_CSV = `emp001,7xKXr9mPq4n8s2vL5hDqW3bN6cR8tY1zQwErTyUiOp,5.25,Alice Chen
emp002,3mNzT5wQ7rK9pL2xS4vB8cD1fG6hJ0kEaSdFgHjKlZ,8.00,Bob Martinez
emp003,9pQrS2tU4vW6xY8zA0bC3dE5fG7hI1jKmNbVcXzLkJ,3.75,Carol Williams`;

// Poisson-distributed timing for withdrawals (kept for UI preview)
function scheduleWithdrawals(splits: number[], baseAddress: string, seed: Uint8Array): ScheduledWithdrawal[] {
  const now = Date.now();
  const minAgingMs = 24 * 60 * 60 * 1000; // 24 hours
  const avgDelayMs = 4 * 60 * 60 * 1000; // 4 hours between withdrawals
  
  let currentTime = now + minAgingMs;
  
  return splits.map((amount, index) => {
    const poissonDelay = Math.round(-avgDelayMs * Math.log(1 - Math.random()));
    currentTime += poissonDelay;
    
    // Add jitter (+/- 30 minutes)
    const jitter = (Math.random() - 0.5) * 60 * 60 * 1000;
    const scheduledTime = currentTime + jitter;
    
    const freshAddress = deriveAddress(seed, index);
    
    return {
      id: `WD-${Date.now().toString(36)}-${index}`,
      amount,
      targetAddress: freshAddress,
      scheduledTime,
      status: 'pending' as const,
    };
  });
}

export default function ShadowPay() {
  const { connection } = useConnection();
  const { publicKey, signMessage, sendTransaction, connected } = useWallet();
  
  // Core state
  const [view, setView] = useState<View>('landing');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Balance state
  const [publicBalance, setPublicBalance] = useState<number>(0);
  const [shieldedBalance, setShieldedBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Employer state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [csvInput, setCsvInput] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isRunningPayroll, setIsRunningPayroll] = useState(false);
  const [payrollProgress, setPayrollProgress] = useState(0);
  
  // Employee state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [usePrivateWithdraw, setUsePrivateWithdraw] = useState(true);
  const [scheduledWithdrawals, setScheduledWithdrawals] = useState<ScheduledWithdrawal[]>([]);
  const [splitPreview, setSplitPreview] = useState<number[]>([]);
  const [freshAddresses, setFreshAddresses] = useState<FreshAddress[]>([]);
  const [addressSeed, setAddressSeed] = useState<Uint8Array>(new Uint8Array(32));
  const [isClient, setIsClient] = useState(false);
  
  // Privacy score
  const [privacyScore, setPrivacyScore] = useState(0);
  
  // Demo mode - for hackathon presentation
  const [demoMode, setDemoMode] = useState(true);
  const [complianceStatus, setComplianceStatus] = useState<'unchecked' | 'checking' | 'compliant' | 'failed'>('unchecked');

  useEffect(() => {
    setIsClient(true);
    const seed = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(seed);
    }
    setAddressSeed(seed);
  }, []);

  const log = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [...prev.slice(-100), entry]);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Initialize WASM
  useEffect(() => {
    if (typeof window !== 'undefined' && isWASMSupported()) {
      initWASM('/wasm/settler_wasm_bg.wasm')
        .then(() => log('[SYSTEM] ShadowWire WASM initialized', 'system'))
        .catch(() => log('[SYSTEM] WASM init skipped - using fallback', 'warning'));
    }
  }, [log]);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (publicKey && connected) {
      fetchBalances();
    }
  }, [publicKey, connected]);

  // Calculate privacy score based on current config
  useEffect(() => {
    const score = calculatePrivacyScore({
      splitCount: usePrivateWithdraw ? splitPreview.length || 5 : 1,
      uniqueAddresses: usePrivateWithdraw ? splitPreview.length || 5 : 1,
      minAgingHours: usePrivateWithdraw ? 24 : 0,
      poolSize: 500,
    });
    setPrivacyScore(score);
  }, [employees, usePrivateWithdraw, splitPreview]);

  // Preview splits when withdraw amount changes
  useEffect(() => {
    const amount = parseFloat(withdrawAmount);
    if (!isNaN(amount) && amount > 0 && usePrivateWithdraw) {
      const splits = splitAmount(amount);
      setSplitPreview(splits);
      
      const addresses: FreshAddress[] = splits.map((_, i) => ({
        index: freshAddresses.length + i,
        publicKey: deriveAddress(addressSeed, freshAddresses.length + i),
        used: false,
      }));
      setFreshAddresses(addresses);
    } else {
      setSplitPreview([]);
      setFreshAddresses([]);
    }
  }, [withdrawAmount, usePrivateWithdraw, addressSeed]);

  const fetchBalances = async () => {
    if (!publicKey && !demoMode) return;
    setIsLoadingBalance(true);
    log('[BALANCE] Fetching wallet balances...', 'info');

    if (demoMode) {
      await new Promise(r => setTimeout(r, 800));
      setPublicBalance(12.5);
      setShieldedBalance(45.75);
      log('[BALANCE] Public: 12.5000 SOL', 'success');
      log('[BALANCE] Shielded: 45.7500 SOL (via ShadowWire)', 'success');
      log('[RANGE] Wallet compliance verified ✓', 'success');
      setComplianceStatus('compliant');
      setIsLoadingBalance(false);
      return;
    }

    try {
      const lamports = await connection.getBalance(publicKey!);
      const solBalance = lamports / 1_000_000_000;
      setPublicBalance(solBalance);
      log(`[BALANCE] Public: ${solBalance.toFixed(4)} SOL`, 'success');

      const client = new ShadowWireClient();
      const balance = await client.getBalance(publicKey!.toBase58(), 'SOL');
      const shieldedLamports = (balance as any)?.available ?? 0;
      const shielded = shieldedLamports / 1_000_000_000;
      setShieldedBalance(shielded);
      log(`[BALANCE] Shielded: ${shielded.toFixed(4)} SOL`, 'success');
    } catch (err) {
      log(`[BALANCE] Error: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      log('[DEPOSIT] Invalid amount', 'error');
      return;
    }

    setIsDepositing(true);
    log(`[DEPOSIT] Shielding ${amount} SOL into private pool...`, 'info');

    if (demoMode) {
      await new Promise(r => setTimeout(r, 500));
      log('[DEPOSIT] Generating Bulletproof range proof...', 'info');
      await new Promise(r => setTimeout(r, 800));
      log('[DEPOSIT] Proof generated, submitting to ShadowWire...', 'info');
      await new Promise(r => setTimeout(r, 600));
      log(`[DEPOSIT] ✓ ${amount} SOL shielded successfully`, 'success');
      log('[DEPOSIT] Funds are now hidden from chain explorers', 'system');
      setPublicBalance(prev => Math.max(0, prev - amount));
      setShieldedBalance(prev => prev + amount);
      setDepositAmount('');
      setIsDepositing(false);
      return;
    }

    if (!publicKey || !sendTransaction) {
      log('[DEPOSIT] Wallet not connected', 'error');
      setIsDepositing(false);
      return;
    }

    try {
      const client = new ShadowWireClient();
      const lamports = Math.floor(amount * 1_000_000_000);

      const response = await client.deposit({
        wallet: publicKey.toBase58(),
        amount: lamports,
      }) as any;

      if (!response.success) {
        throw new Error(response.error || 'Deposit failed');
      }

      if (response.unsigned_tx_base64) {
        log('[DEPOSIT] Signing transaction...', 'warning');
        const txBuffer = Buffer.from(response.unsigned_tx_base64, 'base64');
        const transaction = Transaction.from(txBuffer);
        
        const signature = await sendTransaction(transaction, connection);
        log(`[DEPOSIT] Tx submitted: ${signature.slice(0, 16)}...`, 'info');

        await connection.confirmTransaction(signature, 'confirmed');
        log(`[DEPOSIT] ✓ ${amount} SOL shielded successfully`, 'success');
        log('[DEPOSIT] Funds are now hidden from chain explorers', 'system');
      }

      setDepositAmount('');
      fetchBalances();
    } catch (err) {
      log(`[DEPOSIT] Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsDepositing(false);
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvInput(event.target?.result as string);
        log('[CSV] File loaded successfully', 'success');
      };
      reader.onerror = () => {
        log('[CSV] Failed to read file', 'error');
      };
      reader.readAsText(file);
    }
  };

  // Parse CSV input
  const parseCSV = async () => {
    if (!csvInput.trim()) {
      log('[CSV] No data provided', 'error');
      return;
    }

    const lines = csvInput.trim().split('\n');
    const parsed: Employee[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        parsed.push({
          id: parts[0] || `emp-${parsed.length + 1}`,
          wallet: parts[1],
          amount: parseFloat(parts[2]) || 0,
          name: parts[3] || `Employee ${parsed.length + 1}`,
          status: 'pending',
        });
      }
    }

    if (parsed.length === 0) {
      log('[CSV] No valid entries found', 'error');
      return;
    }

    setEmployees(parsed);
    const total = parsed.reduce((s, e) => s + e.amount, 0);
    log(`[CSV] Parsed ${parsed.length} employees, total: ${total.toFixed(2)} SOL`, 'success');
    
    if (demoMode) {
      log('[RANGE] Checking employee wallet compliance...', 'info');
      for (let i = 0; i < parsed.length; i++) {
        await new Promise(r => setTimeout(r, 300));
        const riskScore = Math.floor(Math.random() * 3);
        log(`[RANGE] ✓ ${parsed[i].name} wallet compliant (risk: ${riskScore}/10)`, 'success');
      }
      log('[RANGE] All recipients verified - no sanctioned wallets detected', 'system');
      setComplianceStatus('compliant');
    }
  };

  const runPayroll = async () => {
    if (employees.length === 0) {
      log('[PAYROLL] No employees loaded', 'error');
      return;
    }

    const total = employees.reduce((s, e) => s + e.amount, 0);
    if (shieldedBalance < total) {
      log(`[PAYROLL] Insufficient shielded balance. Need ${total} SOL, have ${shieldedBalance}`, 'error');
      return;
    }

    setIsRunningPayroll(true);
    setPayrollProgress(0);
    log('[PAYROLL] ═══════════════════════════════════════', 'system');
    log('[PAYROLL] Executing private payroll via ShadowWire...', 'info');

    if (demoMode) {
      let completed = 0;
      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        setEmployees(prev => prev.map((e, idx) => 
          idx === i ? { ...e, status: 'processing' } : e
        ));
        
        log(`[PAYROLL] Processing ${emp.name} (${emp.wallet.slice(0, 8)}...)`, 'info');
        await new Promise(r => setTimeout(r, 400));
        log(`[RANGE] Recipient compliance verified ✓`, 'info');
        await new Promise(r => setTimeout(r, 300));
        log(`[SHADOWWIRE] Generating Bulletproof range proof...`, 'info');
        await new Promise(r => setTimeout(r, 500));
        
        completed++;
        setEmployees(prev => prev.map((e, idx) => 
          idx === i ? { ...e, status: 'paid' } : e
        ));
        log(`[PAYROLL] ✓ ${emp.name}: ${emp.amount} SOL transferred (AMOUNT HIDDEN)`, 'success');
        setPayrollProgress(((i + 1) / employees.length) * 100);
      }
      
      log('[PAYROLL] ═══════════════════════════════════════', 'system');
      log(`[PAYROLL] Complete: ${completed}/${employees.length} transfers successful`, 'success');
      log('[PAYROLL] All amounts hidden via Bulletproof range proofs', 'system');
      log('[PAYROLL] Observers see transfers but cannot determine amounts', 'system');
      setShieldedBalance(prev => prev - total);
      setIsRunningPayroll(false);
      return;
    }

    if (!publicKey || !signMessage) {
      log('[PAYROLL] Wallet not connected', 'error');
      setIsRunningPayroll(false);
      return;
    }

    const client = new ShadowWireClient();
    let completed = 0;

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      
      setEmployees(prev => prev.map((e, idx) => 
        idx === i ? { ...e, status: 'processing' } : e
      ));
      
      log(`[PAYROLL] Processing ${emp.name} (${emp.wallet.slice(0, 8)}...)`, 'info');

      try {
        const result = await client.transfer({
          sender: publicKey.toBase58(),
          recipient: emp.wallet,
          amount: emp.amount,
          token: 'SOL',
          type: 'internal',
          wallet: { signMessage },
        });

        if (result) {
          completed++;
          setEmployees(prev => prev.map((e, idx) => 
            idx === i ? { ...e, status: 'paid' } : e
          ));
          log(`[PAYROLL] ✓ ${emp.name}: ${emp.amount} SOL transferred (HIDDEN)`, 'success');
        } else {
          throw new Error('Transfer returned null');
        }
      } catch (err) {
        setEmployees(prev => prev.map((e, idx) => 
          idx === i ? { ...e, status: 'failed' } : e
        ));
        log(`[PAYROLL] ✗ ${emp.name}: ${err instanceof Error ? err.message : 'Failed'}`, 'error');
      }

      setPayrollProgress(((i + 1) / employees.length) * 100);
    }

    log('[PAYROLL] ═══════════════════════════════════════', 'system');
    log(`[PAYROLL] Complete: ${completed}/${employees.length} transfers successful`, completed === employees.length ? 'success' : 'warning');
    log('[PAYROLL] All amounts hidden via Bulletproof range proofs', 'system');
    
    setIsRunningPayroll(false);
    fetchBalances();
  };

  // Real withdrawal (or demo mode simulation)
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      log('[WITHDRAW] Invalid amount', 'error');
      return;
    }

    if (amount > shieldedBalance) {
      log('[WITHDRAW] Insufficient shielded balance', 'error');
      return;
    }

    setIsWithdrawing(true);
    log(`[WITHDRAW] Unshielding ${amount} SOL...`, 'info');

    // Demo mode simulation
    if (demoMode) {
      await new Promise(r => setTimeout(r, 600));
      log('[WITHDRAW] Generating withdrawal proof...', 'info');
      await new Promise(r => setTimeout(r, 800));
      log('[SHADOWWIRE] Verifying Bulletproof range proof...', 'info');
      await new Promise(r => setTimeout(r, 500));
      log(`[WITHDRAW] ✓ ${amount} SOL returned to public wallet`, 'success');
      log('[WITHDRAW] Funds are now visible on-chain', 'system');
      setShieldedBalance(prev => Math.max(0, prev - amount));
      setPublicBalance(prev => prev + amount);
      setWithdrawAmount('');
      setIsWithdrawing(false);
      return;
    }

    if (!publicKey || !sendTransaction) {
      log('[WITHDRAW] Wallet not connected', 'error');
      setIsWithdrawing(false);
      return;
    }

    try {
      const client = new ShadowWireClient();
      const lamports = Math.floor(amount * 1_000_000_000);

      log(`[WITHDRAW] Calling withdraw API with ${lamports} lamports...`, 'info');
      
      const response = await client.withdraw({
        wallet: publicKey.toBase58(),
        amount: lamports,
      }) as any;

      log(`[WITHDRAW] API Response: ${JSON.stringify(response)}`, 'info');

      if (!response.success) {
        throw new Error(response.error || 'Withdrawal failed');
      }

      if (response.unsigned_tx_base64) {
        log('[WITHDRAW] Got unsigned tx, signing...', 'info');
        const txBuffer = Buffer.from(response.unsigned_tx_base64, 'base64');
        const transaction = Transaction.from(txBuffer);
        
        log(`[WITHDRAW] Tx has ${transaction.instructions.length} instruction(s)`, 'info');
        
        const signature = await sendTransaction(transaction, connection);
        log(`[WITHDRAW] Tx submitted: ${signature}`, 'info');
        
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        log(`[WITHDRAW] Confirmation: ${JSON.stringify(confirmation)}`, 'info');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        log(`[WITHDRAW] ✓ ${amount} SOL returned to public wallet`, 'success');
      } else if (response.tx_signature) {
        log(`[WITHDRAW] Relayer handled tx: ${response.tx_signature}`, 'info');
        log('[WITHDRAW] Waiting for relayer confirmation...', 'info');
        await new Promise(r => setTimeout(r, 5000));
        log(`[WITHDRAW] ✓ Relayer tx complete`, 'success');
      } else {
        log(`[WITHDRAW] ⚠ No unsigned_tx or tx_signature in response`, 'warning');
      }

      if (response.unsigned_tx_base64) {
        const txBuffer = Buffer.from(response.unsigned_tx_base64, 'base64');
        const transaction = Transaction.from(txBuffer);
        
        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');
        log(`[WITHDRAW] ✓ ${amount} SOL returned to public wallet`, 'success');
      } else if (response.tx_signature) {
        log(`[WITHDRAW] ✓ Relayer tx: ${response.tx_signature.slice(0, 16)}...`, 'success');
      }

      setWithdrawAmount('');
      fetchBalances();
    } catch (err) {
      log(`[WITHDRAW] Failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Execute private withdrawal with splitting and mixing
  // Since ShadowWire can only withdraw to the owner's wallet, we:
  // 1. Withdraw from shielded pool to user's public wallet
  // 2. Split on-chain through fresh mixing addresses
  // 3. Recombine back to user's wallet
  const executePrivateWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > shieldedBalance) {
      log('[STEALTH] Invalid amount or insufficient balance', 'error');
      return;
    }

    setIsWithdrawing(true);
    
    // Demo mode simulation
    if (demoMode) {
      const splits = splitAmount(amount);
      
      log('[STEALTH] ═══════════════════════════════════════', 'system');
      log('[STEALTH] Phase 1: Unshielding from private pool...', 'info');
      await new Promise(r => setTimeout(r, 600));
      log('[SHADOWWIRE] Generating Bulletproof range proof...', 'info');
      await new Promise(r => setTimeout(r, 800));
      log(`[STEALTH] ✓ ${amount} SOL unshielded to your wallet`, 'success');
      
      log('[STEALTH] ───────────────────────────────────────', 'system');
      log(`[STEALTH] Phase 2: Splitting through ${splits.length} mixing addresses...`, 'info');
      
      for (let i = 0; i < splits.length; i++) {
        const splitAmt = splits[i];
        const addr = freshAddresses[i]?.publicKey || deriveAddress(addressSeed, i);
        await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
        log(`[STEALTH] Fragment ${i + 1}/${splits.length}: ${splitAmt.toFixed(4)} SOL → ${addr.slice(0, 8)}...`, 'info');
        await new Promise(r => setTimeout(r, 200));
        log(`[STEALTH] ✓ Fragment ${i + 1} sent to mix address`, 'success');
      }
      
      log('[STEALTH] ───────────────────────────────────────', 'system');
      log(`[STEALTH] Phase 3: Scheduling ${splits.length} time-staggered returns...`, 'info');
      
      const now = Date.now();
      const minAgingMs = 24 * 60 * 60 * 1000; // 24 hours minimum
      const avgDelayMs = 4 * 60 * 60 * 1000; // ~4 hours between withdrawals
      let currentTime = now + minAgingMs;
      
      const demoWithdrawals: ScheduledWithdrawal[] = [];
      
      for (let i = 0; i < splits.length; i++) {
        const poissonDelay = Math.round(-avgDelayMs * Math.log(1 - Math.random()));
        currentTime += poissonDelay;
        const jitter = (Math.random() - 0.5) * 60 * 60 * 1000; // ±30 min jitter
        const scheduledTime = currentTime + jitter;
        
        const hoursFromNow = Math.round((scheduledTime - now) / (60 * 60 * 1000));
        const addr = freshAddresses[i]?.publicKey || deriveAddress(addressSeed, i);
        
        await new Promise(r => setTimeout(r, 250));
        log(`[STEALTH] Fragment ${i + 1}: ${splits[i].toFixed(4)} SOL scheduled in ~${hoursFromNow}h → ${addr.slice(0, 8)}...`, 'success');
        
        demoWithdrawals.push({
          id: `WD-${Date.now().toString(36)}-${i}`,
          amount: splits[i],
          targetAddress: addr,
          scheduledTime,
          status: 'pending' as const,
        });
      }
      
      setScheduledWithdrawals(prev => [...prev, ...demoWithdrawals]);
      
      log('[STEALTH] ═══════════════════════════════════════', 'system');
      log(`[STEALTH] Complete: ${splits.length} fragments scheduled over ${Math.round((currentTime - now - minAgingMs) / (60 * 60 * 1000))}+ hours`, 'success');
      log('[STEALTH] Poisson-distributed timing defeats temporal correlation', 'system');
      log('[STEALTH] Each fragment uses a fresh derived address', 'system');
      log('[STEALTH] Amount splitting defeats value correlation', 'system');
      log('[STEALTH] Funds will return to your wallet over the scheduled period', 'info');
      
      setShieldedBalance(prev => Math.max(0, prev - amount));
      setWithdrawAmount('');
      setIsWithdrawing(false);
      return;
    }

    if (!publicKey || !sendTransaction || !signMessage) {
      log('[STEALTH] Wallet not connected or signing unavailable', 'error');
      setIsWithdrawing(false);
      return;
    }

    const employeeAddress = publicKey.toBase58();
    
    log('[STEALTH] ═══════════════════════════════════════', 'system');
    log('[STEALTH] Phase 1: Unshielding from private pool...', 'info');

    const client = new ShadowWireClient();
    const lamports = Math.floor(amount * 1_000_000_000);

    try {
      const response = await client.withdraw({
        wallet: employeeAddress,
        amount: lamports,
      }) as any;

      log(`[STEALTH] Withdraw response: ${JSON.stringify(response)}`, 'info');

      if (!response.success) {
        throw new Error(response.error || 'Withdrawal failed');
      }

      if (response.unsigned_tx_base64) {
        log('[STEALTH] Signing withdrawal transaction...', 'info');
        const txBuffer = Buffer.from(response.unsigned_tx_base64, 'base64');
        const transaction = Transaction.from(txBuffer);
        
        const signature = await sendTransaction(transaction, connection);
        log(`[STEALTH] Withdrawal tx submitted: ${signature.slice(0, 16)}...`, 'info');
        
        await connection.confirmTransaction(signature, 'confirmed');
        log(`[STEALTH] ✓ ${amount} SOL unshielded to your wallet`, 'success');
      } else if (response.tx_signature) {
        log(`[STEALTH] ✓ Relayer withdrawal: ${response.tx_signature.slice(0, 16)}...`, 'success');
        await new Promise(r => setTimeout(r, 3000));
      } else {
        throw new Error('No transaction returned from withdrawal');
      }
    } catch (err) {
      log(`[STEALTH] ✗ Unshield failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
      setIsWithdrawing(false);
      return;
    }

    log('[STEALTH] ───────────────────────────────────────', 'system');
    log('[STEALTH] Phase 2: Splitting through mixing addresses...', 'info');

    const splits = splitAmount(amount);
    const hopKeypairs: { keypair: Keypair; amount: number; index: number }[] = [];
    
    log(`[STEALTH] Splitting ${amount} SOL into ${splits.length} fragments`, 'info');

    const withdrawalRecords: ScheduledWithdrawal[] = [];
    let phase2Success = 0;

    for (let i = 0; i < splits.length; i++) {
      const splitAmt = splits[i];
      const hopIndex = Date.now() + i;
      const hopKeypair = deriveKeypair(addressSeed, hopIndex);
      const hopAddress = hopKeypair.publicKey.toBase58();
      const splitLamports = Math.floor(splitAmt * LAMPORTS_PER_SOL);
      
      log(`[STEALTH] Fragment ${i + 1}/${splits.length}: ${splitAmt.toFixed(4)} SOL → ${hopAddress.slice(0, 8)}...`, 'info');

      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: hopKeypair.publicKey,
            lamports: splitLamports,
          })
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');
        
        hopKeypairs.push({ keypair: hopKeypair, amount: splitAmt, index: i });
        phase2Success++;
        log(`[STEALTH] ✓ Fragment ${i + 1} sent to mix address (${signature.slice(0, 8)}...)`, 'success');
      } catch (err) {
        log(`[STEALTH] ✗ Fragment ${i + 1} failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
      }

      if (i < splits.length - 1) {
        await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
      }
    }

    if (phase2Success === 0) {
      log('[STEALTH] ✗ All fragments failed - funds remain in your wallet', 'error');
      setIsWithdrawing(false);
      fetchBalances();
      return;
    }

    log('[STEALTH] ───────────────────────────────────────', 'system');
    log(`[STEALTH] Phase 3: Returning ${hopKeypairs.length} fragments...`, 'info');

    let phase3Success = 0;
    for (let i = 0; i < hopKeypairs.length; i++) {
      const { keypair, amount: hopAmount, index } = hopKeypairs[i];
      const hopAddress = keypair.publicKey.toBase58();
      
      const delay = 500 + Math.random() * 1500;
      await new Promise(r => setTimeout(r, delay));
      
      log(`[STEALTH] Return ${i + 1}/${hopKeypairs.length}: ${hopAddress.slice(0, 8)}... → You`, 'info');

      try {
        const hopBalance = await connection.getBalance(keypair.publicKey);
        log(`[STEALTH] Hop ${i + 1} balance: ${(hopBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`, 'info');
        const transferAmount = hopBalance - 5000;
        
        if (transferAmount <= 0) {
          log(`[STEALTH] ✗ Hop ${i + 1} has insufficient balance`, 'warning');
          continue;
        }

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: publicKey,
            lamports: transferAmount,
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = keypair.publicKey;
        transaction.sign(keypair);

        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        phase3Success++;
        log(`[STEALTH] ✓ ${(transferAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL returned (${signature.slice(0, 8)}...)`, 'success');
        
        withdrawalRecords.push({
          id: `WD-${Date.now().toString(36)}-${index}`,
          amount: transferAmount / LAMPORTS_PER_SOL,
          targetAddress: employeeAddress,
          scheduledTime: Date.now(),
          status: 'executed',
        });
      } catch (err) {
        log(`[STEALTH] ✗ Return ${i + 1} failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
        withdrawalRecords.push({
          id: `WD-${Date.now().toString(36)}-${index}`,
          amount: hopAmount,
          targetAddress: hopAddress,
          scheduledTime: Date.now(),
          status: 'pending',
        });
      }
    }

    setScheduledWithdrawals(prev => [...prev, ...withdrawalRecords]);
    
    log('[STEALTH] ═══════════════════════════════════════', 'system');
    log(`[STEALTH] Complete: ${phase3Success}/${hopKeypairs.length} fragments returned`, phase3Success === hopKeypairs.length ? 'success' : 'warning');
    log('[STEALTH] Transaction graph obfuscated via mixing addresses', 'system');
    log('[STEALTH] Amount correlation defeated via splitting', 'system');
    
    setWithdrawAmount('');
    setIsWithdrawing(false);
    fetchBalances();
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  // Landing page
  if ((!connected && !demoMode) || view === 'landing') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated grid background */}
        <div className="fixed inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
        
        {/* Gradient orbs */}
        <div className="fixed top-1/4 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="fixed bottom-1/4 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Demo mode toggle */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all ${
              demoMode 
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            {demoMode ? '🎬 Demo Mode' : 'Demo Off'}
          </button>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 mb-4 tracking-tighter">
            SHADOWPAY
          </h1>
          
          <p className="text-lg md:text-xl font-mono text-emerald-500/60 mb-2 tracking-wide">
            PRIVATE PAYROLL FOR SOLANA
          </p>
          
          <p className="text-sm font-mono text-zinc-500 mb-12 max-w-md text-center">
            Military-grade privacy via Bulletproof range proofs. Salaries hidden on-chain. Zero logging.
          </p>

          {/* Connect or select mode */}
          {!connected && !demoMode ? (
            <div className="flex flex-col items-center gap-6">
              <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-500 !rounded-xl !font-mono !text-sm !uppercase !tracking-wider !h-14 !px-8 !transition-all !shadow-xl !shadow-emerald-500/20" />
              
              <div className="text-center">
                <p className="text-xs font-mono text-zinc-600 mb-2">or</p>
                <button
                  onClick={() => { setDemoMode(true); fetchBalances(); }}
                  className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 text-sm font-mono uppercase hover:bg-purple-500/10 transition-colors"
                >
                  🎬 Try Demo Mode
                </button>
              </div>
              
              <div className="flex items-center gap-6 text-xs font-mono text-zinc-600">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  ZK Protected
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                  Non-Custodial
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  No Logging
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {demoMode && (
                <div className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono mb-2">
                  🎬 DEMO MODE — Simulated data for presentation
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                <button
                  onClick={() => { setView('employer'); log('[SYSTEM] Employer mode activated', 'system'); fetchBalances(); }}
                  className="group relative p-8 rounded-2xl border border-emerald-500/30 bg-black/50 backdrop-blur hover:border-emerald-500 transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-mono font-bold text-emerald-400 uppercase">Employer</h3>
                      <p className="text-xs font-mono text-zinc-500 mt-1">Run private payroll</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setView('employee'); log('[SYSTEM] Employee mode activated', 'system'); fetchBalances(); }}
                  className="group relative p-8 rounded-2xl border border-cyan-500/30 bg-black/50 backdrop-blur hover:border-cyan-500 transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-mono font-bold text-cyan-400 uppercase">Employee</h3>
                      <p className="text-xs font-mono text-zinc-500 mt-1">View & withdraw salary</p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-xs font-mono text-emerald-500/50 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                All salary data encrypted via Bulletproofs
              </p>
            </div>
          )}

          {/* Tech badges */}
          <div className="absolute bottom-8 flex items-center gap-4">
            {['ShadowWire', 'Helius RPC', 'Bulletproofs'].map(tech => (
              <span key={tech} className="px-3 py-1 rounded-full border border-zinc-800 bg-black/50 text-xs font-mono text-zinc-500">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // EMPLOYER DASHBOARD
  // ════════════════════════════════════════════════════════════════
  if (view === 'employer') {
    const totalPayroll = employees.reduce((s, e) => s + e.amount, 0);
    
    return (
      <div className="min-h-screen bg-black">
        {/* Background */}
        <div className="fixed inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('landing')}
                className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="text-xs font-mono uppercase">Back</span>
              </button>
              <div className="w-px h-6 bg-zinc-800" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-mono font-bold text-emerald-400 uppercase tracking-wider">ShadowPay</h1>
                  <p className="text-[10px] font-mono text-zinc-500">Employer Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-emerald-400">NO LOGGING</span>
              </div>
              <WalletMultiButton className="!bg-zinc-900 !border !border-zinc-800 hover:!border-emerald-500 !rounded-lg !font-mono !text-xs !h-10" />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Controls */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Shielded Vault</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {isLoadingBalance ? '...' : `${shieldedBalance.toFixed(2)}`}
                    <span className="text-sm text-emerald-400/50 ml-1">SOL</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Privacy Score</div>
                  <div className="text-2xl font-mono font-bold" style={{ color: privacyScore >= 70 ? '#10B981' : privacyScore >= 40 ? '#F59E0B' : '#EF4444' }}>
                    {privacyScore}
                    <span className="text-sm opacity-50 ml-1">/ 100</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Employees</div>
                  <div className="text-2xl font-mono font-bold text-cyan-400">{employees.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Total Payroll</div>
                  <div className="text-2xl font-mono font-bold text-purple-400">
                    {totalPayroll.toFixed(2)}
                    <span className="text-sm text-purple-400/50 ml-1">SOL</span>
                  </div>
                </div>
              </div>

              {/* Deposit Section */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Shield Funds
                </h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount in SOL"
                    className="flex-1 px-4 py-3 rounded-lg bg-black border border-zinc-800 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={isDepositing || !depositAmount}
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
                  Public balance: {publicBalance.toFixed(4)} SOL
                </p>
              </div>

              {/* CSV Input */}
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
                    onClick={() => { setCsvInput(SAMPLE_CSV); log('[CSV] Sample data loaded', 'success'); }}
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
                </div>
                <textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="id,wallet,amount,name&#10;emp1,7xKXt...,5.0,Alice&#10;emp2,3mNzT...,8.0,Bob"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-800 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                />
                <button
                  onClick={parseCSV}
                  className="mt-3 w-full px-4 py-2.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono text-sm uppercase tracking-wider transition-colors"
                >
                  Parse Employees
                </button>
              </div>

              {/* Run Payroll Button */}
              <button
                onClick={runPayroll}
                disabled={isRunningPayroll || employees.length === 0 || shieldedBalance < totalPayroll}
                className="w-full relative group"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 opacity-75 blur-sm group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-black font-mono text-lg uppercase tracking-wider text-emerald-400 group-hover:text-white transition-colors disabled:opacity-50">
                  {isRunningPayroll ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
                      </svg>
                      <span>Processing Payroll...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Run Private Payroll</span>
                    </>
                  )}
                </div>
                {isRunningPayroll && (
                  <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 rounded-full transition-all" style={{ width: `${payrollProgress}%` }} />
                )}
              </button>
            </div>

            {/* Right Column - Terminal & Employees */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              {/* Terminal */}
              <div className="rounded-xl bg-black border border-zinc-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs font-mono text-zinc-500 ml-2">shadowpay.terminal</span>
                </div>
                <div 
                  ref={terminalRef}
                  className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1"
                  style={{ background: 'linear-gradient(180deg, #000 0%, #0a0a0a 100%)' }}
                >
                  {logs.length === 0 ? (
                    <div className="text-zinc-600">
                      <div>{'>'} ShadowPay v1.0.0</div>
                      <div>{'>'} Private Payroll System</div>
                      <div>{'>'} Powered by Bulletproofs</div>
                      <div className="text-emerald-500">{'>'} Ready for commands...</div>
                    </div>
                  ) : (
                    logs.map((entry) => (
                      <div key={entry.id} className="flex">
                        <span className="text-zinc-600 mr-2">[{entry.timestamp}]</span>
                        <span className={
                          entry.type === 'success' ? 'text-emerald-400' :
                          entry.type === 'error' ? 'text-red-400' :
                          entry.type === 'warning' ? 'text-yellow-400' :
                          entry.type === 'system' ? 'text-purple-400' :
                          'text-cyan-400'
                        }>
                          {entry.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Employee List */}
              {employees.length > 0 && (
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Employee Registry</span>
                    <span className="text-xs font-mono text-zinc-600">{employees.length} recipients</span>
                  </div>
                  <div className="divide-y divide-zinc-800/50">
                    {employees.map((emp, idx) => (
                      <div key={emp.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono ${
                            emp.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                            emp.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                            emp.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-zinc-800 text-zinc-500'
                          }`}>
                            {emp.status === 'paid' ? '✓' : emp.status === 'processing' ? '◌' : emp.status === 'failed' ? '✗' : idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-mono text-white">{emp.name}</div>
                            <div className="text-[10px] font-mono text-zinc-600">{emp.wallet.slice(0, 8)}...{emp.wallet.slice(-4)}</div>
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
          </div>
        </main>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // EMPLOYEE DASHBOARD
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(#00F0FF 1px, transparent 1px), linear-gradient(90deg, #00F0FF 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('landing')}
              className="flex items-center gap-2 text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="text-xs font-mono uppercase">Back</span>
            </button>
            <div className="w-px h-6 bg-zinc-800" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-mono font-bold text-cyan-400 uppercase tracking-wider">ShadowPay</h1>
                <p className="text-[10px] font-mono text-zinc-500">Employee Portal</p>
              </div>
            </div>
          </div>
          <WalletMultiButton className="!bg-zinc-900 !border !border-zinc-800 hover:!border-cyan-500 !rounded-lg !font-mono !text-xs !h-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/10" />
            <div className="relative p-8 border border-zinc-800 rounded-2xl bg-black/50 backdrop-blur">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Your Shielded Balance</div>
                  <div className="flex items-baseline gap-3">
                    {showSalary ? (
                      <>
                        <span className="text-5xl font-mono font-black text-cyan-400">{shieldedBalance.toFixed(2)}</span>
                        <span className="text-xl font-mono text-cyan-400/50">SOL</span>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-mono font-black text-zinc-600">••••••</span>
                        <span className="text-xl font-mono text-zinc-700">HIDDEN</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowSalary(!showSalary)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showSalary ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                  <span className="text-xs font-mono uppercase">{showSalary ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span className="text-sm font-mono text-emerald-400">Your salary is protected by Bulletproof range proofs</span>
              </div>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono font-bold text-purple-400 uppercase flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Withdraw to Wallet
              </h3>
              <button
                onClick={() => setUsePrivateWithdraw(!usePrivateWithdraw)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all flex items-center gap-2 ${
                  usePrivateWithdraw 
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {usePrivateWithdraw ? 'Private Mode' : 'Simple Mode'}
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount in SOL"
                className="flex-1 px-4 py-3 rounded-lg bg-black border border-zinc-800 text-white font-mono text-sm focus:border-purple-500 focus:outline-none transition-colors"
              />
              <button
                onClick={usePrivateWithdraw ? executePrivateWithdraw : handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount}
                className={`px-6 py-3 rounded-lg text-white font-mono text-sm uppercase tracking-wider transition-colors flex items-center gap-2 ${
                  usePrivateWithdraw 
                    ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800' 
                    : 'bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800'
                } disabled:text-zinc-600`}
              >
                {isWithdrawing ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {usePrivateWithdraw ? (
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    ) : (
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    )}
                  </svg>
                )}
                {usePrivateWithdraw ? 'Schedule' : 'Withdraw'}
              </button>
            </div>

            {/* Private Mode: Split Preview */}
            {usePrivateWithdraw && splitPreview.length > 0 && isClient && (
              <div className="mt-4 p-4 rounded-lg bg-black/50 border border-emerald-500/20">
                <div className="text-xs font-mono text-emerald-400 uppercase mb-3 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Stealth Withdrawal Plan
                </div>
                <div className="space-y-2">
                  {splitPreview.map((amount, idx) => {
                    const addr = freshAddresses[idx];
                    
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-zinc-600">{idx === splitPreview.length - 1 ? '└──' : '├──'}</span>
                        <span className="text-purple-400 w-20">{amount.toFixed(4)} SOL</span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-cyan-400 font-mono">
                          {addr?.publicKey.slice(0, 8)}...{addr?.publicKey.slice(-4)}
                        </span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-emerald-400/70">
                          Instant mix
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500/60">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    Funds will be split across {splitPreview.length} fresh addresses instantly
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-yellow-500/80">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                    </svg>
                    Requires {splitPreview.length} wallet signature{splitPreview.length > 1 ? 's' : ''} (1 per fragment)
                  </div>
                </div>
              </div>
            )}

            {!usePrivateWithdraw && (
              <p className="text-[10px] font-mono text-zinc-600">
                ⚠️ Simple mode reveals amount on-chain. Enable Private Mode for stealth withdrawals.
              </p>
            )}
          </div>

          {/* Withdrawal History */}
          {isClient && scheduledWithdrawals.length > 0 && (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Stealth Withdrawals ({scheduledWithdrawals.filter(w => w.status === 'executed').length}/{scheduledWithdrawals.length})
              </h3>
              <div className="space-y-2">
                {scheduledWithdrawals.map((withdrawal) => {
                  const isExecuted = withdrawal.status === 'executed';
                  const now = Date.now();
                  const timeUntil = withdrawal.scheduledTime - now;
                  const hoursUntil = Math.floor(timeUntil / (60 * 60 * 1000));
                  const minsUntil = Math.floor((timeUntil % (60 * 60 * 1000)) / (60 * 1000));
                  const isReady = timeUntil <= 0 || isExecuted;
                  
                  return (
                    <div 
                      key={withdrawal.id}
                      className={`p-3 rounded-lg border ${
                        isExecuted 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : isReady
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-black/30 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono ${
                            isExecuted 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : isReady
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {isExecuted ? '✓' : isReady ? '◌' : '⏳'}
                          </div>
                          <div>
                            <div className="text-sm font-mono text-white">{withdrawal.amount.toFixed(4)} SOL</div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              → {withdrawal.targetAddress.slice(0, 12)}...{withdrawal.targetAddress.slice(-4)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-mono uppercase ${
                            isExecuted ? 'text-emerald-400' : isReady ? 'text-yellow-400' : 'text-zinc-500'
                          }`}>
                            {isExecuted ? 'Delivered' : isReady ? 'Ready' : `${hoursUntil}h ${minsUntil}m`}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-600">
                            {new Date(withdrawal.scheduledTime).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Privacy Score */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Privacy Score
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#27272a" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="40" 
                    stroke={privacyScore >= 70 ? '#10B981' : privacyScore >= 40 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${privacyScore * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-mono font-bold text-white">{privacyScore}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-500">Amount Privacy</span>
                    <span className="text-emerald-400">High</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-500">Timing Privacy</span>
                    <span className="text-yellow-400">Medium</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-500">Address Privacy</span>
                    <span className="text-emerald-400">High</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="rounded-xl bg-black border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-zinc-500 ml-2">activity.log</span>
            </div>
            <div 
              ref={terminalRef}
              className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1"
            >
              {logs.length === 0 ? (
                <div className="text-zinc-600">
                  <div>{'>'} ShadowPay Employee Portal</div>
                  <div>{'>'} Balance protected by ZK proofs</div>
                  <div className="text-cyan-500">{'>'} Waiting for activity...</div>
                </div>
              ) : (
                logs.map((entry) => (
                  <div key={entry.id} className="flex">
                    <span className="text-zinc-600 mr-2">[{entry.timestamp}]</span>
                    <span className={
                      entry.type === 'success' ? 'text-emerald-400' :
                      entry.type === 'error' ? 'text-red-400' :
                      entry.type === 'warning' ? 'text-yellow-400' :
                      entry.type === 'system' ? 'text-purple-400' :
                      'text-cyan-400'
                    }>
                      {entry.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
