"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";

interface Payment {
  id: string;
  buttonId: string;
  amount: string;
  tokenAddress?: string;
  chainId: number;
  merchantAddress: string;
  customerAddress?: string;
  transactionHash?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatAmount = (amount: string, tokenAddress?: string) => {
    if (tokenAddress) {
      return `${amount} Tokens`;
    }
    return `${amount} ETH`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getExplorerUrl = (txHash: string, chainId: number) => {
    const explorers = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      10: 'https://optimistic.etherscan.io',
      42161: 'https://arbiscan.io',
      8453: 'https://basescan.org'
    };
    const explorer = explorers[chainId as keyof typeof explorers] || 'https://etherscan.io';
    return `${explorer}/tx/${txHash}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">
            View and track all your crypto payments
          </p>
        </div>
        <Button onClick={fetchPayments} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <RefreshCw className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No payments yet
            </h3>
            <p className="text-gray-500 text-center">
              Payments will appear here once customers start using your buttons
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        Payment #{payment.id.slice(-8)}
                      </h3>
                      <Badge variant={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-medium">
                          {formatAmount(payment.amount, payment.tokenAddress)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Network</p>
                        <p className="font-medium">{getChainName(payment.chainId)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Customer</p>
                        <p className="font-mono text-xs">
                          {payment.customerAddress 
                            ? `${payment.customerAddress.slice(0, 6)}...${payment.customerAddress.slice(-4)}`
                            : 'Not connected'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {payment.transactionHash && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getExplorerUrl(payment.transactionHash!, payment.chainId), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View TX
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
