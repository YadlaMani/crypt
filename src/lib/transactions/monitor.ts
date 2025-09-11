import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet, polygon, optimism, arbitrum, base } from 'viem/chains';
import connectDB from '@/lib/db';
import PaymentIntent from '@/lib/models/PaymentIntent';
import Button from '@/lib/models/Button';
import { webhookSender } from '@/lib/webhooks/sender';

const chains = {
  1: mainnet,
  137: polygon,
  10: optimism,
  42161: arbitrum,
  8453: base,
};

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

export class TransactionMonitor {
  private clients: Record<number, any> = {};
  private monitoringIntervals: Record<string, NodeJS.Timeout> = {};

  constructor() {
    // Initialize clients for each chain
    Object.entries(chains).forEach(([chainId, chain]) => {
      this.clients[parseInt(chainId)] = createPublicClient({
        chain,
        transport: http(),
      });
    });
  }

  async startMonitoring(paymentIntentId: string, txHash: string, chainId: number) {
    const client = this.clients[chainId];
    if (!client) {
      console.error(`No client available for chain ${chainId}`);
      return;
    }

    console.log(`Starting monitoring for payment ${paymentIntentId}, tx: ${txHash}`);

    // Clear any existing monitoring for this payment
    this.stopMonitoring(paymentIntentId);

    // Start monitoring with polling
    const interval = setInterval(async () => {
      try {
        await this.checkTransaction(paymentIntentId, txHash, chainId, client);
      } catch (error) {
        console.error(`Error monitoring transaction ${txHash}:`, error);
      }
    }, 5000); // Check every 5 seconds

    this.monitoringIntervals[paymentIntentId] = interval;

    // Also check immediately
    setTimeout(() => {
      this.checkTransaction(paymentIntentId, txHash, chainId, client);
    }, 1000);
  }

  private async checkTransaction(paymentIntentId: string, txHash: string, chainId: number, client: any) {
    try {
      const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      
      if (receipt) {
        await this.handleTransactionReceipt(paymentIntentId, receipt, chainId);
        this.stopMonitoring(paymentIntentId);
      }
    } catch (error) {
      // Transaction might not be mined yet
      console.log(`Transaction ${txHash} not yet mined`);
    }
  }

  private async handleTransactionReceipt(paymentIntentId: string, receipt: any, chainId: number) {
    await connectDB();

    const paymentIntent = await PaymentIntent.findOne({ id: paymentIntentId });
    if (!paymentIntent) {
      console.error(`Payment intent ${paymentIntentId} not found`);
      return;
    }

    const button = await Button.findOne({ id: paymentIntent.buttonId });
    if (!button) {
      console.error(`Button ${paymentIntent.buttonId} not found`);
      return;
    }

    let isValid = false;

    if (button.tokenAddress) {
      // ERC-20 token transfer
      isValid = await this.validateERC20Transfer(receipt, button, paymentIntent);
    } else {
      // ETH transfer
      isValid = await this.validateETHTransfer(receipt, button, paymentIntent);
    }

    if (isValid) {
      paymentIntent.status = 'confirmed';
      paymentIntent.confirmedAt = new Date();
      await paymentIntent.save();
      
      console.log(`Payment ${paymentIntentId} confirmed`);
      
      // Send webhook notification
      await webhookSender.sendWebhook(paymentIntentId, 'payment.confirmed');
    } else {
      paymentIntent.status = 'failed';
      await paymentIntent.save();
      
      console.log(`Payment ${paymentIntentId} failed validation`);
      
      // Send webhook notification
      await webhookSender.sendWebhook(paymentIntentId, 'payment.failed');
    }
  }

  private async validateETHTransfer(receipt: any, button: Button, paymentIntent: PaymentIntent): Promise<boolean> {
    // Check if transaction was successful
    if (receipt.status !== 'success') {
      return false;
    }

    // Check if the transaction was sent to the correct address
    if (receipt.to?.toLowerCase() !== button.merchantAddress.toLowerCase()) {
      return false;
    }

    // Check if the amount matches (for ETH transfers, this is the value field)
    const expectedAmount = BigInt(button.amount);
    const actualAmount = BigInt(receipt.value || '0');
    
    return actualAmount >= expectedAmount;
  }

  private async validateERC20Transfer(receipt: any, button: Button, paymentIntent: PaymentIntent): Promise<boolean> {
    // Check if transaction was successful
    if (receipt.status !== 'success') {
      return false;
    }

    // Check for ERC-20 Transfer events
    const transferEvents = receipt.logs.filter((log: any) => {
      // ERC-20 Transfer event signature: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
      return log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    });

    for (const event of transferEvents) {
      // Check if the transfer was to the merchant address
      const toAddress = '0x' + event.topics[2].slice(-40);
      if (toAddress.toLowerCase() === button.merchantAddress.toLowerCase()) {
        // Check if it's the correct token
        if (event.address.toLowerCase() === button.tokenAddress?.toLowerCase()) {
          // Check if the amount is correct
          const amount = BigInt(event.data);
          const expectedAmount = BigInt(button.amount);
          
          if (amount >= expectedAmount) {
            return true;
          }
        }
      }
    }

    return false;
  }

  stopMonitoring(paymentIntentId: string) {
    const interval = this.monitoringIntervals[paymentIntentId];
    if (interval) {
      clearInterval(interval);
      delete this.monitoringIntervals[paymentIntentId];
    }
  }

  // Cleanup method to stop all monitoring
  stopAllMonitoring() {
    Object.values(this.monitoringIntervals).forEach(interval => {
      clearInterval(interval);
    });
    this.monitoringIntervals = {};
  }
}

// Singleton instance
export const transactionMonitor = new TransactionMonitor();
