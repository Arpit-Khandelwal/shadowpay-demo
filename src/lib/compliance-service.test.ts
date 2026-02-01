import { describe, it, expect, beforeEach } from 'bun:test';
import { ComplianceService } from './compliance-service';

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    service = new ComplianceService({
      rangeApiKey: 'test-key',
      useMockRange: true,
      maxRiskThreshold: 5,
      defaultMinimumAge: 18,
      defaultMinBalanceUsd: 1000,
    });
  });

  describe('generateAttestation', () => {
    it('should generate attestation for compliant user', async () => {
      const result = await service.generateAttestation({
        walletAddress: 'TestWallet123',
        age: 25,
        walletBalanceUsd: 5000,
      });

      expect(result.isCompliant).toBe(true);
      expect(result.attestationId).toMatch(/^att_/);
      expect(result.proofs.age).toBeDefined();
      expect(result.proofs.risk).toBeDefined();
      expect(result.proofs.selectiveDisclosure).toBeDefined();
      expect(result.publicInputs.minimumAge).toBe(18);
    });

    it('should fail attestation for underage user', async () => {
      const result = await service.generateAttestation({
        walletAddress: 'TestWallet123',
        age: 16,
        walletBalanceUsd: 5000,
      });

      expect(result.isCompliant).toBe(false);
    });

    it('should use custom thresholds when provided', async () => {
      const result = await service.generateAttestation({
        walletAddress: 'TestWallet123',
        age: 21,
        minimumAge: 21,
        maxRiskScore: 3,
        minBalanceUsd: 10000,
        walletBalanceUsd: 50000,
      });

      expect(result.isCompliant).toBe(true);
      expect(result.publicInputs.minimumAge).toBe(21);
      expect(result.publicInputs.maxRiskScore).toBe(3);
      expect(result.publicInputs.minBalanceUsd).toBe(10000);
    });
  });

  describe('quickComplianceCheck', () => {
    it('should return compliance status', async () => {
      const result = await service.quickComplianceCheck('SafeWallet123');

      expect(result.isCompliant).toBe(true);
      expect(result.riskScore).toBe(1);
      expect(result.isSanctioned).toBe(false);
    });
  });

  describe('verifyAttestation', () => {
    it('should verify valid attestation', async () => {
      const attestation = await service.generateAttestation({
        walletAddress: 'TestWallet123',
        age: 25,
        walletBalanceUsd: 5000,
      });

      const isValid = await service.verifyAttestation(attestation);
      expect(isValid).toBe(true);
    });

    it('should reject attestation without proof', async () => {
      const invalidAttestation = {
        isCompliant: true,
        attestationId: 'fake',
        timestamp: Date.now(),
        proofs: {},
        complianceCheck: {} as never,
        publicInputs: { minimumAge: 18, maxRiskScore: 5, minBalanceUsd: 0 },
      };

      const isValid = await service.verifyAttestation(invalidAttestation);
      expect(isValid).toBe(false);
    });
  });

  describe('executePrivateTransfer', () => {
    it('should check recipient compliance before transfer', async () => {
      const result = await service.executePrivateTransfer({
        senderAddress: 'Sender123',
        recipientAddress: 'Recipient456',
        amount: 1.0,
        token: 'SOL',
      });

      expect(result.transferResult).toBeDefined();
    });

    it('should return error for invalid wallet addresses', async () => {
      const result = await service.executePrivateTransfer({
        senderAddress: 'InvalidAddress',
        recipientAddress: 'AlsoInvalid',
        amount: 0.5,
        token: 'USDC',
        requireCompliance: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
