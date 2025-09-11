import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Remove the 'sha256=' prefix if present
    const cleanSignature = signature.replace('sha256=', '');
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Compare signatures using crypto.timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export function parseWebhookPayload(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch (error) {
    console.error('Error parsing webhook payload:', error);
    return null;
  }
}
