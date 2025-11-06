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
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.067 8.478c.492 3.165-.766 5.355-3.795 6.763-1.617.753-3.644 1.139-6.006 1.139h-1.02c-.593 0-1.112.434-1.221 1.021l-.961 5.72a.644.644 0 01-.636.549H3.316a.423.423 0 01-.42-.487l2.924-17.377a.86.86 0 01.848-.716h6.927c2.606 0 4.414.53 5.372 1.576.957 1.046 1.28 2.691.999 4.888-.029.225-.069.446-.119.66l.22-.346z" fill="#003087"/>
                      <path d="M9.296 8.44l-.705 4.206c-.077.46.259.861.73.861h2.158c3.134 0 5.58-1.17 6.478-4.562.718-2.712-.652-4.505-3.876-4.505H9.948c-.398 0-.744.29-.808.683l-.844 3.317z" fill="#0070E0"/>
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
