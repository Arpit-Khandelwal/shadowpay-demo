import axios, { AxiosInstance } from 'axios';

export type RiskLevel =
  | 'CRITICAL RISK (Directly malicious)'
  | 'Extremely high risk'
  | 'High risk'
  | 'Medium risk'
  | 'Low risk'
  | 'Very low risk';

export interface MaliciousEvidence {
  address: string;
  distance: number;
  name_tag: string | null;
  entity: string | null;
  category: string;
}

export interface Attribution {
  name_tag: string;
  entity: string;
  category: string;
  address_role: string;
}

export interface RiskScoreResponse {
  riskScore: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  riskLevel: RiskLevel;
  numHops: number;
  maliciousAddressesFound: MaliciousEvidence[];
  reasoning: string;
  attribution?: Attribution | null;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  isSanctioned: boolean;
  reasoning: string;
  rawResponse: RiskScoreResponse;
}

export interface RangeClientConfig {
  apiKey: string;
  baseUrl?: string;
  maxRiskThreshold?: number;
}

const DEFAULT_BASE_URL = 'https://api.range.org';
const DEFAULT_MAX_RISK_THRESHOLD = 5;
const SANCTION_CATEGORIES = ['ofac', 'sanctions', 'blacklist', 'hack_funds'];
const BATCH_CONCURRENCY = 5;

export class RangeClient {
  private client: AxiosInstance;
  private maxRiskThreshold: number;

  constructor(config: RangeClientConfig) {
    this.maxRiskThreshold = config.maxRiskThreshold ?? DEFAULT_MAX_RISK_THRESHOLD;
    
    this.client = axios.create({
      baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getAddressRiskScore(address: string): Promise<RiskScoreResponse> {
    const response = await this.client.get<RiskScoreResponse>('/v1/risk/address', {
      params: { address, network: 'solana' },
    });
    return response.data;
  }

  async checkSanctions(address: string): Promise<boolean> {
    const riskData = await this.getAddressRiskScore(address);
    
    const isSanctioned = riskData.maliciousAddressesFound.some(
      (m) => m.distance === 0 && SANCTION_CATEGORIES.some(cat => 
        m.category?.toLowerCase().includes(cat)
      )
    );
    
    return isSanctioned || riskData.riskScore === 10;
  }

  async checkCompliance(address: string): Promise<ComplianceCheckResult> {
    const riskData = await this.getAddressRiskScore(address);
    const isSanctioned = await this.checkSanctions(address);
    
    const isCompliant = 
      riskData.riskScore <= this.maxRiskThreshold && 
      !isSanctioned;

    return {
      isCompliant,
      riskScore: riskData.riskScore,
      riskLevel: riskData.riskLevel,
      isSanctioned,
      reasoning: riskData.reasoning,
      rawResponse: riskData,
    };
  }

  async batchCheckCompliance(addresses: string[]): Promise<Map<string, ComplianceCheckResult>> {
    const results = new Map<string, ComplianceCheckResult>();
    
    for (let i = 0; i < addresses.length; i += BATCH_CONCURRENCY) {
      const batch = addresses.slice(i, i + BATCH_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(addr => this.checkCompliance(addr))
      );
      
      batch.forEach((addr, idx) => {
        results.set(addr, batchResults[idx]);
      });
    }
    
    return results;
  }
}

export function createRangeClient(apiKey: string, options?: Partial<RangeClientConfig>): RangeClient {
  return new RangeClient({ apiKey, ...options });
}

export class MockRangeClient extends RangeClient {
  private mockResponses: Map<string, RiskScoreResponse> = new Map();

  constructor() {
    super({ apiKey: 'mock-key' });
  }

  setMockResponse(address: string, response: RiskScoreResponse): void {
    this.mockResponses.set(address, response);
  }

  override async getAddressRiskScore(address: string): Promise<RiskScoreResponse> {
    const mock = this.mockResponses.get(address);
    if (mock) return mock;

    return {
      riskScore: 1,
      riskLevel: 'Very low risk',
      numHops: 5,
      maliciousAddressesFound: [],
      reasoning: 'No suspicious paths found within 5 hops.',
    };
  }
}
