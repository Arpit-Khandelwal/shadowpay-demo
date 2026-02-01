import { describe, it, expect } from 'bun:test';
import { ShadowWireService } from './shadowwire-service';

describe('ShadowWireService', () => {
  const service = new ShadowWireService({ debug: false });

  describe('calculateFee', () => {
    it('should calculate SOL fee at 0.5%', () => {
      const result = service.calculateFee(1.0, 'SOL');
      
      expect(result.feePercent).toBe(0.5);
      expect(result.fee).toBe(0.005);
      expect(result.netAmount).toBe(0.995);
    });

    it('should calculate USDC fee at 1%', () => {
      const result = service.calculateFee(100, 'USDC');
      
      expect(result.feePercent).toBe(1);
      expect(result.fee).toBe(1);
      expect(result.netAmount).toBe(99);
    });

    it('should calculate RAIN fee at 2%', () => {
      const result = service.calculateFee(50, 'RAIN');
      
      expect(result.feePercent).toBe(2);
      expect(result.fee).toBe(1);
      expect(result.netAmount).toBe(49);
    });
  });

  describe('toSmallestUnit', () => {
    it('should convert SOL with 9 decimals', () => {
      const result = service.toSmallestUnit(1.5, 'SOL');
      expect(result).toBe(1_500_000_000);
    });

    it('should convert USDC with 6 decimals', () => {
      const result = service.toSmallestUnit(100, 'USDC');
      expect(result).toBe(100_000_000);
    });

    it('should convert BONK with 5 decimals', () => {
      const result = service.toSmallestUnit(1000, 'BONK');
      expect(result).toBe(100_000_000);
    });
  });

  describe('fromSmallestUnit', () => {
    it('should convert lamports to SOL', () => {
      const result = service.fromSmallestUnit(1_500_000_000, 'SOL');
      expect(result).toBe(1.5);
    });

    it('should convert USDC smallest unit', () => {
      const result = service.fromSmallestUnit(100_000_000, 'USDC');
      expect(result).toBe(100);
    });
  });

  describe('getSupportedTokens', () => {
    it('should return all 22 supported tokens', () => {
      const tokens = service.getSupportedTokens();
      
      expect(tokens.length).toBe(22);
      expect(tokens).toContain('SOL');
      expect(tokens).toContain('USDC');
      expect(tokens).toContain('RADR');
    });
  });

  describe('getTokenInfo', () => {
    it('should return token decimals and fee', () => {
      const info = service.getTokenInfo('SOL');
      
      expect(info.decimals).toBe(9);
      expect(info.feePercent).toBe(0.5);
    });
  });
});
