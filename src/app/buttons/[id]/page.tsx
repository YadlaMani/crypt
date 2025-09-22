/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getButtonById } from "@/actions/buttonActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { chains } from "@/utils/chain";
import getButtonComponentById from "@/utils/buttonComponentCode";
import PaymentButton from "@/components/PaymentButtonPage";
import { Download, Check, Copy } from "lucide-react";

type Transaction = {
  _id: string;
  from: string;
  to: string;
  signature: string;
  time: string;
};

type ButtonType = {
  _id: string;
  name: string;
  description?: string;
  amountUsd: number;
  tokenAddress?: string;
  chainId: string[];
  merchantAddress: string;
  isActive: boolean;
  transactions: Transaction[];
};

type TransactionState = "success" | "failed" | "timeout" | "error";

export default function ButtonDetailsPage() {
  const { id } = useParams();
  const [button, setButton] = useState<ButtonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const buttonComponentCode = getButtonComponentById(id as string);

  const handleTransactionStateChange = (
    state: TransactionState,
    transactionId: string
  ) => {
    toast.message(`Transaction ${state}: ${transactionId}`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buttonComponentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
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
        } else {
          toast.message("Invalid url or something went wrong");
        }
      } catch {
        toast.message("Error fetching button details");
      } finally {
        setLoading(false);
      }
    }
    fetchButton();
  }, [id]);

  if (loading) return <p className="text-center py-10">Loading button...</p>;
  if (!button) return <p className="text-center py-10">Button not found.</p>;

  const getChainName = (id: string) =>
    chains.find((c) => c.id === id)?.name || id;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{button.name}</CardTitle>
            <Badge variant={button.isActive ? "default" : "secondary"}>
              {button.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {button.description || "No description"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p>
              <span className="font-medium">Amount:</span> $
              {(button.amountUsd || (button as any).amount || 0).toFixed(2)} USD
            </p>
            <p>
              <span className="font-medium">Chains:</span>{" "}
              {button.chainId.length > 0
                ? button.chainId.map((cid) => getChainName(cid)).join(", ")
                : "No chain selected"}
            </p>
            {button.tokenAddress && (
              <p>
                <span className="font-medium">Token:</span>{" "}
                {button.tokenAddress}
              </p>
            )}
            <p>
              <span className="font-medium">Merchant:</span>{" "}
              {button.merchantAddress}
            </p>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button onClick={() => setShowDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export Button Component
            </Button>

            <PaymentButton
              buttonId={button._id}
              onTransactionStateChange={handleTransactionStateChange}
              amountUsd={button.amountUsd}
              currency="USDC"
              merchantName={button.name}
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-md font-medium mb-2">Transaction History</h3>
            {button.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {button.transactions.map((tx) => (
                  <Card key={tx._id} className="p-3">
                    <p>
                      <span className="font-medium">From:</span> {tx.from}
                    </p>
                    <p>
                      <span className="font-medium">To:</span> {tx.to}
                    </p>
                    <p className="truncate">
                      <span className="font-medium">Signature:</span>{" "}
                      {tx.signature}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.time).toLocaleString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Copy Payment Button Component</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-2">
            Copy this React component to integrate the payment button into your
            application:
          </p>

          <Button size="sm" onClick={copyToClipboard} className="mb-3">
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Code"}
          </Button>

          <ScrollArea className="h-64 w-full rounded-md border p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {buttonComponentCode}
            </pre>
          </ScrollArea>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Integration Notes:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • The onTransactionStateChange callback will notify you of
                payment status
              </li>
              <li>
                • Transaction polling runs for 10 minutes (60 polls × 10
                seconds)
              </li>
              <li>
                • Make sure to handle the transaction states in your merchant
                application
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
