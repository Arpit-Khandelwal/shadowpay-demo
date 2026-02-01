import { NextRequest, NextResponse } from 'next/server';
import { createComplianceService, SupportedToken } from '@/lib';

interface TransferRequestBody {
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  token: SupportedToken;
  requireCompliance?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: TransferRequestBody = await request.json();

    const requiredFields = ['senderAddress', 'recipientAddress', 'amount', 'token'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400 }
      );
    }

    const rangeApiKey = process.env.RANGE_API_KEY;
    const useMock = !rangeApiKey || process.env.USE_MOCK_RANGE === 'true';

    const service = createComplianceService({
      rangeApiKey: rangeApiKey ?? 'mock',
      useMockRange: useMock,
      maxRiskThreshold: Number(process.env.MAX_RISK_THRESHOLD) || 5,
    });

    const result = await service.executePrivateTransfer({
      senderAddress: body.senderAddress,
      recipientAddress: body.recipientAddress,
      amount: body.amount,
      token: body.token,
      requireCompliance: body.requireCompliance ?? true,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          recipientCompliance: result.recipientCompliance,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transferResult: result.transferResult,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Private transfer failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
