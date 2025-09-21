"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getButtonById } from "@/actions/buttonActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { chains } from "@/utils/chain";
import Link from "next/link";
import getButtonComponentById from "@/utils/buttonComponentCode";
import PaymentButton from "@/components/PaymentButtonPage";
import { Download, Check, Copy, X } from "lucide-react";
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
  ): void => {
    toast.message(`Transaction ${state}: ${transactionId}`);
  };
  const copyToClipboard = async (): Promise<void> => {
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
      } catch (err) {
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
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">
              {button.name}
            </CardTitle>
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
              <span className="font-medium">Amount:</span> ${(button.amountUsd || (button as any).amount || 0).toFixed(2)} USD
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
            <Button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Button Component
            </Button>

            {/* Demo Payment Button */}
            <PaymentButton
              buttonId={button._id}
              onTransactionStateChange={handleTransactionStateChange}
            />
          </div>

          <Separator />

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
                  <div
                    key={tx._id}
                    className="p-3 border rounded-lg text-sm bg-muted/30"
                  >
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-80vh overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Copy Payment Button Component
              </h3>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Copy this React component to integrate the payment button into
                your application:
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {buttonComponentCode}
              </pre>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Integration Notes:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Replace the API endpoints with your actual backend URLs
                </li>
                <li>
                  • The component has no external dependencies (no shadcn/ui or
                  Lucide React)
                </li>
                <li>• Uses native SVG icons and pure CSS animations</li>
                <li>
                  • The onTransactionStateChange callback will notify you of
                  payment status
                </li>
                <li>
                  • Transaction polling runs for 5 minutes (60 polls × 5
                  seconds)
                </li>
                <li>
                  • Make sure to handle the transaction states in your merchant
                  application
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
