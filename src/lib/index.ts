export { RangeClient, createRangeClient, MockRangeClient } from './range-client';
export type { 
  RiskLevel, 
  RiskScoreResponse, 
  ComplianceCheckResult, 
  RangeClientConfig,
  MaliciousEvidence,
  Attribution 
} from './range-client';

export { ShadowWireService, createShadowWireService } from './shadowwire-service';
export type { 
  TransferParams, 
  TransferResult, 
  BalanceResult, 
  SupportedToken,
  TransferType,
  ShadowWireConfig 
} from './shadowwire-service';

export { NoirProofService, createNoirProofService } from './noir-proof-service';
export type { 
  GeneratedProof, 
  VerificationResult, 
  AgeVerificationInput,
  RiskThresholdInput,
  SelectiveDisclosureInput,
  CircuitType,
  NoirServiceConfig 
} from './noir-proof-service';

export { ComplianceService, createComplianceService } from './compliance-service';
export type { 
  AttestationRequest, 
  AttestationResult, 
  PrivateTransferRequest,
  PrivateTransferResult,
  ComplianceServiceConfig 
} from './compliance-service';
