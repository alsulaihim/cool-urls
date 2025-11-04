'use client';

import { useMemo, useState } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  TrendingUp,
  History,
  Settings,
  RefreshCw,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SubscriptionBadge } from '@/components/admin/subscription-badge';
import { ProviderBadge } from '@/components/admin/provider-badge';
import { PaymentStatusBadge } from '@/components/admin/payment-status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PRICING_PLANS } from '@/lib/pricing';

/**
 * Subscription Detail Page
 *
 * Shows detailed information about a specific subscription
 */
export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subscriptionId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);

  // Query subscription data with related info
  const { data, isLoading: queryLoading } = db.useQuery({
    subscriptions: {
      $: {
        where: {
          id: subscriptionId,
        },
      },
    },
    userProfiles: {},
    payments: {},
    urls: {},
  });

  const subscriptionData = useMemo(() => {
    if (!data || !data.subscriptions || data.subscriptions.length === 0) {
      return null;
    }

    const sub = data.subscriptions[0];
    const user = data.userProfiles?.find((p) => p.userId === sub.userId);
    const plan = PRICING_PLANS[sub.planId as keyof typeof PRICING_PLANS] || PRICING_PLANS.free;

    // Get payments for this subscription
    const subPayments = (data.payments || [])
      .filter((p) => p.userId === sub.userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    // Get user's URLs
    const userUrls = (data.urls || [])
      .filter((url) => url.userId === sub.userId);

    // Calculate total revenue from payments
    const totalRevenue = subPayments
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0) / 100; // Convert from cents

    return {
      subscription: sub,
      user,
      plan,
      payments: subPayments,
      urls: userUrls,
      totalRevenue,
    };
  }, [data]);

  const handleCancelSubscription = async () => {
    if (!subscriptionData) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscriptionData.subscription.id,
          reason: 'Cancelled by admin',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (queryLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg" />
                <div className="h-96 bg-gray-200 rounded-lg" />
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded-lg" />
                <div className="h-48 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Not Found</h2>
            <p className="text-gray-600 mb-6">The subscription you're looking for doesn't exist.</p>
            <Link href="/admin/subscriptions">
              <Button>Back to Subscriptions</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const { subscription, user, plan, payments, urls, totalRevenue } = subscriptionData;
  const usagePercent = (subscription.clicksUsed / subscription.clicksLimit) * 100;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subscriptions
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Details</h1>
              <p className="text-gray-600 mt-1">
                {user?.name || 'Unknown User'} • {user?.email || 'N/A'}
              </p>
            </div>
            <div className="flex gap-3">
              <SubscriptionBadge status={subscription.status} />
              <ProviderBadge provider={subscription.provider} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Overview */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600">Plan</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{plan.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Monthly Price</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">${plan.price}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <div className="mt-1">
                    <SubscriptionBadge status={subscription.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Payment Provider</label>
                  <div className="mt-1">
                    <ProviderBadge provider={subscription.provider} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(subscription.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Next Billing</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {subscription.cancelAtPeriodEnd ? (
                      <span className="text-red-600">Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                    ) : (
                      new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    )}
                  </p>
                </div>
              </div>

              {subscription.providerSubscriptionId && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm text-gray-600">Provider Subscription ID</label>
                  <p className="text-sm font-mono text-gray-900 mt-1">{subscription.providerSubscriptionId}</p>
                </div>
              )}
            </Card>

            {/* Usage Statistics */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Clicks Used</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {subscription.clicksUsed.toLocaleString()} / {subscription.clicksLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        usagePercent >= 90
                          ? 'bg-red-600'
                          : usagePercent >= 70
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{usagePercent.toFixed(1)}% of limit used</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">URLs Created</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{urls.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Clicks</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {urls.reduce((sum, url) => sum + (url.clicks || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg. Clicks/URL</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {urls.length > 0
                        ? (urls.reduce((sum, url) => sum + (url.clicks || 0), 0) / urls.length).toFixed(1)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment History */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
              {payments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 10).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          payment.status === 'succeeded' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {payment.status === 'succeeded' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payments Made</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {payments.filter((p) => p.status === 'succeeded').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Since</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(subscription.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Admin Actions</h3>
              <div className="space-y-3">
                <Link href={`/admin/users/${subscription.userId}`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings className="w-4 h-4" />
                    View User Profile
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  disabled
                  title="Reset user's monthly click usage"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Usage
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  disabled
                  title="Change subscription plan"
                >
                  <Settings className="w-4 h-4" />
                  Change Plan
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  disabled
                  title="Add extra clicks to account"
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply Credit
                </Button>

                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isLoading}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Subscription
                      </Button>
                    }
                    title="Cancel Subscription"
                    description="Are you sure you want to cancel this subscription? The user will retain access until the end of their billing period."
                    confirmText="Cancel Subscription"
                    variant="destructive"
                    onConfirm={handleCancelSubscription}
                  />
                )}

                {subscription.cancelAtPeriodEnd && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">
                      This subscription is scheduled to cancel on{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 italic">
                    Note: Admin actions will be logged in audit trail
                  </p>
                </div>
              </div>
            </Card>

            {/* User Link */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">User Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Name</p>
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">User ID</p>
                  <p className="text-xs font-mono text-gray-900 break-all">{subscription.userId}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
