"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getButtonById } from "@/actions/buttonActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  amount: number;
  tokenAddress: string;
  chainId: string;
  merchantAddress: string;
  isActive: boolean;
  transactions: Transaction[];
};

export default function ButtonDetailsPage() {
  const { id } = useParams();
  const [button, setButton] = useState<ButtonType | null>(null);
  const [loading, setLoading] = useState(true);

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
              <span className="font-medium">Amount:</span> {button.amount}
            </p>
            <p>
              <span className="font-medium">Chain ID:</span> {button.chainId}
            </p>
            <p>
              <span className="font-medium">Token:</span> {button.tokenAddress}
            </p>
            <p>
              <span className="font-medium">Merchant:</span>{" "}
              {button.merchantAddress}
            </p>
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
    </div>
  );
}
