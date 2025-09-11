import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PaymentIntent from '@/lib/models/PaymentIntent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const paymentIntent = await PaymentIntent.findOne({ id });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      tokenAddress: paymentIntent.tokenAddress,
      chainId: paymentIntent.chainId,
      merchantAddress: paymentIntent.merchantAddress,
      customerAddress: paymentIntent.customerAddress,
      transactionHash: paymentIntent.transactionHash,
      createdAt: paymentIntent.createdAt,
      confirmedAt: paymentIntent.confirmedAt,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { transactionHash, status } = body;

    await connectDB();

    const updateData: { transactionHash?: string; status?: string; confirmedAt?: Date } = {};
    if (transactionHash) updateData.transactionHash = transactionHash;
    if (status) {
      updateData.status = status;
      if (status === 'confirmed') {
        updateData.confirmedAt = new Date();
      }
    }

    const { id } = await params;
    const paymentIntent = await PaymentIntent.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    );

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      transactionHash: paymentIntent.transactionHash,
      confirmedAt: paymentIntent.confirmedAt,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
