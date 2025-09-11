import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Button from '@/lib/models/Button';
import Merchant from '@/lib/models/Merchant';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get or create merchant
    let merchant = await Merchant.findOne({ clerkId: userId });
    if (!merchant) {
      merchant = new Merchant({
        clerkId: userId,
        email: '', // Will be updated when user info is available
        name: 'Merchant',
      });
      await merchant.save();
    }

    // Get buttons for this merchant
    const buttons = await Button.find({ merchantId: userId });

    return NextResponse.json(buttons);
  } catch (error) {
    console.error('Error fetching buttons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, amount, tokenAddress, chainId, merchantAddress } = body;

    // Validate required fields
    if (!name || !amount || !chainId || !merchantAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get or create merchant
    let merchant = await Merchant.findOne({ clerkId: userId });
    if (!merchant) {
      merchant = new Merchant({
        clerkId: userId,
        email: '',
        name: 'Merchant',
      });
      await merchant.save();
    }

    // Create new button
    const buttonId = crypto.randomUUID();
    const button = new Button({
      id: buttonId,
      merchantId: userId,
      name,
      description,
      amount,
      tokenAddress: tokenAddress || undefined,
      chainId,
      merchantAddress,
      isActive: true,
    });

    await button.save();

    return NextResponse.json(button, { status: 201 });
  } catch (error) {
    console.error('Error creating button:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
