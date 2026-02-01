export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'system';
}

export interface Employee {
  id: string;
  wallet: string;
  amount: number;
  name: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  complianceStatus?: 'unchecked' | 'checking' | 'compliant' | 'non-compliant';
  riskScore?: number;
}

export interface ScheduledWithdrawal {
  id: string;
  amount: number;
  targetAddress: string;
  scheduledTime: number;
  status: 'pending' | 'ready' | 'executed';
}

export interface FreshAddress {
  index: number;
  publicKey: string;
  used: boolean;
}

export interface ComplianceStatus {
  isCompliant: boolean;
  isLoading: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isSanctioned: boolean;
  lastChecked?: number;
}

export interface BalanceInfo {
  public: number;
  shielded: number;
  isLoading: boolean;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalAmount: number;
  paidCount: number;
  failedCount: number;
  pendingCount: number;
}

export type View = 'landing' | 'employer' | 'employee';
export type DemoMode = 'live' | 'demo';
