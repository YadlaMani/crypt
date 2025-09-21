"use client";

import React, { useState } from "react";
import { JSX } from "react";
import { Loader2, Check, X } from "lucide-react";

type TransactionStatus =
  | "creating"
  | "processing"
  | "success"
  | "failed"
  | null;

interface PaymentButtonProps {
  buttonId: string;
  onTransactionStateChange?: (
    state: TransactionState,
    transactionId: string
  ) => void;
}

type TransactionState = "success" | "failed" | "timeout" | "error";

const PaymentButton: React.FC<PaymentButtonProps> = ({
  onTransactionStateChange,
  buttonId,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [cryptoId, setCryptoId] = useState<string>(""); // renamed
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pollingCount, setPollingCount] = useState<number>(0);

  const handlePayment = async (): Promise<void> => {
    if (!cryptoId) {
      alert("Please enter your crypto ID");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("creating");

    try {
      const response = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buttonId,
          cryptoId,
        }),
      });

      const { transactionId }: { transactionId: string } =
        await response.json();

      pollTransactionStatus(transactionId);
    } catch (error) {
      setTransactionStatus("failed");
      setTimeout(() => setIsOpen(false), 2000);
    }
  };

  const pollTransactionStatus = async (
    transactionId: string
  ): Promise<void> => {
    const maxPolls = 60;
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/transaction-status/${transactionId}`
        );
        const { status }: { status: string } = await response.json();

        setPollingCount(pollCount);

        if (status === "completed") {
          setTransactionStatus("success");
          onTransactionStateChange?.("success", transactionId);
          setTimeout(() => setIsOpen(false), 3000);
          return;
        }

        if (status === "failed") {
          setTransactionStatus("failed");
          onTransactionStateChange?.("failed", transactionId);
          setTimeout(() => setIsOpen(false), 2000);
          return;
        }

        pollCount++;
        if (pollCount >= maxPolls) {
          setTransactionStatus("failed");
          onTransactionStateChange?.("timeout", transactionId);
          setTimeout(() => setIsOpen(false), 2000);
          return;
        }

        setTimeout(poll, 5000);
      } catch (error) {
        setTransactionStatus("failed");
        onTransactionStateChange?.("error", transactionId);
        setTimeout(() => setIsOpen(false), 2000);
      }
    };

    poll();
  };

  const resetDialog = (): void => {
    setIsOpen(false);
    setCryptoId("");
    setTransactionStatus(null);
    setIsProcessing(false);
    setPollingCount(0);
  };

  const getStatusIcon = (): JSX.Element | null => {
    switch (transactionStatus) {
      case "creating":
      case "processing":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case "success":
        return <Check className="h-6 w-6 text-green-500" />;
      case "failed":
        return <X className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (): string => {
    switch (transactionStatus) {
      case "creating":
        return "Creating transaction...";
      case "processing":
        return `Processing transaction... (${pollingCount}/60)`;
      case "success":
        return "Payment successful!";
      case "failed":
        return "Payment failed. Please try again.";
      default:
        return "";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Pay Now
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Complete Payment
              </h3>
              <button
                onClick={resetDialog}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!transactionStatus ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crypto ID
                  </label>
                  <input
                    type="text"
                    value={cryptoId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCryptoId(e.target.value)
                    }
                    placeholder="Enter your crypto ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                               placeholder-gray-400 dark:placeholder-gray-500 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  {getStatusIcon()}
                </div>
                <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                  {getStatusText()}
                </p>
                {transactionStatus === "processing" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please wait while we confirm your transaction...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default PaymentButton;
