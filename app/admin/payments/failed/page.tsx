'use client';

import { useMemo, useState } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, RotateCcw, ExternalLink, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { ProviderBadge } from '@/components/admin/provider-badge';
import { PRICING_PLANS } from '@/lib/pricing';

/**
 * Failed Payments Monitor
 *
 * Shows all failed payments requiring attention
 */
export default function FailedPaymentsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  const { data, isLoading } = db.useQuery({
    payments: {},
    userProfiles: {},
    subscriptions: {},
  });

  const failedPayments = useMemo(() => {
    if (!data) {
      return {
        recent: [],
        all: [],
        metrics: {
          total: 0,
          last24h: 0,
          last7d: 0,
          last30d: 0,
          totalAmount: 0,
        },
      };
    }

    const payments = data.payments || [];
    const profiles = data.userProfiles || [];
    const subs = data.subscriptions || [];

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all failed payments
    const failed = payments.filter((p) => p.status === 'failed');

    // Enrich with user data
    const enrichedFailed = failed.map((payment) => {
      const user = profiles.find((p) => p.userId === payment.userId);
      const subscription = subs.find((s) => s.userId === payment.userId);
      const plan = PRICING_PLANS[payment.planId as keyof typeof PRICING_PLANS] || PRICING_PLANS.free;

      // Parse metadata for failure reason
      let failureReason = 'Unknown';
      if (payment.metadata) {
        try {
          const meta = JSON.parse(payment.metadata);
          failureReason = meta.failureMessage || 'Unknown';
        } catch (e) {
          // ignore
        }
      }

      const hoursSinceFailure = (now - payment.createdAt) / (1000 * 60 * 60);

      return {
        ...payment,
        userName: user?.name || 'Unknown',
        userId: payment.userId,
        planName: plan.name,
        subscriptionId: subscription?.id,
        subscriptionStatus: subscription?.status,
        failureReason,
        hoursSinceFailure: Math.round(hoursSinceFailure),
        isRecent: payment.createdAt >= oneDayAgo,
      };
    });

    // Sort by most recent first
    enrichedFailed.sort((a, b) => b.createdAt - a.createdAt);

    // Filter by period
    let filtered = enrichedFailed;
    if (selectedPeriod === '24h') {
      filtered = enrichedFailed.filter((p) => p.createdAt >= oneDayAgo);
    } else if (selectedPeriod === '7d') {
      filtered = enrichedFailed.filter((p) => p.createdAt >= sevenDaysAgo);
    } else if (selectedPeriod === '30d') {
      filtered = enrichedFailed.filter((p) => p.createdAt >= thirtyDaysAgo);
    }

    // Calculate metrics
    const metrics = {
      total: failed.length,
      last24h: failed.filter((p) => p.createdAt >= oneDayAgo).length,
      last7d: failed.filter((p) => p.createdAt >= sevenDaysAgo).length,
      last30d: failed.filter((p) => p.createdAt >= thirtyDaysAgo).length,
      totalAmount: failed.reduce((sum, p) => sum + p.amount, 0) / 100,
    };

    return {
      recent: enrichedFailed.filter((p) => p.isRecent),
      all: filtered,
      metrics,
    };
  }, [data, selectedPeriod]);

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
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Failed Payments Monitor</h1>
          </div>
          <p className="text-gray-600 mt-1">Track and resolve failed payment issues</p>
        </div>

        {/* Alert Banner for Recent Failures */}
        {failedPayments.recent.length > 0 && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {failedPayments.recent.length} payment{failedPayments.recent.length > 1 ? 's' : ''} failed in the
                  last 24 hours
                </p>
                <p className="text-xs text-red-700 mt-1">These require immediate attention to prevent churn</p>
              </div>
            </div>
          </Card>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{failedPayments.metrics.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total Failed</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{failedPayments.metrics.last24h}</p>
            <p className="text-sm text-gray-600 mt-1">Last 24 Hours</p>
            <p className="text-xs text-red-600 mt-2">Needs attention</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{failedPayments.metrics.last7d}</p>
            <p className="text-sm text-gray-600 mt-1">Last 7 Days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${failedPayments.metrics.totalAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">Lost Revenue</p>
            <p className="text-xs text-gray-500 mt-2">Potential recovery</p>
          </Card>
        </div>

        {/* Period Filter */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            <div className="flex gap-2">
              {(['24h', '7d', '30d', 'all'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                  size="sm"
                >
                  {period === '24h' && 'Last 24 Hours'}
                  {period === '7d' && 'Last 7 Days'}
                  {period === '30d' && 'Last 30 Days'}
                  {period === 'all' && 'All Time'}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Failed Payments List */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Failed Payments</h2>
            {failedPayments.all.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No failed payments in this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {failedPayments.all.map((payment) => (
                  <div
                    key={payment.id}
                    className={`p-4 rounded-lg border ${
                      payment.isRecent ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-700">
                              {payment.userName[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payment.userName}</p>
                            <p className="text-xs text-gray-500 font-mono">{payment.userId}</p>
                          </div>
                          {payment.isRecent && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">NEW</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-gray-600">Amount</p>
                            <p className="text-sm font-medium text-gray-900">
                              ${(payment.amount / 100).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Plan</p>
                            <p className="text-sm font-medium text-gray-900">{payment.planName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Provider</p>
                            <ProviderBadge provider={payment.provider} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Failed</p>
                            <p className="text-sm font-medium text-gray-900">{payment.hoursSinceFailure}h ago</p>
                          </div>
                        </div>

                        {payment.failureReason && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-700">
                            <span className="font-medium">Reason:</span> {payment.failureReason}
                          </div>
                        )}

                        {payment.subscriptionStatus === 'past_due' && (
                          <div className="mt-2 text-xs text-orange-600 font-medium">
                            ⚠️ Subscription is now past due
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {payment.subscriptionId && (
                          <Link href={`/admin/subscriptions/${payment.subscriptionId}`}>
                            <Button variant="outline" size="sm" className="gap-2 w-full">
                              <ExternalLink className="w-3 h-3" />
                              View Sub
                            </Button>
                          </Link>
                        )}
                        <Link href={`/admin/users/${payment.userId}`}>
                          <Button variant="outline" size="sm" className="gap-2 w-full">
                            <ExternalLink className="w-3 h-3" />
                            View User
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="gap-2 w-full" disabled>
                          <Mail className="w-3 h-3" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
