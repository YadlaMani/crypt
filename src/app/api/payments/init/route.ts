import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Button from '@/lib/models/Button';
import PaymentIntent from '@/lib/models/PaymentIntent';
import crypto from 'crypto';
import { parseEther } from 'viem';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buttonId, customerAddress } = body;

    if (!buttonId) {
      return NextResponse.json(
        { error: 'Button ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get button configuration
    const button = await Button.findOne({ id: buttonId, isActive: true });

    if (!button) {
      return NextResponse.json(
        { error: 'Button not found or inactive' },
        { status: 404 }
      );
    }

    // Create payment intent
    const paymentIntentId = crypto.randomUUID();
    const paymentIntent = new PaymentIntent({
      id: paymentIntentId,
      buttonId: button.id,
      amount: button.amount,
      tokenAddress: button.tokenAddress,
      chainId: button.chainId,
      merchantAddress: button.merchantAddress,
      customerAddress,
      status: 'pending',
    });

    await paymentIntent.save();

    // Prepare transaction data
    const transactionData = {
      to: button.merchantAddress,
      value: button.tokenAddress ? '0' : button.amount, // 0 for ERC-20, amount for ETH
      data: button.tokenAddress ? 
        `0xa9059cbb000000000000000000000000${button.merchantAddress.slice(2)}${parseEther(button.amount).toString(16).padStart(64, '0')}` :
        '0x',
    };

    return NextResponse.json({
      paymentIntentId,
      transactionData,
      button: {
        name: button.name,
        description: button.description,
        amount: button.amount,
        tokenAddress: button.tokenAddress,
        chainId: button.chainId,
      },
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
