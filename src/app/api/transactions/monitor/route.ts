import { NextRequest, NextResponse } from 'next/server';
import { transactionMonitor } from '@/lib/transactions/monitor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, txHash, chainId } = body;

    if (!paymentIntentId || !txHash || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, txHash, chainId' },
        { status: 400 }
      );
    }

    // Start monitoring the transaction
    await transactionMonitor.startMonitoring(paymentIntentId, txHash, chainId);

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction monitoring started' 
    });
  } catch (error) {
    console.error('Error starting transaction monitoring:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
