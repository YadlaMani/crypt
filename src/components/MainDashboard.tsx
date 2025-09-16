"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Save,
  CreditCard,
  Settings,
  BarChart3
} from "lucide-react";

// Types
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

interface Payment {
  id: string;
  buttonId: string;
  amount: string;
  tokenAddress?: string;
  chainId: number;
  merchantAddress: string;
  customerAddress?: string;
  transactionHash?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt?: string;
}

interface MerchantSettings {
  walletAddress?: string;
  webhookUrl?: string;
}

type TabType = 'buttons' | 'payments' | 'settings';

export default function MainDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('buttons');
  
  // Buttons state
  const [buttons, setButtons] = useState<PaymentButton[]>([]);
  const [buttonsLoading, setButtonsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  
  // Settings state
  const [settings, setSettings] = useState<MerchantSettings>({});
  const [saving, setSaving] = useState(false);

  // Fetch data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'buttons':
        fetchButtons();
        break;
      case 'payments':
        fetchPayments();
        break;
      case 'settings':
        fetchSettings();
        break;
    }
  }, [activeTab]);

  // Data fetching functions
  const fetchButtons = async () => {
    try {
      setButtonsLoading(true);
      const response = await fetch('/api/buttons');
      if (response.ok) {
        const data = await response.json();
        setButtons(data);
      }
    } catch (error) {
      console.error('Failed to fetch buttons:', error);
    } finally {
      setButtonsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/merchant/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  // Utility functions
  const copyEmbedCode = (buttonId: string) => {
    const embedCode = `<script src="${window.location.origin}/sdk.js" data-button-id="${buttonId}"></script>`;
    navigator.clipboard.writeText(embedCode);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatAmount = (amount: string, tokenAddress?: string) => {
    if (tokenAddress) {
      return `${amount} Tokens`;
    }
    return `${amount} ETH`;
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 10: return 'Optimism';
      case 42161: return 'Arbitrum';
      case 8453: return 'Base';
      default: return `Chain ${chainId}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getExplorerUrl = (txHash: string, chainId: number) => {
    const explorers = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      10: 'https://optimistic.etherscan.io',
      42161: 'https://arbiscan.io',
      8453: 'https://basescan.org'
    };
    const explorer = explorers[chainId as keyof typeof explorers] || 'https://etherscan.io';
    return `${explorer}/tx/${txHash}`;
  };

  // Settings save handler
  const handleSaveSettings = async (e: React.FormEvent) => {
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

  // Button creation handler
  const handleCreateButton = async (formData: {
    name: string;
    description: string;
    amount: string;
    tokenAddress: string;
    chainId: number;
    merchantAddress: string;
  }) => {
    try {
      const response = await fetch('/api/buttons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchButtons();
      } else {
        throw new Error('Failed to create button');
      }
    } catch (error) {
      console.error('Error creating button:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Crypto Checkout
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('buttons')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'buttons'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4 inline mr-2" />
                  Payment Buttons
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 inline mr-2" />
                  Payments
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Buttons Tab */}
        {activeTab === 'buttons' && (
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
                onSuccess={handleCreateButton}
              />
            )}

            {buttonsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
            ) : (
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
                            <p className="font-medium">{getChainName(button.chainId)}</p>
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
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-600 mt-2">
                  View and track all your crypto payments
                </p>
              </div>
              <Button onClick={fetchPayments} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {paymentsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
            ) : payments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-gray-400 mb-4">
                    <RefreshCw className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No payments yet
                  </h3>
                  <p className="text-gray-500 text-center">
                    Payments will appear here once customers start using your buttons
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              Payment #{payment.id.slice(-8)}
                            </h3>
                            <Badge variant={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Amount</p>
                              <p className="font-medium">
                                {formatAmount(payment.amount, payment.tokenAddress)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Network</p>
                              <p className="font-medium">{getChainName(payment.chainId)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Customer</p>
                              <p className="font-mono text-xs">
                                {payment.customerAddress 
                                  ? `${payment.customerAddress.slice(0, 6)}...${payment.customerAddress.slice(-4)}`
                                  : 'Not connected'
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Date</p>
                              <p className="font-medium">{formatDate(payment.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {payment.transactionHash && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(getExplorerUrl(payment.transactionHash!, payment.chainId), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View TX
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
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
                <form onSubmit={handleSaveSettings} className="space-y-6">
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
        )}
      </main>
    </div>
  );
}

// Create Button Form Component
function CreateButtonForm({ onClose, onSuccess }: { 
  onClose: () => void; 
  onSuccess: (formData: {
    name: string;
    description: string;
    amount: string;
    tokenAddress: string;
    chainId: number;
    merchantAddress: string;
  }) => void;
}) {
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
      await onSuccess(formData);
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
