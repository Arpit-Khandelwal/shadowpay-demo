import { NextRequest, NextResponse } from 'next/server';
import { createNoirProofService, CircuitType } from '@/lib';

interface VerifyRequestBody {
  circuitType: CircuitType;
  proof: number[];
  publicInputs: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequestBody = await request.json();

    if (!body.circuitType || !body.proof || !body.publicInputs) {
      return NextResponse.json(
        { error: 'Missing required fields: circuitType, proof, publicInputs' },
        { status: 400 }
      );
    }

    const validCircuits: CircuitType[] = ['age_verification', 'risk_threshold', 'selective_disclosure'];
    if (!validCircuits.includes(body.circuitType)) {
      return NextResponse.json(
        { error: `Invalid circuit type. Must be one of: ${validCircuits.join(', ')}` },
        { status: 400 }
      );
    }

    const service = createNoirProofService();
    
    const proof = {
      proof: new Uint8Array(body.proof),
      publicInputs: body.publicInputs,
      isRealProof: false,
    };

    const result = await service.verifyProof(body.circuitType, proof);

    return NextResponse.json({
      success: true,
      data: {
        isValid: result.isValid,
        circuitType: body.circuitType,
        error: result.error,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Proof verification failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
