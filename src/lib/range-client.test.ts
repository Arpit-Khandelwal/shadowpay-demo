import { describe, it, expect, beforeEach } from 'bun:test';
import { MockRangeClient, RiskScoreResponse } from './range-client';

describe('RangeClient', () => {
  let client: MockRangeClient;

  beforeEach(() => {
    client = new MockRangeClient();
  });

  describe('getAddressRiskScore', () => {
    it('should return low risk for unknown addresses', async () => {
      const result = await client.getAddressRiskScore('SomeRandomAddress123');
      
      expect(result.riskScore).toBe(1);
      expect(result.riskLevel).toBe('Very low risk');
    });

    it('should return mocked response for known addresses', async () => {
      const mockResponse: RiskScoreResponse = {
        riskScore: 10,
        riskLevel: 'CRITICAL RISK (Directly malicious)',
        numHops: 0,
        maliciousAddressesFound: [{
          address: 'MaliciousAddress123',
          distance: 0,
          name_tag: 'Known Scammer',
          entity: null,
          category: 'scam',
        }],
        reasoning: 'Address is directly flagged for malicious activity.',
      };

      client.setMockResponse('MaliciousAddress123', mockResponse);
      const result = await client.getAddressRiskScore('MaliciousAddress123');
      
      expect(result.riskScore).toBe(10);
      expect(result.riskLevel).toBe('CRITICAL RISK (Directly malicious)');
    });
  });

  describe('checkCompliance', () => {
    it('should mark low-risk address as compliant', async () => {
      const result = await client.checkCompliance('SafeAddress123');
      
      expect(result.isCompliant).toBe(true);
      expect(result.isSanctioned).toBe(false);
    });

    it('should mark high-risk address as non-compliant', async () => {
      client.setMockResponse('HighRiskAddress', {
        riskScore: 8,
        riskLevel: 'Extremely high risk',
        numHops: 1,
        maliciousAddressesFound: [{
          address: 'ConnectedMalicious',
          distance: 1,
          name_tag: 'Mixer',
          entity: null,
          category: 'mixer',
        }],
        reasoning: '1 hop from malicious address.',
      });

      const result = await client.checkCompliance('HighRiskAddress');
      
      expect(result.isCompliant).toBe(false);
      expect(result.riskScore).toBe(8);
    });

    it('should detect sanctioned addresses', async () => {
      client.setMockResponse('SanctionedAddress', {
        riskScore: 10,
        riskLevel: 'CRITICAL RISK (Directly malicious)',
        numHops: 0,
        maliciousAddressesFound: [{
          address: 'SanctionedAddress',
          distance: 0,
          name_tag: 'OFAC Sanctioned',
          entity: 'Known Criminal Org',
          category: 'ofac_sanctions',
        }],
        reasoning: 'Address is directly flagged for sanctions.',
      });

      const result = await client.checkCompliance('SanctionedAddress');
      
      expect(result.isCompliant).toBe(false);
      expect(result.isSanctioned).toBe(true);
    });
  });

  describe('batchCheckCompliance', () => {
    it('should check multiple addresses', async () => {
      const addresses = ['Addr1', 'Addr2', 'Addr3'];
      const results = await client.batchCheckCompliance(addresses);
      
      expect(results.size).toBe(3);
      expect(results.get('Addr1')?.isCompliant).toBe(true);
    });
  });
});
