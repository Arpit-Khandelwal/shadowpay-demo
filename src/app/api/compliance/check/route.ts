import { NextRequest, NextResponse } from 'next/server';
import { createComplianceService } from '@/lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: address' },
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

    const result = await service.quickComplianceCheck(address);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Compliance check failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
