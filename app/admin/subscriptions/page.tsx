'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionBadge, SubscriptionStatus } from '@/components/admin/subscription-badge';
import { ProviderBadge } from '@/components/admin/provider-badge';
import { PRICING_PLANS } from '@/lib/pricing';

type PaymentProvider = 'stripe' | 'paypal' | 'none';

function normalizeStatus(status: unknown): SubscriptionStatus {
  if (status === 'active' || status === 'cancelled' || status === 'past_due' || status === 'expired' || status === 'trialing') {
    return status;
  }
  return 'active';
}

function normalizeProvider(provider: unknown): PaymentProvider {
  return provider === 'stripe' || provider === 'paypal' ? provider : 'none';
}

/**
 * Subscription Management Dashboard
 *
 * Shows all subscriptions with filtering, search, and key metrics
 */
export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'past_due' | 'expired'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'stripe' | 'paypal' | 'none'>('all');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all subscriptions via admin API (bypasses client permissions)
  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/subscriptions');
        if (!response.ok) {
          throw new Error('Failed to fetch subscriptions');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  // Calculate metrics and process subscriptions
  const { subscriptions, metrics } = useMemo(() => {
    if (!data) {
      return {
        subscriptions: [],
        metrics: {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          mrr: 0,
          churnRate: 0,
          stripeCount: 0,
          paypalCount: 0,
          pastDueCount: 0,
        },
      };
    }

    const subs = data.subscriptions || [];
    const profiles = data.userProfiles || [];

    // Map subscriptions with user info
    const enrichedSubs = subs.map((sub) => {
      const user = profiles.find((p) => p.userId === sub.userId);
      const plan = PRICING_PLANS[sub.planId as keyof typeof PRICING_PLANS] || PRICING_PLANS.free;

      return {
        ...sub,
        userName: user?.name || 'Unknown',
        planName: plan.name,
        monthlyRevenue: plan.price,
      };
    });

    // Calculate metrics
    const activeCount = subs.filter(s => s.status === 'active').length;
    const mrr = subs
      .filter(s => s.status === 'active' && s.provider !== 'none')
      .reduce((sum, s) => {
        const plan = PRICING_PLANS[s.planId as keyof typeof PRICING_PLANS];
        return sum + (plan?.price || 0);
      }, 0);

    const stripeCount = subs.filter(s => s.provider === 'stripe').length;
    const paypalCount = subs.filter(s => s.provider === 'paypal').length;
    const pastDueCount = subs.filter(s => s.status === 'past_due').length;

    // Simple churn calculation (cancelled in last 30 days / total)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentCancellations = subs.filter(
      s => s.status === 'cancelled' && s.cancelledAt && s.cancelledAt >= thirtyDaysAgo
    ).length;
    const churnRate = subs.length > 0 ? (recentCancellations / subs.length) * 100 : 0;

    return {
      subscriptions: enrichedSubs,
      metrics: {
        totalSubscriptions: subs.length,
        activeSubscriptions: activeCount,
        mrr,
        churnRate,
        stripeCount,
        paypalCount,
        pastDueCount,
      },
    };
  }, [data]);

  // Apply filters
  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.userName?.toLowerCase().includes(query) ||
          sub.userId?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.provider === providerFilter);
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [subscriptions, searchQuery, statusFilter, providerFilter]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all customer subscriptions</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.activeSubscriptions}</p>
            <p className="text-sm text-gray-600 mt-1">Active Subscriptions</p>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.totalSubscriptions} total
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${metrics.mrr.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Monthly Recurring Revenue</p>
            <p className="text-xs text-gray-500 mt-2">
              ${(metrics.mrr * 12).toLocaleString()} annual
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.churnRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">Churn Rate</p>
            <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.pastDueCount}</p>
            <p className="text-sm text-gray-600 mt-1">Past Due</p>
            <p className="text-xs text-red-600 mt-2">Requires attention</p>
          </Card>
        </div>

        {/* Provider Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stripe</p>
                <p className="text-xl font-bold text-gray-900">{metrics.stripeCount}</p>
              </div>
              <ProviderBadge provider="stripe" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">PayPal</p>
                <p className="text-xl font-bold text-gray-900">{metrics.paypalCount}</p>
              </div>
              <ProviderBadge provider="paypal" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Free Plan</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics.totalSubscriptions - metrics.stripeCount - metrics.paypalCount}
                </p>
              </div>
              <ProviderBadge provider="none" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by user name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'cancelled', 'past_due', 'expired'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </Button>
              ))}
            </div>

            {/* Provider Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'stripe', 'paypal', 'none'] as const).map((provider) => (
                <Button
                  key={provider}
                  variant={providerFilter === provider ? 'default' : 'outline'}
                  onClick={() => setProviderFilter(provider)}
                  size="sm"
                >
                  {provider === 'all' ? 'All Providers' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Button>
              ))}
            </div>

            {/* Export */}
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const usagePercent = (sub.clicksUsed / sub.clicksLimit) * 100;

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sub.userName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{sub.planName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <SubscriptionBadge status={normalizeStatus(sub.status)} />
                        </td>
                        <td className="px-6 py-4">
                          <ProviderBadge provider={normalizeProvider(sub.provider)} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            ${sub.monthlyRevenue}/mo
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {sub.clicksUsed.toLocaleString()} / {sub.clicksLimit.toLocaleString()}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                usagePercent >= 90 ? 'bg-red-600' : usagePercent >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {sub.cancelAtPeriodEnd ? (
                            <span className="text-red-600">Cancelling</span>
                          ) : (
                            new Date(sub.currentPeriodEnd).toLocaleDateString()
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/subscriptions/${sub.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
