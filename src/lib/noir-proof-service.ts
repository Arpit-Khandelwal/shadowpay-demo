export interface ProofInput {
  [key: string]: string | number | boolean;
}

export interface GeneratedProof {
  proof: Uint8Array;
  publicInputs: string[];
  isRealProof: boolean;
}

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export interface AgeVerificationInput {
  age: number;
  minimumAge: number;
}

export interface RiskThresholdInput {
  riskScore: number;
  maxAllowedRisk: number;
}

export interface SelectiveDisclosureInput {
  age: number;
  riskScore: number;
  isSanctioned: boolean;
  walletBalanceUsd: number;
  minimumAge: number;
  maxRiskScore: number;
  minBalanceUsd: number;
}

export type CircuitType = 'age_verification' | 'risk_threshold' | 'selective_disclosure';

export interface NoirServiceConfig {
  circuitsPath?: string;
  useRealProofs?: boolean;
}

interface CircuitArtifact {
  bytecode: string;
  abi: {
    parameters: Array<{
      name: string;
      type: { kind: string; sign?: string; width?: number };
      visibility: string;
    }>;
  };
}

let noirInitialized = false;
let Noir: any = null;
let UltraHonkBackend: any = null;

async function initNoirLibs(): Promise<boolean> {
  if (noirInitialized) return true;
  
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const noirModule = await import('@noir-lang/noir_js');
    const bbModule = await import('@aztec/bb.js');
    
    Noir = noirModule.Noir;
    UltraHonkBackend = bbModule.UltraHonkBackend;
    
    noirInitialized = true;
    return true;
  } catch (error) {
    console.warn('Failed to initialize Noir libraries, using mock proofs:', error);
    return false;
  }
}

export class NoirProofService {
  private circuitsPath: string;
  private useRealProofs: boolean;
  private circuitCache: Map<CircuitType, CircuitArtifact> = new Map();
  private backendCache: Map<CircuitType, any> = new Map();

  constructor(config?: NoirServiceConfig) {
    this.circuitsPath = config?.circuitsPath ?? '/circuits';
    this.useRealProofs = config?.useRealProofs ?? true;
  }

  async initialize(): Promise<void> {
    if (this.useRealProofs) {
      await initNoirLibs();
    }
  }

  private async loadCircuit(circuitType: CircuitType): Promise<CircuitArtifact | null> {
    if (this.circuitCache.has(circuitType)) {
      return this.circuitCache.get(circuitType)!;
    }

    try {
      const response = await fetch(`${this.circuitsPath}/${circuitType}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load circuit: ${response.statusText}`);
      }
      const circuit = await response.json();
      this.circuitCache.set(circuitType, circuit);
      return circuit;
    } catch (error) {
      console.warn(`Failed to load circuit ${circuitType}:`, error);
      return null;
    }
  }

  async generateAgeProof(input: AgeVerificationInput): Promise<GeneratedProof> {
    this.validateAgeInput(input);
    
    const witness = {
      age: input.age,
      minimum_age: input.minimumAge,
    };

    return this.generateProof('age_verification', witness);
  }

  async generateRiskProof(input: RiskThresholdInput): Promise<GeneratedProof> {
    this.validateRiskInput(input);
    
    const witness = {
      risk_score: input.riskScore,
      max_allowed_risk: input.maxAllowedRisk,
    };

    return this.generateProof('risk_threshold', witness);
  }

  async generateSelectiveDisclosureProof(input: SelectiveDisclosureInput): Promise<GeneratedProof> {
    this.validateSelectiveDisclosureInput(input);
    
    const witness = {
      age: input.age,
      risk_score: input.riskScore,
      is_sanctioned: input.isSanctioned,
      wallet_balance_usd: input.walletBalanceUsd,
      minimum_age: input.minimumAge,
      max_risk_score: input.maxRiskScore,
      min_balance_usd: input.minBalanceUsd,
    };

    return this.generateProof('selective_disclosure', witness);
  }

  async verifyProof(circuitType: CircuitType, proof: GeneratedProof): Promise<VerificationResult> {
    if (!proof.isRealProof) {
      const isValid = proof.proof.length > 0;
      return { isValid };
    }

    try {
      const circuit = await this.loadCircuit(circuitType);
      if (!circuit || !UltraHonkBackend) {
        return { isValid: proof.proof.length > 0 };
      }

      let backend = this.backendCache.get(circuitType);
      if (!backend) {
        backend = new UltraHonkBackend(circuit.bytecode);
        this.backendCache.set(circuitType, backend);
      }

      const isValid = await backend.verifyProof({ proof: proof.proof, publicInputs: proof.publicInputs });
      return { isValid };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  private async generateProof(circuitType: CircuitType, witness: ProofInput): Promise<GeneratedProof> {
    if (this.useRealProofs && noirInitialized) {
      try {
        return await this.generateRealProof(circuitType, witness);
      } catch (error) {
        console.warn(`Real proof generation failed for ${circuitType}, using mock:`, error);
      }
    }
    
    return this.createMockProof(circuitType, witness);
  }

  private async generateRealProof(circuitType: CircuitType, witness: ProofInput): Promise<GeneratedProof> {
    const circuit = await this.loadCircuit(circuitType);
    if (!circuit) {
      throw new Error(`Circuit ${circuitType} not available`);
    }

    const noir = new Noir(circuit);
    const { witness: solvedWitness } = await noir.execute(witness);

    let backend = this.backendCache.get(circuitType);
    if (!backend) {
      backend = new UltraHonkBackend(circuit.bytecode);
      this.backendCache.set(circuitType, backend);
    }

    const proof = await backend.generateProof(solvedWitness);

    return {
      proof: proof.proof,
      publicInputs: proof.publicInputs || this.extractPublicInputs(circuitType, witness),
      isRealProof: true,
    };
  }

  private createMockProof(circuitType: CircuitType, witness: ProofInput): GeneratedProof {
    const encoder = new TextEncoder();
    const proofData = {
      circuitType,
      witness,
      timestamp: Date.now(),
      mockProof: true,
      hash: this.simpleHash(JSON.stringify(witness)),
    };
    
    return {
      proof: encoder.encode(JSON.stringify(proofData)),
      publicInputs: this.extractPublicInputs(circuitType, witness),
      isRealProof: false,
    };
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private extractPublicInputs(circuitType: CircuitType, witness: ProofInput): string[] {
    switch (circuitType) {
      case 'age_verification':
        return [String(witness.minimum_age)];
      case 'risk_threshold':
        return [String(witness.max_allowed_risk)];
      case 'selective_disclosure':
        return [
          String(witness.minimum_age),
          String(witness.max_risk_score),
          String(witness.min_balance_usd),
        ];
      default:
        return [];
    }
  }

  private validateAgeInput(input: AgeVerificationInput): void {
    if (input.age < 0 || input.age > 255) {
      throw new Error('Invalid age: must be between 0 and 255 (u8)');
    }
    if (input.minimumAge < 0 || input.minimumAge > 255) {
      throw new Error('Invalid minimum age: must be between 0 and 255 (u8)');
    }
    if (input.age < input.minimumAge) {
      throw new Error('Age verification will fail: age is below minimum');
    }
  }

  private validateRiskInput(input: RiskThresholdInput): void {
    if (input.riskScore < 1 || input.riskScore > 10) {
      throw new Error('Invalid risk score: must be between 1 and 10');
    }
    if (input.maxAllowedRisk < 1 || input.maxAllowedRisk > 10) {
      throw new Error('Invalid max risk: must be between 1 and 10');
    }
    if (input.riskScore > input.maxAllowedRisk) {
      throw new Error('Risk verification will fail: risk exceeds threshold');
    }
  }

  private validateSelectiveDisclosureInput(input: SelectiveDisclosureInput): void {
    this.validateAgeInput({ age: input.age, minimumAge: input.minimumAge });
    this.validateRiskInput({ riskScore: input.riskScore, maxAllowedRisk: input.maxRiskScore });
    
    if (input.isSanctioned) {
      throw new Error('Selective disclosure will fail: address is sanctioned');
    }
    if (input.walletBalanceUsd < input.minBalanceUsd) {
      throw new Error('Selective disclosure will fail: balance below minimum');
    }
  }

  serializeProof(proof: GeneratedProof): string {
    return JSON.stringify({
      proof: Array.from(proof.proof),
      publicInputs: proof.publicInputs,
      isRealProof: proof.isRealProof,
    });
  }

  deserializeProof(serialized: string): GeneratedProof {
    const parsed = JSON.parse(serialized);
    return {
      proof: new Uint8Array(parsed.proof),
      publicInputs: parsed.publicInputs,
      isRealProof: parsed.isRealProof ?? false,
    };
  }
}

export function createNoirProofService(config?: NoirServiceConfig): NoirProofService {
  return new NoirProofService(config);
}
