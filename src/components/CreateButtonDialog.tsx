"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createButton as createButtonAction } from "@/actions/buttonActions";
import { useUser } from "@clerk/nextjs";
import { ButtonType } from "@/types/button";
import { chains } from "@/utils/chain";
import { Checkbox } from "@/components/ui/checkbox";

type CreateButtonDialogProps = {
  onCreated: () => Promise<void>;
};

export function CreateButtonDialog({ onCreated }: CreateButtonDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    amountUsd: string;
    tokenAddress: string;
    chainId: string[];
    merchantAddress: string;
  }>({
    name: "",
    description: "",
    amountUsd: "",
    tokenAddress: "",
    chainId: [],
    merchantAddress: "",
  });

  const [pricePreview, setPricePreview] = useState<Record<string, any>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const handleChange = (key: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      amountUsd: "",
      tokenAddress: "",
      chainId: [],
      merchantAddress: "",
    });
    setPricePreview({});
  };

  // Fetch price preview when USD amount or chains change
  const fetchPricePreview = async () => {
    if (!form.amountUsd || form.chainId.length === 0) {
      console.log('No amount or chains, clearing preview');
      setPricePreview({});
      return;
    }

    const usdAmount = parseFloat(form.amountUsd);
    if (isNaN(usdAmount) || usdAmount <= 0) {
      console.log('Invalid amount, clearing preview');
      setPricePreview({});
      return;
    }

    console.log('Fetching price preview for:', { usdAmount, chains: form.chainId });
    setLoadingPrices(true);
    try {
      const response = await fetch(`/api/prices?amount=${usdAmount}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success && data.data && data.data.conversions) {
        console.log('Setting price preview:', data.data.conversions);
        setPricePreview(data.data.conversions);
      } else {
        console.error('Invalid response structure:', data);
        setPricePreview({});
      }
    } catch (error) {
      console.error('Error fetching price preview:', error);
      setPricePreview({});
    } finally {
      setLoadingPrices(false);
    }
  };

  // Use effect to fetch prices when form changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPricePreview();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [form.amountUsd, form.chainId]);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await createButtonAction({
        name: form.name,
        description: form.description,
        amountUsd: parseFloat(form.amountUsd),
        chainId: form.chainId,
        merchantAddress: form.merchantAddress,
        userId: user.id,
      });

      if (!res.success) {
        toast.error(res.message || "Failed to create button");
        return;
      }
      setOpen(false);
      onCreated();

      resetForm();

      toast.success("Button created successfully!");
    } catch (error) {
      console.error("Error creating button:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChain = (id: string) => {
    handleChange(
      "chainId",
      form.chainId.includes(id)
        ? form.chainId.filter((c) => c !== id)
        : [...form.chainId, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Button</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Payment Button</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
          <div>
            <Label>Amount (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="10.00"
              value={form.amountUsd}
              onChange={(e) => handleChange("amountUsd", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the USD amount customers will pay
            </p>
          </div>

          {/* Chain Selection with Checkbox */}
          <div>
            <Label>Chains</Label>
            <div className="flex flex-col gap-2 mt-2">
              {chains.map((chain) => (
                <label
                  key={chain.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={form.chainId.includes(chain.id)}
                    onCheckedChange={() => toggleChain(chain.id)}
                  />
                  <span>{chain.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Merchant Address</Label>
            <Input
              value={form.merchantAddress}
              onChange={(e) => handleChange("merchantAddress", e.target.value)}
              placeholder="0x..."
            />
          </div>

          {/* Live Price Preview */}
          {form.amountUsd && form.chainId.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-medium">Live Price Preview</Label>
              {loadingPrices ? (
                <div className="mt-2 space-y-2">
                  {form.chainId.map((chainId) => (
                    <div key={chainId} className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 space-y-1 text-sm">
                  {form.chainId.map((chainId) => {
                    const chainName = chains.find(c => c.id === chainId)?.name || chainId;
                    const priceInfo = pricePreview[chainId];
                    
                    return (
                      <div key={chainId} className="flex justify-between">
                        <span>{chainName}:</span>
                        {priceInfo ? (
                          <span className="font-mono">
                            {priceInfo.nativeAmount.toFixed(6)} {priceInfo.tokenSymbol}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Loading...</span>
                        )}
                      </div>
                    );
                  })}
                  <div className="text-xs text-muted-foreground mt-2">
                    💡 Prices update in real-time via Pyth Network
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
