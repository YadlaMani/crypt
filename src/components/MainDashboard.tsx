"use client";

import React, { useEffect, useState } from "react";
import { getUserTransactions } from "@/actions/transactionActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Transaction {
  _id: string;
  from: string;
  to: string;
  amount: number;
  status: "pending" | "success" | "failed";
  buttonId?: string;
}

interface MainDashboardProps {
  profileId: string;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ profileId }) => {
  const [latestTransaction, setLatestTransaction] =
    useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { transaction } = await getUserTransactions(profileId);
      if (transaction) {
        setLatestTransaction(transaction);
        setOpen(true);
      }
    };

    fetchTransactions();
  }, [profileId]);

  if (!latestTransaction) return <div>Main Dashboard</div>;

  return (
    <div>
      <h1>Main Dashboard</h1>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transaction Alert</DialogTitle>
          </DialogHeader>
          <div className="my-4">
            <p>
              <strong>From:</strong> {latestTransaction.from}
            </p>
            <p>
              <strong>To:</strong> {latestTransaction.to}
            </p>
            <p>
              <strong>Amount:</strong> ${latestTransaction.amount}
            </p>
            <p className="mt-2 text-muted">
              You have a recent transaction pending. Click below to complete the
              payment.
            </p>
          </div>
          <DialogFooter>
            <Button asChild>
              <a
                href={`/pay/${latestTransaction._id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pay Now
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainDashboard;
