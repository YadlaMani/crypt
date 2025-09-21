"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getButtonById } from "@/actions/buttonActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  type BaseError,
} from "wagmi";
import { parseEther } from "viem";
import { chains } from "@/utils/chain";

type ButtonType = {
  _id: string;
  name: string;
  description?: string;
  amountUsd: number;
  chainId: string[];
  merchantAddress: string;
  isActive: boolean;
};

type PriceData = {
  nativeAmount: number;
  tokenSymbol: string;
  price: number;
};

export default function PaymentPage() {
  const { id } = useParams();
  const [button, setButton] = useState<ButtonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const { isConnected, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const {
    data: hash,
    error,
    isPending,
    sendTransaction,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Fetch live price data for selected chain
  const fetchPriceData = async (chainId: string, usdAmount: number) => {
    setPriceLoading(true);
    setPriceError(null);
    try {
      const response = await fetch(`/api/prices?amount=${usdAmount}&chainId=${chainId}`);
      const data = await response.json();
      
      if (data.success) {
        setPriceData(data.data);
      } else {
        setPriceError(data.error || 'Failed to fetch price data');
      }
    } catch (error) {
      setPriceError('Network error while fetching prices');
      console.error('Price fetch error:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    async function fetchButton() {
      setLoading(true);
      try {
        const res = await getButtonById(id as string);
        if (res.success) {
          setButton(res.button);
          if (res.button.chainId.length > 0) {
            setSelectedChain(res.button.chainId[0]);
          }
        } else {
          toast.error("Invalid URL or something went wrong");
        }
      } catch (err) {
        toast.error("Error fetching button details");
      } finally {
        setLoading(false);
      }
    }
    fetchButton();
  }, [id]);

  // Fetch price data when button and selected chain change
  useEffect(() => {
    if (button && selectedChain) {
      fetchPriceData(selectedChain, button.amountUsd || (button as any).amount || 0);
    }
  }, [button, selectedChain]);

  // Refresh price data every 30 seconds
  useEffect(() => {
    if (!button || !selectedChain) return;
    
    const interval = setInterval(() => {
      fetchPriceData(selectedChain, button.amountUsd || (button as any).amount || 0);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [button, selectedChain]);

  const handlePay = async () => {
    if (!button) return;
    if (!isConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!selectedChain) {
      toast.error("Select a chain to continue.");
      return;
    }
    if (!priceData) {
      toast.error("Price data not available. Please wait or refresh.");
      return;
    }

    try {
      if (chain?.id !== Number(selectedChain)) {
        await switchChainAsync?.({ chainId: Number(selectedChain) });
      }

      // Use the calculated native token amount from Pyth price feed
      sendTransaction({
        to: button.merchantAddress as `0x${string}`,
        value: parseEther(priceData.nativeAmount.toString()),
      });

      toast.loading("Transaction sent. Waiting for confirmation...");
    } catch (err) {
      console.error(err);
      toast.error("Payment Failed");
    }
  };

  const handleChainChange = (newChainId: string) => {
    setSelectedChain(newChainId);
    // Price data will be automatically fetched via useEffect
  };

  useEffect(() => {
    if (hash) {
      toast.info(`Tx Hash: ${hash}`);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading("Waiting for confirmation...");
    }
    if (isConfirmed) {
      toast.success("Transaction confirmed!");
    }
  }, [isConfirming, isConfirmed]);

  useEffect(() => {
    if (error) {
      toast.error(
        (error as BaseError).shortMessage ||
          error.message ||
          "Transaction failed"
      );
    }
  }, [error]);

  if (loading) return <p className="text-center py-10">Loading button...</p>;
  if (!button) return <p className="text-center py-10">Button not found.</p>;

  const getChainName = (id: string) =>
    chains.find((c) => c.id === id)?.name || id;

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">{button.name}</CardTitle>
            <Badge variant={button.isActive ? "default" : "secondary"}>
              {button.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {button.description || "No description"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="font-medium text-sm">Recipient Address</p>
            <p className="text-xs truncate">{button.merchantAddress}</p>
          </div>

          <div>
            <p className="font-medium text-sm">Amount</p>
            <p className="text-lg font-semibold">${(button.amountUsd || (button as any).amount || 0).toFixed(2)} USD</p>
          </div>

          <div>
            <p className="font-medium text-sm mb-1">Select Chain</p>
            <select
              value={selectedChain}
              onChange={(e) => handleChainChange(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              disabled={priceLoading}
            >
              {button.chainId.map((cid) => (
                <option key={cid} value={cid}>
                  {getChainName(cid)}
                </option>
              ))}
            </select>
          </div>

          {/* Live Price Conversion */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">You will pay:</p>
            {priceLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-1"></div>
              </div>
            ) : priceError ? (
              <div className="text-red-500 text-sm">
                <p>Error: {priceError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPriceData(selectedChain, button.amountUsd)}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : priceData ? (
              <>
                <p className="text-xl font-bold">
                  {priceData.nativeAmount.toFixed(6)} {priceData.tokenSymbol}
                </p>
                <p className="text-xs text-muted-foreground">
                  1 {priceData.tokenSymbol} = ${priceData.price.toFixed(2)} USD
                </p>
                <p className="text-xs text-muted-foreground">
                  🔄 Price updates every 30 seconds via Pyth Network
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading price data...</p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handlePay}
            disabled={isPending || isConfirming || priceLoading || !priceData || !!priceError}
          >
            {isPending
              ? "Sending..."
              : isConfirming
              ? "Confirming..."
              : priceLoading
              ? "Loading Price..."
              : !priceData
              ? "Price Data Required"
              : priceError
              ? "Price Error"
              : `Pay ${priceData.nativeAmount.toFixed(4)} ${priceData.tokenSymbol}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}