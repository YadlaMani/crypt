import crypto from 'crypto';
import connectDB from '@/lib/db';
import Button from '@/lib/models/Button';
import Merchant from '@/lib/models/Merchant';

interface WebhookPayload {
  id: string;
  event: 'payment.confirmed' | 'payment.failed';
  data: {
    paymentIntentId: string;
    buttonId: string;
    amount: string;
    tokenAddress?: string;
    chainId: number;
    merchantAddress: string;
    customerAddress?: string;
    transactionHash?: string;
    createdAt: string;
    confirmedAt?: string;
  };
}

export class WebhookSender {
  private async getWebhookSecret(merchantId: string): Promise<string | null> {
    await connectDB();
    
    const merchant = await Merchant.findOne({ clerkId: merchantId });
    return merchant?.webhookSecret || process.env.WEBHOOK_SECRET || null;
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  async sendWebhook(
    paymentIntentId: string,
    event: 'payment.confirmed' | 'payment.failed'
  ): Promise<boolean> {
    try {
      await connectDB();

      // Get payment intent details
      const PaymentIntent = (await import('@/lib/models/PaymentIntent')).default;
      const paymentIntent = await PaymentIntent.findOne({ id: paymentIntentId });
      
      if (!paymentIntent) {
        console.error(`Payment intent ${paymentIntentId} not found`);
        return false;
      }

      // Get button and merchant details
      const button = await Button.findOne({ id: paymentIntent.buttonId });
      if (!button) {
        console.error(`Button ${paymentIntent.buttonId} not found`);
        return false;
      }

      const merchant = await Merchant.findOne({ clerkId: button.merchantId });
      if (!merchant || !merchant.webhookUrl) {
        console.log(`No webhook URL configured for merchant ${button.merchantId}`);
        return true; // Not an error, just no webhook to send
      }

      // Prepare webhook payload
      const payload: WebhookPayload = {
        id: crypto.randomUUID(),
        event,
        data: {
          paymentIntentId: paymentIntent.id,
          buttonId: paymentIntent.buttonId,
          amount: paymentIntent.amount,
          tokenAddress: paymentIntent.tokenAddress,
          chainId: paymentIntent.chainId,
          merchantAddress: paymentIntent.merchantAddress,
          customerAddress: paymentIntent.customerAddress,
          transactionHash: paymentIntent.transactionHash,
          createdAt: paymentIntent.createdAt.toISOString(),
          confirmedAt: paymentIntent.confirmedAt?.toISOString(),
        },
      };

      const payloadString = JSON.stringify(payload);
      const secret = await this.getWebhookSecret(button.merchantId);
      
      if (!secret) {
        console.error(`No webhook secret found for merchant ${button.merchantId}`);
        return false;
      }

      const signature = this.generateSignature(payloadString, secret);

      // Send webhook
      const response = await fetch(merchant.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CryptoPay-Signature': `sha256=${signature}`,
          'X-CryptoPay-Event': event,
          'User-Agent': 'CryptoPay-Webhook/1.0',
        },
        body: payloadString,
      });

      if (response.ok) {
        console.log(`Webhook sent successfully for payment ${paymentIntentId}`);
        return true;
      } else {
        console.error(`Webhook failed for payment ${paymentIntentId}: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`Error sending webhook for payment ${paymentIntentId}:`, error);
      return false;
    }
  }
}

export const webhookSender = new WebhookSender();
