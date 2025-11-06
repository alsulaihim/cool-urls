'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  CreditCard,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Admin Settings Page
 *
 * Allows admins to configure:
 * - Payment provider availability (Stripe/PayPal)
 * - Other app-wide settings
 */
export default function AdminSettingsPage() {
  const { user } = db.useAuth();
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Query app settings
  const { data, isLoading } = db.useQuery({
    appSettings: {},
  });

  // Load current settings
  useEffect(() => {
    if (data?.appSettings) {
      const stripeSetting = data.appSettings.find(s => s.key === 'payment.stripe.enabled');
      const paypalSetting = data.appSettings.find(s => s.key === 'payment.paypal.enabled');

      if (stripeSetting) {
        setStripeEnabled(stripeSetting.value === 'true');
      }
      if (paypalSetting) {
        setPaypalEnabled(paypalSetting.value === 'true');
      }
    }
  }, [data]);

  const handleToggle = (provider: 'stripe' | 'paypal') => {
    if (provider === 'stripe') {
      // Prevent disabling both providers
      if (stripeEnabled && !paypalEnabled) {
        setError('At least one payment provider must be enabled');
        return;
      }
      setStripeEnabled(!stripeEnabled);
    } else {
      // Prevent disabling both providers
      if (paypalEnabled && !stripeEnabled) {
        setError('At least one payment provider must be enabled');
        return;
      }
      setPaypalEnabled(!paypalEnabled);
    }
    setHasChanges(true);
    setError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: [
            {
              key: 'payment.stripe.enabled',
              value: String(stripeEnabled),
            },
            {
              key: 'payment.paypal.enabled',
              value: String(paypalEnabled),
            },
          ],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setSaveSuccess(true);
      setHasChanges(false);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm">Configure app-wide settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className="bg-green-50 border-green-200 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Settings saved successfully!</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Your changes are now live and will affect all new customer checkouts.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-50 border-red-200 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Payment Providers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Providers</h2>
          <p className="text-sm text-gray-600 mb-6">
            Control which payment methods are available to customers during checkout.
            At least one provider must be enabled.
          </p>

          <div className="space-y-4">
            {/* Stripe */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">Stripe</h3>
                      <Badge
                        variant={stripeEnabled ? 'default' : 'secondary'}
                        className={stripeEnabled ? 'bg-green-600' : 'bg-gray-400'}
                      >
                        {stripeEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Credit card payments powered by Stripe
                    </p>
                    {stripeEnabled && (
                      <p className="text-xs text-gray-500 mt-2">
                        Customers will see the &quot;Credit Card&quot; option during checkout
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('stripe')}
                    disabled={saving}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                      ${stripeEnabled ? 'bg-black' : 'bg-gray-300'}
                      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    aria-label={`Toggle Stripe ${stripeEnabled ? 'off' : 'on'}`}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${stripeEnabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </Card>

            {/* PayPal */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79a.773.773 0 0 1 .762-.646h8.236c2.763 0 4.634.577 5.564 1.718 1.064 1.244 1.222 3.084.481 5.628-.083.285-.176.563-.278.833-.743 1.959-2.086 3.513-3.888 4.493-1.545.84-3.52 1.266-5.875 1.266h-1.48c-.533 0-.99.386-1.078.912l-.13.77zm7.788-6.228c1.677 0 3.088-.367 4.195-1.092 1.475-.968 2.46-2.41 3.01-4.41.657-2.388.478-4.223-.54-5.458C20.493 3.039 18.627 2.5 16.001 2.5H7.765c-.313 0-.582.232-.632.544L4.027 20.852a.382.382 0 0 0 .378.444h4.606l.893-5.315zm5.815-11.65c.862.977 1.065 2.54.62 4.774-.054.273-.122.537-.204.79-.596 1.834-1.693 3.283-3.263 4.308-1.417.926-3.193 1.395-5.28 1.395h-1.48c-.267 0-.494.193-.537.456l-.13.77-.352 2.09-.234 1.393a.382.382 0 0 0 .378.444h3.234c.313 0 .582-.232.632-.544l.13-.77.893-5.315h1.48c1.984 0 3.663-.367 4.992-1.092 1.77-1.024 2.924-2.762 3.537-5.318.552-2.308.358-4.096-.566-5.312-1.036-1.364-2.902-2.054-5.542-2.054z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">PayPal</h3>
                      <Badge
                        variant={paypalEnabled ? 'default' : 'secondary'}
                        className={paypalEnabled ? 'bg-green-600' : 'bg-gray-400'}
                      >
                        {paypalEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      PayPal subscription payments
                    </p>
                    {paypalEnabled && (
                      <p className="text-xs text-gray-500 mt-2">
                        Customers will see the &quot;PayPal&quot; option during checkout
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('paypal')}
                    disabled={saving}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                      ${paypalEnabled ? 'bg-black' : 'bg-gray-300'}
                      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    aria-label={`Toggle PayPal ${paypalEnabled ? 'off' : 'on'}`}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${paypalEnabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Unsaved changes
                </Badge>
              </motion.div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Important Information
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Changes take effect immediately for all new customer checkouts</li>
                <li>• Existing active subscriptions are not affected</li>
                <li>• At least one payment provider must remain enabled at all times</li>
                <li>• Customers will only see enabled payment methods</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
