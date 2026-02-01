import { RangeClient, ComplianceCheckResult, createRangeClient, MockRangeClient } from './range-client';
import { NoirProofService, GeneratedProof, createNoirProofService } from './noir-proof-service';
import { ShadowWireService, TransferResult, createShadowWireService, SupportedToken } from './shadowwire-service';

export interface AttestationRequest {
  walletAddress: string;
  age: number;
  minimumAge?: number;
  maxRiskScore?: number;
  minBalanceUsd?: number;
  walletBalanceUsd?: number;
}

export interface AttestationResult {
  isCompliant: boolean;
  attestationId: string;
  timestamp: number;
  proofs: {
    age?: GeneratedProof;
    risk?: GeneratedProof;
    selectiveDisclosure?: GeneratedProof;
  };
  complianceCheck: ComplianceCheckResult;
  publicInputs: {
    minimumAge: number;
    maxRiskScore: number;
    minBalanceUsd: number;
  };
}

export interface PrivateTransferRequest {
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  token: SupportedToken;
  requireCompliance?: boolean;
  wallet?: { signMessage: (message: Uint8Array) => Promise<Uint8Array> };
}

export interface PrivateTransferResult {
  success: boolean;
  transferResult?: TransferResult;
  senderAttestation?: AttestationResult;
  recipientCompliance?: ComplianceCheckResult;
  error?: string;
}

export interface ComplianceServiceConfig {
  rangeApiKey: string;
  maxRiskThreshold?: number;
  defaultMinimumAge?: number;
  defaultMinBalanceUsd?: number;
  useMockRange?: boolean;
}

const DEFAULT_MINIMUM_AGE = 18;
const DEFAULT_MAX_RISK = 5;
const DEFAULT_MIN_BALANCE = 0;

export class ComplianceService {
  private rangeClient: RangeClient;
  private noirService: NoirProofService;
  private shadowWireService: ShadowWireService;
  private config: ComplianceServiceConfig;

  constructor(config: ComplianceServiceConfig) {
    this.config = config;
    
    this.rangeClient = config.useMockRange 
      ? new MockRangeClient()
      : createRangeClient(config.rangeApiKey, { maxRiskThreshold: config.maxRiskThreshold });
    
    this.noirService = createNoirProofService();
    this.shadowWireService = createShadowWireService();
  }

  async generateAttestation(request: AttestationRequest): Promise<AttestationResult> {
    const minimumAge = request.minimumAge ?? this.config.defaultMinimumAge ?? DEFAULT_MINIMUM_AGE;
    const maxRiskScore = request.maxRiskScore ?? this.config.maxRiskThreshold ?? DEFAULT_MAX_RISK;
    const minBalanceUsd = request.minBalanceUsd ?? this.config.defaultMinBalanceUsd ?? DEFAULT_MIN_BALANCE;
    const walletBalanceUsd = request.walletBalanceUsd ?? 0;

    const complianceCheck = await this.rangeClient.checkCompliance(request.walletAddress);

    let ageProof: GeneratedProof | undefined;
    let riskProof: GeneratedProof | undefined;
    let selectiveDisclosureProof: GeneratedProof | undefined;
    let isCompliant = false;

    try {
      ageProof = await this.noirService.generateAgeProof({
        age: request.age,
        minimumAge,
      });

      riskProof = await this.noirService.generateRiskProof({
        riskScore: complianceCheck.riskScore,
        maxAllowedRisk: maxRiskScore,
      });

      selectiveDisclosureProof = await this.noirService.generateSelectiveDisclosureProof({
        age: request.age,
        riskScore: complianceCheck.riskScore,
        isSanctioned: complianceCheck.isSanctioned,
        walletBalanceUsd,
        minimumAge,
        maxRiskScore,
        minBalanceUsd,
      });

      isCompliant = true;
    } catch {
      isCompliant = false;
    }

    return {
      isCompliant,
      attestationId: this.generateAttestationId(),
      timestamp: Date.now(),
      proofs: {
        age: ageProof,
        risk: riskProof,
        selectiveDisclosure: selectiveDisclosureProof,
      },
      complianceCheck,
      publicInputs: {
        minimumAge,
        maxRiskScore,
        minBalanceUsd,
      },
    };
  }

  async executePrivateTransfer(request: PrivateTransferRequest): Promise<PrivateTransferResult> {
    if (request.requireCompliance !== false) {
      const recipientCompliance = await this.rangeClient.checkCompliance(request.recipientAddress);
      
      if (!recipientCompliance.isCompliant) {
        return {
          success: false,
          recipientCompliance,
          error: `Recipient failed compliance: ${recipientCompliance.reasoning}`,
        };
      }
    }

    const transferResult = await this.shadowWireService.transfer({
      sender: request.senderAddress,
      recipient: request.recipientAddress,
      amount: request.amount,
      token: request.token,
      type: 'internal',
      wallet: request.wallet,
    });

    return {
      success: transferResult.success,
      transferResult,
      error: transferResult.error,
    };
  }

  async verifyAttestation(attestation: AttestationResult): Promise<boolean> {
    if (!attestation.proofs.selectiveDisclosure) {
      return false;
    }

    const result = await this.noirService.verifyProof(
      'selective_disclosure',
      attestation.proofs.selectiveDisclosure
    );

    return result.isValid;
  }

  async quickComplianceCheck(address: string): Promise<{
    isCompliant: boolean;
    riskScore: number;
    isSanctioned: boolean;
  }> {
    const result = await this.rangeClient.checkCompliance(address);
    return {
      isCompliant: result.isCompliant,
      riskScore: result.riskScore,
      isSanctioned: result.isSanctioned,
    };
  }

  private generateAttestationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `att_${timestamp}_${random}`;
  }
}

export function createComplianceService(config: ComplianceServiceConfig): ComplianceService {
  return new ComplianceService(config);
}
