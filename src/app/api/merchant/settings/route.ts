import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Merchant from '@/lib/models/Merchant';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const merchant = await Merchant.findOne({ clerkId: userId });

    if (!merchant) {
      return NextResponse.json({
        walletAddress: '',
        webhookUrl: '',
      });
    }

    return NextResponse.json({
      walletAddress: merchant.walletAddress || '',
      webhookUrl: merchant.webhookUrl || '',
    });
  } catch (error) {
    console.error('Error fetching merchant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletAddress, webhookUrl } = body;

    await connectDB();

    const merchant = await Merchant.findOneAndUpdate(
      { clerkId: userId },
      {
        walletAddress: walletAddress || undefined,
        webhookUrl: webhookUrl || undefined,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      walletAddress: merchant.walletAddress || '',
      webhookUrl: merchant.webhookUrl || '',
    });
  } catch (error) {
    console.error('Error updating merchant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
