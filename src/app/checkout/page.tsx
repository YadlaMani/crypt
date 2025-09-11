"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { parseEther } from "viem";

interface PaymentData {
  paymentIntentId: string;
  transactionData: {
    to: string;
    value: string;
    data: string;
  };
  button: {
    name: string;
    description?: string;
    amount: string;
    tokenAddress?: string;
    chainId: number;
  };
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'confirmed' | 'failed'>('pending');

  const buttonId = searchParams.get('buttonId');
  const customerAddress = searchParams.get('customerAddress');

  const { sendTransaction, data: hash, isPending, error: txError } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (buttonId) {
      initializePayment();
    } else {
      setError('Button ID is required');
      setLoading(false);
    }
  }, [buttonId]);

  useEffect(() => {
    if (hash && paymentData) {
      setPaymentStatus('processing');
      updatePaymentIntent(hash);
      startTransactionMonitoring(hash);
    }
  }, [hash, paymentData]);

  useEffect(() => {
    if (isConfirmed && paymentData) {
      setPaymentStatus('confirmed');
      updatePaymentIntent(hash, 'confirmed');
    }
  }, [isConfirmed, paymentData, hash]);

  useEffect(() => {
    if (txError) {
      setPaymentStatus('failed');
      setError(txError.message);
    }
  }, [txError]);

  const initializePayment = async () => {
    try {
      const response = await fetch('/api/payments/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buttonId,
          customerAddress: customerAddress || address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }

      const data = await response.json();
      setPaymentData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentIntent = async (txHash: string, status?: string) => {
    if (!paymentData) return;

    try {
      await fetch(`/api/payments/${paymentData.paymentIntentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash: txHash,
          status: status || 'processing',
        }),
      });
    } catch (err) {
      console.error('Failed to update payment intent:', err);
    }
  };

  const startTransactionMonitoring = async (txHash: string) => {
    if (!paymentData) return;

    try {
      await fetch('/api/transactions/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentData.paymentIntentId,
          txHash,
          chainId: paymentData.button.chainId,
        }),
      });
    } catch (err) {
      console.error('Failed to start transaction monitoring:', err);
    }
  };

  const handlePayment = () => {
    if (!paymentData || !isConnected) return;

    sendTransaction({
      to: paymentData.transactionData.to,
      value: paymentData.transactionData.value,
      data: paymentData.transactionData.data,
    });
  };

  const formatAmount = (amount: string, tokenAddress?: string) => {
    if (tokenAddress) {
      return `${amount} Tokens`;
    }
    try {
      const ethAmount = parseEther(amount);
      return `${amount} ETH`;
    } catch {
      return `${amount} ETH`;
    }
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 10: return 'Optimism';
      case 42161: return 'Arbitrum';
      case 8453: return 'Base';
      default: return `Chain ${chainId}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.close()}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{paymentData.button.name}</CardTitle>
              <Badge variant={paymentStatus === 'confirmed' ? 'default' : 'secondary'}>
                {paymentStatus === 'pending' && 'Pending'}
                {paymentStatus === 'processing' && 'Processing'}
                {paymentStatus === 'confirmed' && 'Confirmed'}
                {paymentStatus === 'failed' && 'Failed'}
              </Badge>
            </div>
            {paymentData.button.description && (
              <CardDescription>{paymentData.button.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  {formatAmount(paymentData.button.amount, paymentData.button.tokenAddress)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">
                  {getChainName(paymentData.button.chainId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To:</span>
                <span className="font-mono text-sm">
                  {paymentData.transactionData.to.slice(0, 6)}...{paymentData.transactionData.to.slice(-4)}
                </span>
              </div>
            </div>

            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                {!isConnected ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Connect your wallet to proceed</p>
                    <ConnectButton />
                  </div>
                ) : (
                  <Button 
                    onClick={handlePayment}
                    disabled={isPending}
                    className="w-full"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Preparing Transaction...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                )}
              </div>
            )}

            {paymentStatus === 'processing' && (
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-gray-600">
                  Transaction submitted. Waiting for confirmation...
                </p>
                {hash && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://etherscan.io/tx/${hash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Etherscan
                  </Button>
                )}
              </div>
            )}

            {paymentStatus === 'confirmed' && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
                <p className="text-gray-600">
                  Your transaction has been confirmed on the blockchain.
                </p>
                {hash && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://etherscan.io/tx/${hash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Transaction
                  </Button>
                )}
                <Button onClick={() => window.close()} className="w-full">
                  Close
                </Button>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
                <p className="text-gray-600">
                  {error || 'Transaction failed. Please try again.'}
                </p>
                <Button onClick={() => window.close()}>Close</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
