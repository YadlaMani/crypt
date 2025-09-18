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
    amount: string;
    tokenAddress: string;
    chainId: string[];
    merchantAddress: string;
  }>({
    name: "",
    description: "",
    amount: "",
    tokenAddress: "",
    chainId: [],
    merchantAddress: "",
  });

  const handleChange = (key: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      amount: "",
      tokenAddress: "",
      chainId: [],
      merchantAddress: "",
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await createButtonAction({
        name: form.name,
        description: form.description,
        amount: parseFloat(form.amount),
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
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
            />
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
