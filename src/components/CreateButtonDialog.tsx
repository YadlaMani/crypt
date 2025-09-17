"use client";

import React, { useState } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createButton } from "@/actions/buttonActions";
import { useUser } from "@clerk/nextjs";
import { ButtonType } from "@/types/button";

type CreateButtonDialogProps = {
  onCreated: (button: ButtonType) => void;
};

export function CreateButtonDialog({ onCreated }: CreateButtonDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    tokenAddress: "",
    chainId: "",
    merchantAddress: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      amount: "",
      tokenAddress: "",
      chainId: "",
      merchantAddress: "",
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await createButton({
        name: form.name,
        description: form.description,
        amount: parseFloat(form.amount),
        tokenAddress:
          form.tokenAddress || "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
        chainId: form.chainId,
        merchantAddress: form.merchantAddress,
        userId: user.id,
      });

      if (!res.success) {
        toast.error(res.message || "Failed to create button");
        return;
      }

      onCreated(res.button);
      resetForm();
      setOpen(false);
      toast.success("Button created successfully!");
    } catch (error) {
      console.error("Error creating button:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
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
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
            />
          </div>
          <div>
            <Label>Token Address (optional)</Label>
            <Input
              value={form.tokenAddress}
              onChange={(e) => handleChange("tokenAddress", e.target.value)}
            />
          </div>
          <div>
            <Label>Chain</Label>
            <Select
              onValueChange={(val) => handleChange("chainId", val)}
              value={form.chainId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ethereum Mainnet</SelectItem>
                <SelectItem value="137">Polygon</SelectItem>
                <SelectItem value="42161">Arbitrum</SelectItem>
                <SelectItem value="10">Optimism</SelectItem>
                <SelectItem value="8453">Base</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Merchant Address</Label>
            <Input
              value={form.merchantAddress}
              onChange={(e) => handleChange("merchantAddress", e.target.value)}
            />
          </div>
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
