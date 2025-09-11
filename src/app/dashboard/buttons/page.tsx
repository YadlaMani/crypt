"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, ExternalLink } from "lucide-react";

interface PaymentButton {
  id: string;
  name: string;
  description?: string;
  amount: string;
  tokenAddress?: string;
  chainId: number;
  merchantAddress: string;
  isActive: boolean;
  createdAt: string;
}

export default function ButtonsPage() {
  const [buttons, setButtons] = useState<PaymentButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchButtons();
  }, []);

  const fetchButtons = async () => {
    try {
      const response = await fetch('/api/buttons');
      if (response.ok) {
        const data = await response.json();
        setButtons(data);
      }
    } catch (error) {
      console.error('Failed to fetch buttons:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyEmbedCode = (buttonId: string) => {
    const embedCode = `<script src="${window.location.origin}/sdk.js" data-button-id="${buttonId}"></script>`;
    navigator.clipboard.writeText(embedCode);
    // You could add a toast notification here
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Buttons</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your payment buttons for crypto transactions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Button
        </Button>
      </div>

      {showCreateForm && (
        <CreateButtonForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchButtons();
          }}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {buttons.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No payment buttons yet
                </h3>
                <p className="text-gray-500 text-center mb-4">
                  Create your first payment button to start accepting crypto payments
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Your First Button
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          buttons.map((button) => (
            <Card key={button.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{button.name}</CardTitle>
                    <CardDescription>{button.description}</CardDescription>
                  </div>
                  <Badge variant={button.isActive ? "default" : "secondary"}>
                    {button.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium">
                      {button.tokenAddress ? "Token" : "ETH"} - {button.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chain</p>
                    <p className="font-medium">
                      {button.chainId === 1 ? "Ethereum" : 
                       button.chainId === 137 ? "Polygon" : 
                       button.chainId === 10 ? "Optimism" :
                       button.chainId === 42161 ? "Arbitrum" :
                       button.chainId === 8453 ? "Base" : `Chain ${button.chainId}`}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyEmbedCode(button.id)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Code
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function CreateButtonForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    tokenAddress: "",
    chainId: 1,
    merchantAddress: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/buttons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error('Failed to create button');
      }
    } catch (error) {
      console.error('Error creating button:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create Payment Button</CardTitle>
        <CardDescription>
          Configure your payment button settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Buy Premium Plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (in ETH or wei)
            </label>
            <input
              type="text"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Address (optional, leave empty for ETH)
            </label>
            <input
              type="text"
              value={formData.tokenAddress}
              onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x... (ERC-20 token address)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blockchain Network
            </label>
            <select
              value={formData.chainId}
              onChange={(e) => setFormData({ ...formData, chainId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Ethereum Mainnet</option>
              <option value={137}>Polygon</option>
              <option value={10}>Optimism</option>
              <option value={42161}>Arbitrum</option>
              <option value={8453}>Base</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Wallet Address (where payments will be sent)
            </label>
            <input
              type="text"
              required
              value={formData.merchantAddress}
              onChange={(e) => setFormData({ ...formData, merchantAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Button"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
