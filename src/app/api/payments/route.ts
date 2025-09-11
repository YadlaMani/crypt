import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import PaymentIntent from '@/lib/models/PaymentIntent';
import Button from '@/lib/models/Button';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all buttons for this merchant
    const buttons = await Button.find({ merchantId: userId });
    const buttonIds = buttons.map(button => button.id);

    // Get all payments for these buttons
    const payments = await PaymentIntent.find({ 
      buttonId: { $in: buttonIds } 
    }).sort({ createdAt: -1 });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
