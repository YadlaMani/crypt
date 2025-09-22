/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTransactionById } from "@/actions/transactionActions";

interface Transaction {
  _id: string;
  from: string;
  to: string;
  signature?: string;
  time: string;
  status: "pending" | "success" | "failed";
  buttonId?: string;
  amountUsd: number;
}

export default function Page() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = async () => {
    setLoading(true);
    const res = await getTransactionById(id as string);
    if (!res) {
      setError("No response from server");
      return;
    }
    if (res.success && res.transaction) {
      setTransaction(res.transaction);
      setError(null);
    } else {
      setTransaction(null);
      setError("Invalid transaction id");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      fetchTransaction();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!transaction) {
    return <div>No transaction data</div>;
  }

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Transaction Details</h1>
      <p>
        <strong>From:</strong> {transaction.from}
      </p>
      <p>
        <strong>To:</strong> {transaction.to}
      </p>
      <p>
        <strong>Amount (USD):</strong> ${transaction.amountUsd}
      </p>
      <p>
        <strong>Status:</strong> {transaction.status}
      </p>
      <p>
        <strong>Time:</strong> {new Date(transaction.time).toLocaleString()}
      </p>
      {transaction.signature && (
        <p>
          <strong>Signature:</strong> {transaction.signature}
        </p>
      )}
    </div>
  );
}
