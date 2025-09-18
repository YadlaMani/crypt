"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserButtons } from "@/actions/buttonActions";
import { toast } from "sonner";
import { ButtonType } from "@/types/button";
import { ButtonList } from "@/components/ButtonList";
import { CreateButtonDialog } from "@/components/CreateButtonDialog";

export default function ButtonsPage() {
  const { user, isLoaded } = useUser();
  const [buttons, setButtons] = useState<ButtonType[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchButtons = async () => {
    setLoading(true);
    try {
      if (!user) {
        setButtons([]);
        return;
      }
      const res = await getUserButtons(user.id);
      if (res.success) {
        if (!res.buttons) {
          setButtons([]);
          return;
        }
        setButtons(res?.buttons);
      } else {
        toast.error(res.error || "Failed to fetch buttons");
      }
    } catch (err) {
      console.error("Error fetching buttons:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;

    fetchButtons();
  }, [user, isLoaded]);

  if (!isLoaded) return <p>Loading user...</p>;
  if (!user) return <p>Please sign in to continue.</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payment Buttons</h1>
        <CreateButtonDialog onCreated={() => fetchButtons()} />
      </div>
      <ButtonList buttons={buttons} loading={loading} />
    </div>
  );
}
