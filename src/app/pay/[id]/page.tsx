/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTransactionById, updateTransactionStatus } from "@/actions/transactionActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { chains } from "@/utils/chain";
import { RefreshCw, ExternalLink, Wallet, Clock, CheckCircle, XCircle, Home } from "lucide-react";
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  useWaitForTransactionReceipt as useWaitForContractReceipt,
  type BaseError,
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ButtonInfo {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  amountUsd: number;
  chainId: string[];
  merchantAddress: string;
  isActive: boolean;
}

interface Transaction {
  _id: string;
  from: string;
  to: string;
  signature?: string;
  time: string;
  status: "pending" | "success" | "failed";
  buttonId: ButtonInfo;
  amountUsd: number;
}

type PriceData = {
  chainId: string;
  chainName: string;
  nativeAmount: number;
  tokenSymbol: string;
  price: number;
  loading?: boolean;
  error?: string;
};

export default function Page() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [transactionRejected, setTransactionRejected] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<string | null>(null);
  const [successfulTxHash, setSuccessfulTxHash] = useState<string | null>(null);
  const [successfulTxChainId, setSuccessfulTxChainId] = useState<string | null>(null);
  const [statusUpdated, setStatusUpdated] = useState(false);

  // Function to reset transaction states
  const resetTransactionStates = () => {
    // Note: We can't directly reset wagmi states, but we can handle the UI states
    // The wagmi hooks will automatically reset when new transactions are initiated
  };

  // Wallet hooks
  const { isConnected, address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  
  const {
    data: hash,
    error,
    isPending,
    sendTransaction,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Contract write hooks for ERC-20 tokens
  const {
    data: contractHash,
    error: contractError,
    isPending: isContractPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isContractConfirming, isSuccess: isContractConfirmed } =
    useWaitForContractReceipt({ hash: contractHash });

  // Add timeout to reset loading states if they get stuck
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPending || isContractPending) {
      // Set a 30-second timeout to reset stuck loading states
      timeout = setTimeout(() => {
        if (isPending || isContractPending) {
          setActiveTransaction(null);
          // Don't show timeout toast - let user retry naturally
        }
      }, 30000);
    }
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isPending, isContractPending]);

  // Token contract addresses
  const TOKEN_CONTRACTS: Record<string, string> = {
    '10': '0x4200000000000000000000000000000000000042', // OP token on Optimism
    '42161': '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB token on Arbitrum
    '137': '0x0000000000000000000000000000000000001010', // MATIC token on Polygon
  };

  // Block explorer URLs for different chains
  const BLOCK_EXPLORERS: Record<string, string> = {
    '1': 'https://etherscan.io/tx/', // Ethereum Mainnet
    '10': 'https://optimistic.etherscan.io/tx/', // Optimism
    '42161': 'https://arbiscan.io/tx/', // Arbitrum One
    '137': 'https://polygonscan.com/tx/', // Polygon
    '8453': 'https://basescan.org/tx/', // Base
    '43114': 'https://snowtrace.io/tx/', // Avalanche
  };

  // Chain names for display
  const CHAIN_NAMES: Record<string, string> = {
    '1': 'Ethereum Mainnet',
    '10': 'Optimism',
    '42161': 'Arbitrum One',
    '137': 'Polygon',
    '8453': 'Base',
    '43114': 'Avalanche',
  };

  const fetchTransaction = async () => {
    setLoading(true);
    const res = await getTransactionById(id as string);
    if (!res) {
      setPageError("No response from server");
      return;
    }
    if (res.success && res.transaction) {
      setTransaction(res.transaction);
      setPageError(null);
    } else {
      setTransaction(null);
      setPageError("Invalid transaction id");
    }
    setLoading(false);
  };

  // Fetch live price data for all chains
  const fetchAllChainPrices = async () => {
    if (!transaction?.buttonId) return;
    
    setPriceLoading(true);
    const usdAmount = transaction.buttonId.amountUsd;
    
    try {
      // Fetch prices for all chains at once
      const response = await fetch(`/api/prices?amount=${usdAmount}`);
      const data = await response.json();
      
      console.log('Price API response:', data);
      
      if (data.success && data.data && data.data.conversions) {
        const chainPrices: PriceData[] = transaction.buttonId.chainId.map(chainId => {
          const chainName = chains.find(c => c.id === chainId)?.name || chainId;
          const chainData = data.data.conversions[chainId];
          
          return {
            chainId,
            chainName,
            nativeAmount: chainData?.nativeAmount || 0,
            tokenSymbol: chainData?.tokenSymbol || 'Unknown',
            price: chainData?.price || 0,
            loading: false,
            error: chainData ? undefined : 'Price not available'
          };
        });
        
        setPriceData(chainPrices);
        setLastUpdated(new Date());
        console.log('Successfully set price data:', chainPrices);
      } else {
        console.log('API response structure issue:', data);
        // Fallback: fetch individual chain prices
        console.log('Using fallback: fetching individual chain prices');
        const chainPrices: PriceData[] = await Promise.all(
          transaction.buttonId.chainId.map(async (chainId) => {
            const chainName = chains.find(c => c.id === chainId)?.name || chainId;
            try {
              const response = await fetch(`/api/prices?amount=${usdAmount}&chainId=${chainId}`);
              const data = await response.json();
              
              console.log(`Individual chain ${chainId} response:`, data);
              
              if (data.success && data.data) {
                return {
                  chainId,
                  chainName,
                  nativeAmount: data.data.nativeAmount,
                  tokenSymbol: data.data.tokenSymbol,
                  price: data.data.price,
                  loading: false
                };
              } else {
                return {
                  chainId,
                  chainName,
                  nativeAmount: 0,
                  tokenSymbol: 'Unknown',
                  price: 0,
                  loading: false,
                  error: data.error || 'Price not available'
                };
              }
            } catch (error) {
              console.error(`Error fetching price for chain ${chainId}:`, error);
              return {
                chainId,
                chainName,
                nativeAmount: 0,
                tokenSymbol: 'Unknown',
                price: 0,
                loading: false,
                error: 'Network error'
              };
            }
          })
        );
        
        setPriceData(chainPrices);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Don't show toast for price fetch errors - UI will show retry button
    } finally {
      setPriceLoading(false);
    }
  };

  // Handle MetaMask payment
  const handlePayment = async (chainData: PriceData) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!transaction?.buttonId) {
      toast.error("Transaction data not available");
      return;
    }

    // Reset rejected state for new transaction
    setTransactionRejected(false);
    setStatusUpdated(false); // Reset status update flag for new payment
    // Set active transaction for this specific chain
    setActiveTransaction(chainData.chainId);

    try {
      // Switch to the correct chain if needed
      if (chain?.id !== Number(chainData.chainId)) {
        await switchChainAsync?.({ chainId: Number(chainData.chainId) });
      }

      // Check if this is a native token (ETH, AVAX) or ERC-20 token (OP, ARB, MATIC)
      const isNativeToken = ['1', '8453', '43114'].includes(chainData.chainId);
      
      if (isNativeToken) {
        // Send native token transaction (ETH, AVAX)
        sendTransaction({
          to: transaction.buttonId.merchantAddress as `0x${string}`,
          value: parseEther(chainData.nativeAmount.toString()),
        });
        // Don't show loading toast for native tokens
      } else {
        // Send ERC-20 token transaction (OP, ARB, MATIC)
        const tokenContract = TOKEN_CONTRACTS[chainData.chainId];
        if (!tokenContract) {
          toast.error(`Token contract not found for chain ${chainData.chainId}`);
          return;
        }

        // ERC-20 transfer function signature: transfer(address to, uint256 amount)
        writeContract({
          address: tokenContract as `0x${string}`,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'transfer',
          args: [
            transaction.buttonId.merchantAddress as `0x${string}`,
            parseUnits(chainData.nativeAmount.toString(), 18) // Most tokens use 18 decimals
          ],
        });
        // Don't show loading toast for ERC-20 tokens
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed. Please try again.");
      setActiveTransaction(null);
    }
  };

  // Handle transaction state changes for native tokens
  useEffect(() => {
    if (hash) {
      // Only show hash in console, not as toast
      console.log(`Native Token Transaction Hash: ${hash}`);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed && hash && transaction && !statusUpdated) {
      console.log("Native transaction confirmed:", { hash, activeTransaction, transactionId: transaction._id });
      toast.success("Payment confirmed! Transaction completed successfully.");
      setSuccessfulTxHash(hash);
      setSuccessfulTxChainId(activeTransaction);
      setActiveTransaction(null);
      setStatusUpdated(true);
      
      // Update transaction status in database
      updateTransactionStatus(transaction._id, "success", hash)
        .then((result: any) => {
          if (result.success) {
            console.log("Transaction status updated to success");
            // Update local transaction state instead of refetching
            setTransaction(prev => prev ? { ...prev, status: "success", signature: hash } : null);
          } else {
            console.error("Failed to update transaction status:", result.error);
          }
        })
        .catch((error: any) => {
          console.error("Error updating transaction status:", error);
        });
    }
  }, [isConfirmed, hash, activeTransaction, transaction, statusUpdated]);

  useEffect(() => {
    if (error) {
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as BaseError).shortMessage || 
          (error as any).message || 
          "Native token transaction failed";
      
      // Check if it's a user rejection
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('user denied') ||
          errorMessage.toLowerCase().includes('rejected')) {
        setTransactionRejected(true);
        setActiveTransaction(null);
        // Don't show toast for user rejection - UI will show the state
      } else {
        setActiveTransaction(null);
        toast.error("Transaction failed. Please try again.");
      }
    }
  }, [error]);

  // Handle transaction state changes for ERC-20 tokens
  useEffect(() => {
    if (contractHash) {
      // Only show hash in console, not as toast
      console.log(`ERC-20 Token Transaction Hash: ${contractHash}`);
    }
  }, [contractHash]);

  useEffect(() => {
    if (isContractConfirmed && contractHash && transaction && !statusUpdated) {
      console.log("ERC-20 transaction confirmed:", { contractHash, activeTransaction, transactionId: transaction._id });
      toast.success("Payment confirmed! Transaction completed successfully.");
      setSuccessfulTxHash(contractHash);
      setSuccessfulTxChainId(activeTransaction);
      setActiveTransaction(null);
      setStatusUpdated(true);
      
      // Update transaction status in database
      updateTransactionStatus(transaction._id, "success", contractHash)
        .then((result: any) => {
          if (result.success) {
            console.log("Transaction status updated to success");
            // Update local transaction state instead of refetching
            setTransaction(prev => prev ? { ...prev, status: "success", signature: contractHash } : null);
          } else {
            console.error("Failed to update transaction status:", result.error);
          }
        })
        .catch((error: any) => {
          console.error("Error updating transaction status:", error);
        });
    }
  }, [isContractConfirmed, contractHash, activeTransaction, transaction, statusUpdated]);

  useEffect(() => {
    if (contractError) {
      const errorMessage = typeof contractError === 'string' 
        ? contractError 
        : (contractError as BaseError).shortMessage || 
          (contractError as any).message || 
          "ERC-20 token transaction failed";
      
      // Check if it's a user rejection
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('user denied') ||
          errorMessage.toLowerCase().includes('rejected')) {
        setTransactionRejected(true);
        setActiveTransaction(null);
        // Don't show toast for user rejection - UI will show the state
      } else {
        setActiveTransaction(null);
        toast.error("Transaction failed. Please try again.");
      }
    }
  }, [contractError]);

  useEffect(() => {
    if (id) {
      fetchTransaction();
    }
  }, [id]);

  // Fetch prices when transaction is loaded
  useEffect(() => {
    if (transaction?.buttonId && transaction.buttonId.chainId.length > 0) {
      console.log('Transaction loaded, fetching prices for chains:', transaction.buttonId.chainId);
      fetchAllChainPrices();
    }
  }, [transaction]);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    if (!transaction?.buttonId || transaction.buttonId.chainId.length === 0) return;
    
    const interval = setInterval(() => {
      fetchAllChainPrices();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [transaction]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-red-600">{pageError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Transaction Found</h2>
            <p className="text-gray-600">The transaction you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h1>
          <p className="text-gray-600">
            Pay {transaction.buttonId.name} - ${transaction.buttonId.amountUsd} USD
          </p>
          
          {/* Wallet Connection Status */}
          <div className="mt-4 flex justify-center">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                {chain && (
                  <Badge variant="outline" className="text-xs">
                    {chain.name}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Connect your wallet to make payments
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Transaction Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusColor(transaction.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(transaction.status)}
                    {transaction.status.toUpperCase()}
                  </div>
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">From:</span>
                <p className="text-sm text-gray-600 font-mono">{transaction.from}</p>
              </div>
              
              <div>
                <span className="font-medium">To:</span>
                <p className="text-sm text-gray-600 font-mono">{transaction.to}</p>
              </div>
              
              <div>
                <span className="font-medium">Amount:</span>
                <p className="text-lg font-semibold text-green-600">
                  ${transaction.amountUsd} USD
                </p>
              </div>
              
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-sm text-gray-600">
                  {new Date(transaction.time).toLocaleString()}
                </p>
              </div>
              
              {transaction.signature && (
                <div>
                  <span className="font-medium">Signature:</span>
                  <p className="text-sm text-gray-600 font-mono break-all">
                    {transaction.signature}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Options or Return Home */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {transaction?.status === "success" ? "Payment Complete" : "Choose Your Payment Method"}
                  </CardTitle>
                  {transaction?.status !== "success" && (
                    <div className="flex items-center gap-2">
                      {lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                          Updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAllChainPrices}
                        disabled={priceLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${priceLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {transaction?.status === "success" ? (
                  // Return Home Button for successful payments
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                        Payment Successful!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Your payment has been processed successfully.
                      </p>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => window.location.href = '/'}
                    >
                      <Home className="h-5 w-5 mr-2" />
                      Return Home
                    </Button>
                  </div>
                ) : priceLoading && priceData.length === 0 ? (
                  <div className="grid gap-3">
                    {transaction.buttonId.chainId.map((chainId) => {
                      const chainName = chains.find(c => c.id === chainId)?.name || chainId;
                      return (
                        <div key={chainId} className="border rounded-lg p-4 animate-pulse">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 w-1/3 bg-gray-300 rounded" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                          </div>
                          <div className="h-6 w-1/2 bg-gray-200 rounded mb-1" />
                          <div className="h-4 w-1/3 bg-gray-200 rounded" />
                        </div>
                      );
                    })}
                  </div>
                ) : priceData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No price data available</p>
                    <Button onClick={fetchAllChainPrices} disabled={priceLoading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${priceLoading ? 'animate-spin' : ''}`} />
                      Load Prices
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {priceData.map((chain) => (
                      <Card key={chain.chainId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{chain.chainName}</h4>
                              <Badge variant="outline" className="text-xs">
                                Chain ID: {chain.chainId}
                              </Badge>
                              {activeTransaction === chain.chainId && (
                                <Badge variant="default" className="text-xs bg-blue-600">
                                  Active
                                </Badge>
                              )}
                            </div>
                            
                            {chain.error ? (
                              <div className="text-red-500 text-sm">
                                <p>Error: {chain.error}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fetchAllChainPrices()}
                                  className="mt-2"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Retry
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-2xl font-bold text-blue-600">
                                  {chain.nativeAmount.toFixed(6)} {chain.tokenSymbol}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  1 {chain.tokenSymbol} = ${chain.price.toFixed(2)} USD
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {!isConnected ? (
                              <ConnectButton />
                            ) : (
                              <Button
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handlePayment(chain)}
                                disabled={!!chain.error || 
                                  (activeTransaction === chain.chainId && (isPending || isConfirming || isContractPending || isContractConfirming)) ||
                                  (activeTransaction === chain.chainId && transactionRejected)}
                              >
                                {activeTransaction === chain.chainId && (isPending || isContractPending) ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : activeTransaction === chain.chainId && (isConfirming || isContractConfirming) ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Confirming...
                                  </>
                                ) : activeTransaction === chain.chainId && transactionRejected ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Transaction Rejected
                                  </>
                                ) : (
                                  <>
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Pay {chain.nativeAmount.toFixed(4)} {chain.tokenSymbol}
                                  </>
                                )}
                              </Button>
                            )}
                            {chain.loading && (
                              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {activeTransaction === chain.chainId && transactionRejected && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTransactionRejected(false);
                                  handlePayment(chain);
                                }}
                                className="mt-2"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Try Again
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {transaction?.status !== "success" && priceData.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      🔄 Prices update every 30 seconds via Pyth Network
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      💡 ETH/AVAX payments send native tokens directly. OP/ARB/MATIC payments use token contracts.
                    </p>
                  </div>
                )}

                {/* Transaction Status */}
                {transaction?.status !== "success" && activeTransaction && (isPending || isConfirming || isConfirmed || isContractPending || isContractConfirming || isContractConfirmed) && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium mb-2">Transaction Status</h4>
                    
                    {/* Native Token Transaction Status */}
                    {(isPending || isConfirming || isConfirmed) && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Native Token Transaction:</p>
                        {isPending && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Transaction sent, waiting for confirmation...</span>
                          </div>
                        )}
                        {isConfirming && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Transaction confirming on blockchain...</span>
                          </div>
                        )}
                        {isConfirmed && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Transaction confirmed successfully!</span>
                          </div>
                        )}
                        {hash && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Transaction Hash:</p>
                            <p className="text-xs font-mono break-all">{hash}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ERC-20 Token Transaction Status */}
                    {(isContractPending || isContractConfirming || isContractConfirmed) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ERC-20 Token Transaction:</p>
                        {isContractPending && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Token transaction sent, waiting for confirmation...</span>
                          </div>
                        )}
                        {isContractConfirming && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Token transaction confirming on blockchain...</span>
                          </div>
                        )}
                        {isContractConfirmed && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Token transaction confirmed successfully!</span>
                          </div>
                        )}
                        {contractHash && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Transaction Hash:</p>
                            <p className="text-xs font-mono break-all">{contractHash}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Success Display */}
                {(() => {
                  console.log("Success display check:", { 
                    successfulTxHash, 
                    successfulTxChainId, 
                    transactionStatus: transaction?.status,
                    transactionSignature: transaction?.signature 
                  });
                  return (successfulTxHash && successfulTxChainId) || 
                         (transaction?.status === "success" && transaction?.signature);
                })() && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-800 dark:text-green-200">Payment Successful!</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Hash:</p>
                        <p className="text-sm font-mono break-all bg-white dark:bg-gray-800 p-2 rounded border">
                          {successfulTxHash || transaction?.signature}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Network:</p>
                        <p className="text-sm font-medium">
                          {CHAIN_NAMES[successfulTxChainId || ''] || 
                           CHAIN_NAMES[transaction?.buttonId?.chainId?.[0] || ''] || 
                           `Chain ${successfulTxChainId || transaction?.buttonId?.chainId?.[0]}`}
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <a
                          href={`${BLOCK_EXPLORERS[successfulTxChainId || transaction?.buttonId?.chainId?.[0] || '']}${successfulTxHash || transaction?.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on Block Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Button Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Merchant:</span>
                <p className="text-gray-600">{transaction.buttonId.name}</p>
              </div>
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-gray-600">
                  {transaction.buttonId.description || 'No description provided'}
                </p>
              </div>
              <div>
                <span className="font-medium">Merchant Address:</span>
                <p className="text-gray-600 font-mono text-xs">
                  {transaction.buttonId.merchantAddress}
                </p>
              </div>
              <div>
                <span className="font-medium">Available Chains:</span>
                <p className="text-gray-600">
                  {transaction.buttonId.chainId.length} chain(s) supported
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
