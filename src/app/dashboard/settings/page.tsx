"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface MerchantSettings {
  walletAddress?: string;
  webhookUrl?: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<MerchantSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/merchant/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/merchant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Success feedback
        alert('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and payment settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure your default payment settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <Label htmlFor="walletAddress">Default Wallet Address</Label>
              <Input
                id="walletAddress"
                type="text"
                value={settings.walletAddress || ''}
                onChange={(e) => setSettings({ ...settings, walletAddress: e.target.value })}
                placeholder="0x..."
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                This address will be used as the default recipient for new payment buttons
              </p>
            </div>

            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={settings.webhookUrl || ''}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                placeholder="https://your-site.com/webhook"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                We&apos;ll send payment notifications to this URL
              </p>
            </div>

            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-gray-600 mt-1">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <div>
              <Label>User ID</Label>
              <p className="text-sm text-gray-600 mt-1 font-mono">{user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
