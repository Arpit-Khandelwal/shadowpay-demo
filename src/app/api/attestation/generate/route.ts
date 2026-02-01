import { NextRequest, NextResponse } from 'next/server';
import { createComplianceService, AttestationRequest } from '@/lib';

export async function POST(request: NextRequest) {
  try {
    const body: AttestationRequest = await request.json();

    if (!body.walletAddress || typeof body.walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: walletAddress' },
        { status: 400 }
      );
    }

    if (typeof body.age !== 'number' || body.age < 0) {
      return NextResponse.json(
        { error: 'Invalid or missing field: age' },
        { status: 400 }
      );
    }

    const rangeApiKey = process.env.RANGE_API_KEY;
    const useMock = !rangeApiKey || process.env.USE_MOCK_RANGE === 'true';

    const service = createComplianceService({
      rangeApiKey: rangeApiKey ?? 'mock',
      useMockRange: useMock,
      maxRiskThreshold: Number(process.env.MAX_RISK_THRESHOLD) || 5,
      defaultMinimumAge: Number(process.env.DEFAULT_MINIMUM_AGE) || 18,
      defaultMinBalanceUsd: Number(process.env.DEFAULT_MIN_BALANCE) || 0,
    });

    const attestation = await service.generateAttestation(body);

    const serializedProofs = {
      age: attestation.proofs.age ? Array.from(attestation.proofs.age.proof) : null,
      risk: attestation.proofs.risk ? Array.from(attestation.proofs.risk.proof) : null,
      selectiveDisclosure: attestation.proofs.selectiveDisclosure 
        ? Array.from(attestation.proofs.selectiveDisclosure.proof) 
        : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        isCompliant: attestation.isCompliant,
        attestationId: attestation.attestationId,
        timestamp: attestation.timestamp,
        publicInputs: attestation.publicInputs,
        proofs: serializedProofs,
        complianceCheck: {
          riskScore: attestation.complianceCheck.riskScore,
          riskLevel: attestation.complianceCheck.riskLevel,
          isSanctioned: attestation.complianceCheck.isSanctioned,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Attestation generation failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
