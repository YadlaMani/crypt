export default function getButtonComponentById(buttonId: string): string {
  return buttonComponentCode.replace("replace_with_your_button_id", buttonId);
}

const buttonComponentCode = `// PaymentButton.tsx
import React, { useState } from 'react';

// Type definitions
type TransactionStatus = 'creating' | 'processing' | 'success' | 'failed' | null;
type TransactionState = 'success' | 'failed' | 'timeout' | 'error';

interface PaymentButtonProps {
  buttonId: string;
  onTransactionStateChange?: (state: TransactionState, transactionId: string) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ buttonId, onTransactionStateChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [cryptoId, setCryptoId] = useState<string>(''); // renamed
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pollingCount, setPollingCount] = useState<number>(0);

  const handlePayment = async (): Promise<void> => {
    if (!cryptoId) {
      alert('Please enter your crypto ID');
      return;
    }

    setIsProcessing(true);
    setTransactionStatus('creating');
    
    try {
      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buttonId,
          cryptoId
        })
      });

      const { transactionId }: { transactionId: string } = await response.json();
      pollTransactionStatus(transactionId);
    } catch (error) {
      setTransactionStatus('failed');
      setTimeout(() => setIsOpen(false), 2000);
    }
  };

  const pollTransactionStatus = async (transactionId: string): Promise<void> => {
    const maxPolls = 60; // 5 minutes
    let pollCount = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(\`/api/transaction-status/\${transactionId}\`);
        const { status }: { status: string } = await response.json();
        
        setPollingCount(pollCount);
        
        if (status === 'completed') {
          setTransactionStatus('success');
          onTransactionStateChange?.('success', transactionId);
          setTimeout(() => setIsOpen(false), 3000);
          return;
        }
        
        if (status === 'failed') {
          setTransactionStatus('failed');
          onTransactionStateChange?.('failed', transactionId);
          setTimeout(() => setIsOpen(false), 2000);
          return;
        }
        
        pollCount++;
        if (pollCount >= 60) {
          setTransactionStatus('failed');
          onTransactionStateChange?.('timeout', transactionId);
          setTimeout(() => setIsOpen(false), 2000);
          return;
        }
        
        setTimeout(poll, 5000);
      } catch (error) {
        setTransactionStatus('failed');
        onTransactionStateChange?.('error', transactionId);
        setTimeout(() => setIsOpen(false), 2000);
      }
    };

    poll();
  };

  const resetDialog = (): void => {
    setIsOpen(false);
    setCryptoId('');
    setTransactionStatus(null);
    setIsProcessing(false);
    setPollingCount(0);
  };

  const getStatusIcon = (): JSX.Element | null => {
    switch (transactionStatus) {
      case 'creating':
      case 'processing':
        return (
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'success':
        return (
          <div className="h-6 w-6 text-green-500">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="h-6 w-6 text-red-500">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = (): string => {
    switch (transactionStatus) {
      case 'creating':
        return 'Creating transaction...';
      case 'processing':
        return \`Processing transaction... (\${pollingCount}/60)\`;
      case 'success':
        return 'Payment successful!';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return '';
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
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Complete Payment</h3>
              <button onClick={resetDialog} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCryptoId(e.target.value)}
                    placeholder="Enter your crypto ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                               placeholder-gray-400 dark:placeholder-gray-500 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  {getStatusIcon()}
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{getStatusText()}</p>
                {transactionStatus === 'processing' && (
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

// Usage:
// <PaymentButton 
//   buttonId="replace_with_your_button_id" 
//   onTransactionStateChange={(state: TransactionState, transactionId: string) => {
//     console.log('Transaction state:', state, transactionId);
//   }} 
// />

export default PaymentButton;`;
