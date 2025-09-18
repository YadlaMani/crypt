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
  amount: number;
  chainId: string[];
  merchantAddress: string;
  isActive: boolean;
};

export default function ButtonDetailsPage() {
  const { id } = useParams();
  const [button, setButton] = useState<ButtonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<string>("");

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

    try {
      if (chain?.id !== Number(selectedChain)) {
        await switchChainAsync?.({ chainId: Number(selectedChain) });
      }

      sendTransaction({
        to: button.merchantAddress as `0x${string}`,
        value: parseEther(button.amount.toString()),
      });

      toast.loading("Transaction sent. Waiting for confirmation...");
    } catch (err) {
      console.error(err);
      toast.error("Payment Failed");
    }
  };

  useEffect(() => {
    if (hash) {
      toast.info(` Tx Hash: ${hash}`);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading(" Waiting for confirmation...");
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
            <p className="text-lg font-semibold">{button.amount} ETH</p>
          </div>

          <div>
            <p className="font-medium text-sm mb-1">Select Chain</p>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              {button.chainId.map((cid) => (
                <option key={cid} value={cid}>
                  {getChainName(cid)}
                </option>
              ))}
            </select>
          </div>

          <Button
            className="w-full"
            onClick={handlePay}
            disabled={isPending || isConfirming}
          >
            {isPending
              ? "Sending..."
              : isConfirming
              ? "Confirming..."
              : "Pay with Crypto"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
