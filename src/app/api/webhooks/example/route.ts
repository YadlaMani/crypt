import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, parseWebhookPayload } from '@/lib/webhooks/verify';

// This is an example webhook endpoint that merchants can use as a reference
// for implementing their own webhook receivers

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-crypto-pay-signature');
    const event = request.headers.get('x-crypto-pay-event');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // In a real implementation, merchants would use their own webhook secret
    const webhookSecret = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

    // Verify the webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = parseWebhookPayload(body);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    console.log('Received webhook:', {
      event,
      paymentIntentId: payload.data.paymentIntentId,
      amount: payload.data.amount,
      status: event === 'payment.confirmed' ? 'confirmed' : 'failed',
    });

    // Handle the webhook event
    switch (event) {
      case 'payment.confirmed':
        await handlePaymentConfirmed(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      default:
        console.log(`Unknown webhook event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePaymentConfirmed(payload: any) {
  // Example: Update your database, send confirmation email, etc.
  console.log('Payment confirmed:', payload.data);
  
  // Example implementation:
  // - Update order status in your database
  // - Send confirmation email to customer
  // - Trigger fulfillment process
  // - Update inventory
}

async function handlePaymentFailed(payload: any) {
  // Example: Log failed payment, notify support, etc.
  console.log('Payment failed:', payload.data);
  
  // Example implementation:
  // - Log the failure for investigation
  // - Send notification to support team
  // - Update order status to failed
}
