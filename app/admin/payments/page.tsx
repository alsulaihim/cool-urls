'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { PaymentStatusBadge } from '@/components/admin/payment-status-badge';
import { ProviderBadge } from '@/components/admin/provider-badge';
import { PRICING_PLANS } from '@/lib/pricing';

/**
 * Payment Management Page
 *
 * Shows all payments with filtering and search
 */
export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'failed' | 'pending' | 'refunded'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'stripe' | 'paypal'>('all');

  // Query all payments with user data
  const { data, isLoading } = db.useQuery({
    payments: {},
    userProfiles: {},
    subscriptions: {},
  });

  // Calculate metrics and process payments
  const { payments, metrics } = useMemo(() => {
    if (!data) {
      return {
        payments: [],
        metrics: {
          totalPayments: 0,
          successfulPayments: 0,
          failedPayments: 0,
          totalRevenue: 0,
          refundedAmount: 0,
        },
      };
    }

    const pmts = data.payments || [];
    const profiles = data.userProfiles || [];
    const subs = data.subscriptions || [];

    // Map payments with user info
    const enrichedPayments = pmts.map((payment) => {
      const user = profiles.find((p) => p.userId === payment.userId);
      const subscription = subs.find((s) => s.userId === payment.userId);
      const plan = PRICING_PLANS[payment.planId as keyof typeof PRICING_PLANS] || PRICING_PLANS.free;

      return {
        ...payment,
        userName: user?.name || 'Unknown',
        userId: payment.userId,
        planName: plan.name,
        subscriptionId: subscription?.id,
      };
    });

    // Calculate metrics
    const successfulCount = pmts.filter((p) => p.status === 'succeeded').length;
    const failedCount = pmts.filter((p) => p.status === 'failed').length;
    const totalRevenue = pmts
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0) / 100;
    const refundedAmount = pmts
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0) / 100;

    return {
      payments: enrichedPayments,
      metrics: {
        totalPayments: pmts.length,
        successfulPayments: successfulCount,
        failedPayments: failedCount,
        totalRevenue,
        refundedAmount,
      },
    };
  }, [data]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          payment.userName?.toLowerCase().includes(query) ||
          payment.userId?.toLowerCase().includes(query) ||
          payment.providerPaymentId?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.provider === providerFilter);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [payments, searchQuery, statusFilter, providerFilter]);

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
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">Monitor all payment transactions</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalPayments}</p>
            <p className="text-sm text-gray-600 mt-1">Total Payments</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.successfulPayments}</p>
            <p className="text-sm text-gray-600 mt-1">Successful</p>
            <p className="text-xs text-green-600 mt-2">
              {metrics.totalPayments > 0
                ? ((metrics.successfulPayments / metrics.totalPayments) * 100).toFixed(1)
                : 0}% success rate
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.failedPayments}</p>
            <p className="text-sm text-gray-600 mt-1">Failed</p>
            <p className="text-xs text-red-600 mt-2">Requires attention</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-2">
              ${metrics.refundedAmount.toFixed(2)} refunded
            </p>
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
                  placeholder="Search by user, email, or payment ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'succeeded', 'failed', 'pending', 'refunded'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Provider Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'stripe', 'paypal'] as const).map((provider) => (
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

        {/* Payments Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.userName}
                          </div>
                          <div className="text-sm text-gray-500 font-mono">{payment.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.planName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${(payment.amount / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{payment.currency.toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProviderBadge provider={payment.provider} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-gray-500 max-w-xs truncate">
                          {payment.providerPaymentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {payment.subscriptionId ? (
                          <Link
                            href={`/admin/subscriptions/${payment.subscriptionId}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            View Subscription
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/users/${payment.userId}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            View User
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
