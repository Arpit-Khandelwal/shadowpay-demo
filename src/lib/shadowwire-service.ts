import { ShadowWireClient } from '@radr/shadowwire';

export type TransferType = 'internal' | 'external';

export type SupportedToken = 
  | 'SOL' | 'RADR' | 'USDC' | 'ORE' | 'BONK' | 'JIM' | 'GODL' 
  | 'HUSTLE' | 'ZEC' | 'CRT' | 'BLACKCOIN' | 'GIL' | 'ANON' 
  | 'WLFI' | 'USD1' | 'AOL' | 'IQLABS' | 'SANA' | 'POKI' | 'RAIN' | 'HOSICO' | 'SKR';

export interface TransferParams {
  sender: string;
  recipient: string;
  amount: number;
  token: SupportedToken;
  type: TransferType;
  wallet?: { signMessage: (message: Uint8Array) => Promise<Uint8Array> };
}

export interface TransferResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  fee?: number;
  netAmount?: number;
}

export interface BalanceResult {
  available: number;
  pending: number;
  token: SupportedToken;
}

export interface ShadowWireConfig {
  apiBaseUrl?: string;
  debug?: boolean;
}

interface ShadowWireResponse {
  transactionId?: string;
  signature?: string;
  [key: string]: unknown;
}

const TOKEN_DECIMALS: Record<SupportedToken, number> = {
  SOL: 9, RADR: 9, USDC: 6, ORE: 11, BONK: 5, JIM: 9, GODL: 11,
  HUSTLE: 9, ZEC: 9, CRT: 9, BLACKCOIN: 6, GIL: 6, ANON: 9,
  WLFI: 6, USD1: 6, AOL: 6, IQLABS: 9, SANA: 6, POKI: 9, RAIN: 6, HOSICO: 9, SKR: 6
};

const TOKEN_FEE_PERCENT: Record<SupportedToken, number> = {
  SOL: 0.5, RADR: 0.3, USDC: 1, ORE: 0.3, BONK: 1, JIM: 1, GODL: 1,
  HUSTLE: 0.3, ZEC: 1, CRT: 1, BLACKCOIN: 1, GIL: 1, ANON: 1,
  WLFI: 1, USD1: 1, AOL: 1, IQLABS: 0.5, SANA: 1, POKI: 1, RAIN: 2, HOSICO: 1, SKR: 0.5
};

export class ShadowWireService {
  private client: ShadowWireClient;

  constructor(config?: ShadowWireConfig) {
    this.client = new ShadowWireClient({
      apiBaseUrl: config?.apiBaseUrl,
      debug: config?.debug ?? false,
    });
  }

  async getBalance(wallet: string, token: SupportedToken = 'SOL'): Promise<BalanceResult> {
    const balance = await this.client.getBalance(wallet, token) as { available?: number; pending?: number } | null;
    return {
      available: balance?.available ?? 0,
      pending: balance?.pending ?? 0,
      token,
    };
  }

  async deposit(wallet: string, amount: number, token: SupportedToken = 'SOL'): Promise<TransferResult> {
    try {
      const smallestUnit = this.toSmallestUnit(amount, token);
      const response = await this.client.deposit({ wallet, amount: smallestUnit }) as unknown as ShadowWireResponse;
      
      return {
        success: true,
        transactionId: response?.transactionId ?? response?.signature,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deposit failed',
      };
    }
  }

  async withdraw(wallet: string, amount: number, token: SupportedToken = 'SOL'): Promise<TransferResult> {
    try {
      const smallestUnit = this.toSmallestUnit(amount, token);
      const response = await this.client.withdraw({ wallet, amount: smallestUnit }) as unknown as ShadowWireResponse;
      
      return {
        success: true,
        transactionId: response?.transactionId ?? response?.signature,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Withdrawal failed',
      };
    }
  }

  async transfer(params: TransferParams): Promise<TransferResult> {
    try {
      const feeInfo = this.calculateFee(params.amount, params.token);
      
      const result = await this.client.transfer({
        sender: params.sender,
        recipient: params.recipient,
        amount: params.amount,
        token: params.token,
        type: params.type,
        wallet: params.wallet,
      }) as unknown as ShadowWireResponse;

      return {
        success: true,
        transactionId: result?.transactionId ?? result?.signature,
        fee: feeInfo.fee,
        netAmount: feeInfo.netAmount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  calculateFee(amount: number, token: SupportedToken): { fee: number; netAmount: number; feePercent: number } {
    const feePercent = TOKEN_FEE_PERCENT[token];
    const fee = amount * (feePercent / 100);
    return {
      fee,
      netAmount: amount - fee,
      feePercent,
    };
  }

  toSmallestUnit(amount: number, token: SupportedToken): number {
    const decimals = TOKEN_DECIMALS[token];
    return Math.floor(amount * Math.pow(10, decimals));
  }

  fromSmallestUnit(amount: number, token: SupportedToken): number {
    const decimals = TOKEN_DECIMALS[token];
    return amount / Math.pow(10, decimals);
  }

  getSupportedTokens(): SupportedToken[] {
    return Object.keys(TOKEN_DECIMALS) as SupportedToken[];
  }

  getTokenInfo(token: SupportedToken): { decimals: number; feePercent: number } {
    return {
      decimals: TOKEN_DECIMALS[token],
      feePercent: TOKEN_FEE_PERCENT[token],
    };
  }
}

export function createShadowWireService(config?: ShadowWireConfig): ShadowWireService {
  return new ShadowWireService(config);
}
