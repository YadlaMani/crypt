"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { editProfileAction, fetchProfileAction } from "@/actions/userActions";

type Profile = {
  _id: string;
  userId: string;
  email: string;
  username: string;
  cryptId: string;
};

export default function ProfileSettings({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetchProfileAction(userId);
        console.log(res);
        if (!res.success) throw new Error("Failed to load profile");
        const data = res.profile;
        setProfile(data);
      } catch (err) {
        toast.error("Failed to fetch profile");
      }
    }
    loadProfile();
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const res = await editProfileAction(profile.userId, {
        username: profile.username,
        cryptId: profile.cryptId,
      });

      if (!res.success) throw new Error("Update failed");

      const updated = res.profile;
      setProfile(updated);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return <p className="text-center text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) =>
                  setProfile((p) => p && { ...p, username: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cryptId">Crypt ID</Label>
              <Input
                id="cryptId"
                value={profile.cryptId}
                onChange={(e) =>
                  setProfile((p) => p && { ...p, cryptId: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
