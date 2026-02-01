import { describe, it, expect, beforeEach } from 'bun:test';
import { NoirProofService } from './noir-proof-service';

describe('NoirProofService', () => {
  let service: NoirProofService;

  beforeEach(() => {
    service = new NoirProofService();
  });

  describe('generateAgeProof', () => {
    it('should generate proof for valid adult age', async () => {
      const proof = await service.generateAgeProof({
        age: 25,
        minimumAge: 18,
      });
      
      expect(proof.proof.length).toBeGreaterThan(0);
      expect(proof.publicInputs).toEqual(['18']);
    });

    it('should generate proof for exactly minimum age', async () => {
      const proof = await service.generateAgeProof({
        age: 18,
        minimumAge: 18,
      });
      
      expect(proof.proof.length).toBeGreaterThan(0);
    });

    it('should throw for underage', () => {
      expect(async () => {
        await service.generateAgeProof({ age: 16, minimumAge: 18 });
      }).toThrow('Age verification will fail: age is below minimum');
    });

    it('should throw for invalid age values', () => {
      expect(async () => {
        await service.generateAgeProof({ age: -1, minimumAge: 18 });
      }).toThrow('Invalid age');
    });
  });

  describe('generateRiskProof', () => {
    it('should generate proof for low risk', async () => {
      const proof = await service.generateRiskProof({
        riskScore: 2,
        maxAllowedRisk: 5,
      });
      
      expect(proof.proof.length).toBeGreaterThan(0);
      expect(proof.publicInputs).toEqual(['5']);
    });

    it('should generate proof for risk at threshold', async () => {
      const proof = await service.generateRiskProof({
        riskScore: 5,
        maxAllowedRisk: 5,
      });
      
      expect(proof.proof.length).toBeGreaterThan(0);
    });

    it('should throw for high risk exceeding threshold', () => {
      expect(async () => {
        await service.generateRiskProof({ riskScore: 8, maxAllowedRisk: 5 });
      }).toThrow('Risk verification will fail: risk exceeds threshold');
    });

    it('should throw for invalid risk scores', () => {
      expect(async () => {
        await service.generateRiskProof({ riskScore: 0, maxAllowedRisk: 5 });
      }).toThrow('Invalid risk score');
    });
  });

  describe('generateSelectiveDisclosureProof', () => {
    it('should generate proof for compliant user', async () => {
      const proof = await service.generateSelectiveDisclosureProof({
        age: 30,
        riskScore: 2,
        isSanctioned: false,
        walletBalanceUsd: 10000,
        minimumAge: 18,
        maxRiskScore: 5,
        minBalanceUsd: 1000,
      });
      
      expect(proof.proof.length).toBeGreaterThan(0);
      expect(proof.publicInputs).toEqual(['18', '5', '1000']);
    });

    it('should throw for sanctioned address', () => {
      expect(async () => {
        await service.generateSelectiveDisclosureProof({
          age: 30,
          riskScore: 2,
          isSanctioned: true,
          walletBalanceUsd: 10000,
          minimumAge: 18,
          maxRiskScore: 5,
          minBalanceUsd: 1000,
        });
      }).toThrow('address is sanctioned');
    });

    it('should throw for insufficient balance', () => {
      expect(async () => {
        await service.generateSelectiveDisclosureProof({
          age: 30,
          riskScore: 2,
          isSanctioned: false,
          walletBalanceUsd: 500,
          minimumAge: 18,
          maxRiskScore: 5,
          minBalanceUsd: 1000,
        });
      }).toThrow('balance below minimum');
    });
  });

  describe('verifyProof', () => {
    it('should verify valid proof', async () => {
      const proof = await service.generateAgeProof({
        age: 25,
        minimumAge: 18,
      });
      
      const result = await service.verifyProof('age_verification', proof);
      expect(result.isValid).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize proof', async () => {
      const original = await service.generateAgeProof({
        age: 25,
        minimumAge: 18,
      });
      
      const serialized = service.serializeProof(original);
      const deserialized = service.deserializeProof(serialized);
      
      expect(deserialized.publicInputs).toEqual(original.publicInputs);
      expect(deserialized.proof.length).toBe(original.proof.length);
    });
  });
});
