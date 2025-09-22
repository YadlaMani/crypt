/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { fetchUserTransactions } from "@/actions/transactionActions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Transaction {
  _id: string;
  from: string;
  to: string;
  amountUsd: number;
  status: "pending" | "success" | "failed";
  buttonId?: string;
  signature?: string;
  time: string;
}

interface HistroyPageProps {
  userId: string;
  initialTransactions: Transaction[];
}

const HistroyPage = ({ userId, initialTransactions }: HistroyPageProps) => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState(initialTransactions.length === 0);
  const [filter, setFilter] = useState<
    "all" | "pending" | "success" | "failed"
  >("all");

  const fetchTxns = async () => {
    setLoading(true);
    try {
      const res = await fetchUserTransactions(userId);
      if (res.success) {
        setTransactions(res.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
    setLoading(false);
  };

  // Optionally refresh transactions on mount
  useEffect(() => {
    if (initialTransactions.length === 0) {
      fetchTxns();
    }
  }, []);

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((txn) => txn.status === filter);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Transactions</h1>
        <Select value={filter} onValueChange={(val) => setFilter(val as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No transactions found.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTransactions.map((txn) => (
            <Card
              key={txn._id}
              className="shadow-sm hover:shadow-md transition"
            >
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-lg font-medium">
                  ${txn.amountUsd}
                </CardTitle>
                <Badge
                  variant={
                    txn.status === "success"
                      ? "default"
                      : txn.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {txn.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">From:</span> {txn.from}
                </p>
                <p>
                  <span className="font-semibold">To:</span> {txn.to}
                </p>
                <p>
                  <span className="font-semibold">Time:</span>{" "}
                  {new Date(txn.time).toLocaleString()}
                </p>
                {txn.status === "success" && txn.signature && (
                  <p className="truncate">
                    <span className="font-semibold">Signature:</span>{" "}
                    {txn.signature}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistroyPage;
