export default function getButtonComponentById(buttonId: string): string {
  return buttonComponentCode
    .replace("replace_with_your_button_id", buttonId)
    .replace(/api_url/g, process.env.API_URL || "http://localhost:3000");
}

const buttonComponentCode = `// PaymentButton.tsx
"use client";

import React, { useState } from "react";
import { Loader2, Check, X, Shield, Wallet } from "lucide-react";

type TransactionStatus = "creating" | "processing" | "success" | "failed" | null;
type TransactionState = "success" | "failed" | "timeout" | "error";

interface PaymentButtonProps {
  buttonId: string;
  amount: number;
  currency?: string;
  merchantName?: string;
  onTransactionStateChange?: (
    state: TransactionState,
    transactionId: string
  ) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  onTransactionStateChange,
  buttonId,
  amount,
  currency = "USDC",
  merchantName,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [cryptoId, setCryptoId] = useState<string>("");
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pollingCount, setPollingCount] = useState<number>(0);

  const handlePayment = async (): Promise<void> => {
    if (!cryptoId) {
      alert("Please enter your crypt ID");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("creating");

    try {
      const response = await fetch(\`api_url/api/create-transaction\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buttonId,
          cryptoId,
          amount,
          currency,
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
          \`api_url/api/transaction-status/\${transactionId}\`
        );
        const { status }: { status: string } = await response.json();

        setPollingCount(pollCount);
        setTransactionStatus("processing");

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
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case "success":
        return (
          <div className="bg-green-100 rounded-full p-3">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        );
      case "failed":
        return (
          <div className="bg-red-100 rounded-full p-3">
            <X className="h-8 w-8 text-red-600" />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = (): string => {
    switch (transactionStatus) {
      case "creating":
        return "Initializing payment...";
      case "processing":
        return \`Confirming transaction...\`;
      case "success":
        return "Payment successful!";
      case "failed":
        return "Payment failed";
      default:
        return "";
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                   text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 
                   shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Pay {formatAmount(amount)} {currency}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Pay {merchantName}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Secure crypto payment
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetDialog}
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Amount Display */}
            <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 px-6 py-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Amount to pay
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatAmount(amount)}{" "}
                  <span className="text-xl text-gray-600 dark:text-gray-400">
                    {currency}
                  </span>
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {!transactionStatus ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Enter your crypt ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cryptoId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCryptoId(e.target.value)
                        }
                        placeholder="0x1234...abcd or wallet address"
                        className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl 
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                   placeholder-gray-400 dark:placeholder-gray-500 
                                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                   transition-all duration-200 text-lg"
                      />
                    </div>
                    {cryptoId && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            You will pay{" "}
                            <strong>
                              {formatAmount(amount)} {currency}
                            </strong>{" "}
                            from your wallet
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || !cryptoId}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                               disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed
                               text-white py-4 px-6 rounded-xl font-semibold text-lg
                               transition-all duration-200 shadow-lg hover:shadow-xl
                               transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      \`Pay \${formatAmount(amount)} \${currency}\`
                    )}
                  </button>

                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Shield className="h-3 w-3" />
                    <span>Secured by blockchain technology</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-6">
                    {getStatusIcon()}
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    {getStatusText()}
                  </h4>
                  {transactionStatus === "processing" && (
                    <div className="space-y-2">
                      <p className="text-gray-600 dark:text-gray-400">
                        Confirming your payment on the blockchain...
                      </p>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: \`\${Math.min(
                              (pollingCount / 60) * 100,
                              100
                            )}%\`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Step {pollingCount + 1} of 60
                      </p>
                    </div>
                  )}
                  {transactionStatus === "success" && (
                    <div className="space-y-2">
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {formatAmount(amount)} {currency} paid successfully
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Transaction will be confirmed shortly
                      </p>
                    </div>
                  )}
                  {transactionStatus === "failed" && (
                    <div className="space-y-4">
                      <p className="text-red-600 dark:text-red-400">
                        Please try again or contact support
                      </p>
                      <button
                        onClick={resetDialog}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentButton;`;
