/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { ButtonType } from "@/types/button";
import { Button } from "./ui/button";
type ButtonListProps = {
  buttons: ButtonType[];
  loading: boolean;
};
import Link from "next/link";

export function ButtonList({ buttons, loading }: ButtonListProps) {
  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 shadow-sm animate-pulse space-y-2"
          >
            <div className="h-4 w-1/3 bg-gray-300 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
            <div className="h-3 w-1/4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (buttons.length === 0) {
    return <p className="text-muted-foreground">No buttons created yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {buttons.map((btn) => (
        <div
          key={btn._id}
          className="border rounded-lg p-4 shadow-sm flex flex-col space-y-2"
        >
          <h2 className="font-medium">{btn.name}</h2>
          <p className="text-sm text-muted-foreground">{btn.description}</p>
          <p className="text-sm">
            Amount: ${(btn.amountUsd || (btn as any).amount || 0).toFixed(2)}{" "}
            USD
          </p>
          <p className="text-sm">Chains: {btn.chainId.length} selected</p>
          <p className="text-sm">Merchant: {btn.merchantAddress}</p>
          <Link href={`/buttons/${btn._id}`}>
            <Button>View</Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
