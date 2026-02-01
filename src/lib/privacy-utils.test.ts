import { describe, it, expect } from 'bun:test';
import { 
  deriveKeypair, 
  deriveAddress, 
  splitAmount,
  splitAmountDeterministic,
  calculatePrivacyScore 
} from './privacy-utils';

describe('Privacy Utils', () => {
  describe('deriveKeypair', () => {
    const testSeed = new Uint8Array(32).fill(42);

    it('should derive a valid Solana keypair from seed and index', () => {
      const keypair = deriveKeypair(testSeed, 0);
      
      expect(keypair.publicKey).toBeDefined();
      expect(keypair.secretKey).toBeDefined();
      expect(keypair.secretKey.length).toBe(64);
    });

    it('should derive different keypairs for different indices', () => {
      const keypair0 = deriveKeypair(testSeed, 0);
      const keypair1 = deriveKeypair(testSeed, 1);
      const keypair2 = deriveKeypair(testSeed, 2);
      
      expect(keypair0.publicKey.toBase58()).not.toBe(keypair1.publicKey.toBase58());
      expect(keypair1.publicKey.toBase58()).not.toBe(keypair2.publicKey.toBase58());
      expect(keypair0.publicKey.toBase58()).not.toBe(keypair2.publicKey.toBase58());
    });

    it('should derive the same keypair for same seed and index', () => {
      const keypair1 = deriveKeypair(testSeed, 5);
      const keypair2 = deriveKeypair(testSeed, 5);
      
      expect(keypair1.publicKey.toBase58()).toBe(keypair2.publicKey.toBase58());
    });

    it('should derive different keypairs for different seeds', () => {
      const seed1 = new Uint8Array(32).fill(1);
      const seed2 = new Uint8Array(32).fill(2);
      
      const keypair1 = deriveKeypair(seed1, 0);
      const keypair2 = deriveKeypair(seed2, 0);
      
      expect(keypair1.publicKey.toBase58()).not.toBe(keypair2.publicKey.toBase58());
    });

    it('should produce valid Base58 public key addresses', () => {
      const keypair = deriveKeypair(testSeed, 0);
      const address = keypair.publicKey.toBase58();
      
      expect(address.length).toBeGreaterThanOrEqual(32);
      expect(address.length).toBeLessThanOrEqual(44);
      expect(/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)).toBe(true);
    });
  });

  describe('deriveAddress', () => {
    const testSeed = new Uint8Array(32).fill(123);

    it('should return a Base58 string', () => {
      const address = deriveAddress(testSeed, 0);
      
      expect(typeof address).toBe('string');
      expect(address.length).toBeGreaterThanOrEqual(32);
    });

    it('should match the public key from deriveKeypair', () => {
      const address = deriveAddress(testSeed, 7);
      const keypair = deriveKeypair(testSeed, 7);
      
      expect(address).toBe(keypair.publicKey.toBase58());
    });
  });

  describe('splitAmountDeterministic', () => {
    it('should return single amount for values less than 0.1', () => {
      const splits = splitAmountDeterministic(0.05, 5);
      
      expect(splits).toEqual([0.05]);
    });

    it('should split into the requested number of parts', () => {
      const splits = splitAmountDeterministic(5.0, 5);
      
      expect(splits.length).toBe(5);
    });

    it('should preserve total amount (sum equals input)', () => {
      const total = 10.0;
      const splits = splitAmountDeterministic(total, 7);
      
      const sum = splits.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - total)).toBeLessThan(0.0001);
    });

    it('should produce non-round numbers (privacy feature)', () => {
      const splits = splitAmountDeterministic(5.0, 5);
      
      const hasNonRoundNumbers = splits.some(s => {
        const decimalPart = s - Math.floor(s);
        return decimalPart !== 0 && decimalPart !== 0.5;
      });
      
      expect(hasNonRoundNumbers).toBe(true);
    });

    it('should produce deterministic output with same seed', () => {
      const splits1 = splitAmountDeterministic(5.0, 4, 999);
      const splits2 = splitAmountDeterministic(5.0, 4, 999);
      
      expect(splits1).toEqual(splits2);
    });

    it('should produce different output with different seed', () => {
      const splits1 = splitAmountDeterministic(5.0, 4, 111);
      const splits2 = splitAmountDeterministic(5.0, 4, 222);
      
      expect(splits1).not.toEqual(splits2);
    });

    it('should produce all positive values', () => {
      const splits = splitAmountDeterministic(5.0, 7);
      
      splits.forEach(s => {
        expect(s).toBeGreaterThan(0);
      });
    });
  });

  describe('splitAmount', () => {
    it('should use fewer splits for small amounts (< 0.5 SOL)', () => {
      for (let i = 0; i < 10; i++) {
        const splits = splitAmount(0.3);
        expect(splits.length).toBeGreaterThanOrEqual(2);
        expect(splits.length).toBeLessThanOrEqual(3);
      }
    });

    it('should use moderate splits for medium amounts (0.5-2 SOL)', () => {
      for (let i = 0; i < 10; i++) {
        const splits = splitAmount(1.5);
        expect(splits.length).toBeGreaterThanOrEqual(3);
        expect(splits.length).toBeLessThanOrEqual(4);
      }
    });

    it('should use more splits for larger amounts (> 10 SOL)', () => {
      for (let i = 0; i < 10; i++) {
        const splits = splitAmount(15);
        expect(splits.length).toBeGreaterThanOrEqual(4);
        expect(splits.length).toBeLessThanOrEqual(7);
      }
    });

    it('should respect explicit min/max parameters', () => {
      const splits = splitAmount(5.0, 2, 2);
      expect(splits.length).toBe(2);
    });

    it('should preserve total amount', () => {
      const total = 7.5;
      const splits = splitAmount(total);
      const sum = splits.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - total)).toBeLessThan(0.0001);
    });
  });

  describe('calculatePrivacyScore', () => {
    it('should return low score for minimal config', () => {
      const score = calculatePrivacyScore({
        splitCount: 1,
        uniqueAddresses: 0,
        minAgingHours: 0,
        poolSize: 0,
      });
      
      expect(score).toBeLessThan(50);
    });

    it('should return 100 for optimal config', () => {
      const score = calculatePrivacyScore({
        splitCount: 5,
        uniqueAddresses: 5,
        minAgingHours: 48,
        poolSize: 1000,
      });
      
      expect(score).toBe(100);
    });

    it('should increase with more splits', () => {
      const score1 = calculatePrivacyScore({
        splitCount: 1,
        uniqueAddresses: 1,
        minAgingHours: 24,
        poolSize: 500,
      });
      
      const score2 = calculatePrivacyScore({
        splitCount: 5,
        uniqueAddresses: 5,
        minAgingHours: 24,
        poolSize: 500,
      });
      
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase with longer aging time', () => {
      const score1 = calculatePrivacyScore({
        splitCount: 3,
        uniqueAddresses: 3,
        minAgingHours: 12,
        poolSize: 500,
      });
      
      const score2 = calculatePrivacyScore({
        splitCount: 3,
        uniqueAddresses: 3,
        minAgingHours: 48,
        poolSize: 500,
      });
      
      expect(score2).toBeGreaterThan(score1);
    });

    it('should cap at 100 even with extreme values', () => {
      const score = calculatePrivacyScore({
        splitCount: 100,
        uniqueAddresses: 100,
        minAgingHours: 1000,
        poolSize: 100000,
      });
      
      expect(score).toBe(100);
    });

    it('should return integer values', () => {
      const score = calculatePrivacyScore({
        splitCount: 3,
        uniqueAddresses: 2,
        minAgingHours: 18,
        poolSize: 300,
      });
      
      expect(Number.isInteger(score)).toBe(true);
    });
  });
});
