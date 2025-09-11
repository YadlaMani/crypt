import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Button from '@/lib/models/Button';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const button = await Button.findOne({ id: params.id, isActive: true });

    if (!button) {
      return NextResponse.json(
        { error: 'Button not found or inactive' },
        { status: 404 }
      );
    }

    // Return only public configuration (no sensitive data)
    return NextResponse.json({
      id: button.id,
      name: button.name,
      description: button.description,
      amount: button.amount,
      tokenAddress: button.tokenAddress,
      chainId: button.chainId,
      merchantAddress: button.merchantAddress,
    });
  } catch (error) {
    console.error('Error fetching button:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
