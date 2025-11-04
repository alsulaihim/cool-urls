'use client';

import { useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Download,
  BarChart3,
} from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricing';

/**
 * Revenue Analytics Page
 *
 * Comprehensive revenue analytics and metrics
 */
export default function RevenueAnalyticsPage() {
  const { data, isLoading } = db.useQuery({
    subscriptions: {},
    payments: {},
    userProfiles: {},
  });

  const analytics = useMemo(() => {
    if (!data) {
      return null;
    }

    const subscriptions = data.subscriptions || [];
    const payments = data.payments || [];
    const users = data.userProfiles || [];

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    // MRR calculation
    const mrr = subscriptions
      .filter((s) => s.status === 'active' && s.provider !== 'none')
      .reduce((sum, s) => {
        const plan = PRICING_PLANS[s.planId as keyof typeof PRICING_PLANS];
        return sum + (plan?.price || 0);
      }, 0);

    // ARR calculation
    const arr = mrr * 12;

    // Total revenue
    const successfulPayments = payments.filter((p) => p.status === 'succeeded');
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0) / 100;

    // Last 30 days revenue
    const last30DaysPayments = successfulPayments.filter((p) => p.createdAt >= thirtyDaysAgo);
    const last30DaysRevenue = last30DaysPayments.reduce((sum, p) => sum + p.amount, 0) / 100;

    // Previous 30 days revenue (30-60 days ago)
    const previous30DaysPayments = successfulPayments.filter(
      (p) => p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo
    );
    const previous30DaysRevenue = previous30DaysPayments.reduce((sum, p) => sum + p.amount, 0) / 100;

    // Revenue growth
    const revenueGrowth =
      previous30DaysRevenue > 0
        ? ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100
        : 0;

    // ARPU (Average Revenue Per User)
    const payingCustomers = subscriptions.filter((s) => s.provider !== 'none').length;
    const arpu = payingCustomers > 0 ? mrr / payingCustomers : 0;

    // Revenue by plan
    const revenueByPlan: Record<string, number> = {};
    subscriptions
      .filter((s) => s.status === 'active' && s.provider !== 'none')
      .forEach((s) => {
        const plan = PRICING_PLANS[s.planId as keyof typeof PRICING_PLANS];
        if (plan) {
          revenueByPlan[plan.name] = (revenueByPlan[plan.name] || 0) + plan.price;
        }
      });

    // Revenue by provider
    const stripeRevenue = successfulPayments
      .filter((p) => p.provider === 'stripe')
      .reduce((sum, p) => sum + p.amount, 0) / 100;
    const paypalRevenue = successfulPayments
      .filter((p) => p.provider === 'paypal')
      .reduce((sum, p) => sum + p.amount, 0) / 100;

    // Customer metrics
    const totalCustomers = users.length;
    const payingCustomersCount = payingCustomers;
    const conversionRate = totalCustomers > 0 ? (payingCustomersCount / totalCustomers) * 100 : 0;

    // LTV estimation (simple: average subscription duration * MRR per customer)
    const avgSubscriptionAgeMonths = subscriptions
      .filter((s) => s.provider !== 'none')
      .reduce((sum, s) => {
        const ageMonths = (now - s.createdAt) / (30 * 24 * 60 * 60 * 1000);
        return sum + ageMonths;
      }, 0) / (payingCustomersCount || 1);

    const estimatedLTV = arpu * Math.max(avgSubscriptionAgeMonths, 3); // At least 3 months

    // Churn metrics
    const cancelledThisMonth = subscriptions.filter(
      (s) => s.status === 'cancelled' && s.cancelledAt && s.cancelledAt >= thirtyDaysAgo
    ).length;
    const activeLastMonth = subscriptions.filter(
      (s) => s.createdAt < thirtyDaysAgo
    ).length;
    const churnRate = activeLastMonth > 0 ? (cancelledThisMonth / activeLastMonth) * 100 : 0;

    return {
      mrr,
      arr,
      totalRevenue,
      last30DaysRevenue,
      previous30DaysRevenue,
      revenueGrowth,
      arpu,
      revenueByPlan: Object.entries(revenueByPlan).sort(([, a], [, b]) => b - a),
      stripeRevenue,
      paypalRevenue,
      totalCustomers,
      payingCustomers: payingCustomersCount,
      conversionRate,
      estimatedLTV,
      churnRate,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Revenue Analytics</h1>
          <Card className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No revenue data available</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive revenue insights and metrics</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              {analytics.revenueGrowth >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">${analytics.mrr.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Monthly Recurring Revenue</p>
            <p className={`text-xs mt-2 ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.revenueGrowth >= 0 ? '+' : ''}
              {analytics.revenueGrowth.toFixed(1)}% vs last month
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">${analytics.arr.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Annual Recurring Revenue</p>
            <p className="text-xs text-gray-500 mt-2">Projected annual</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">${analytics.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">${analytics.arpu.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">Average Revenue Per User</p>
            <p className="text-xs text-gray-500 mt-2">Monthly ARPU</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">${analytics.estimatedLTV.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">Estimated Lifetime Value</p>
            <p className="text-xs text-gray-500 mt-2">Per customer</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.conversionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.payingCustomers} of {analytics.totalCustomers} users
            </p>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue by Plan */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
            <div className="space-y-4">
              {analytics.revenueByPlan.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No plan revenue data</p>
              ) : (
                analytics.revenueByPlan.map(([planName, revenue]) => {
                  const percentage = (revenue / analytics.mrr) * 100;
                  return (
                    <div key={planName}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{planName}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          ${revenue.toFixed(2)}/mo
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of MRR</p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Revenue by Provider */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Provider</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">Stripe</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${analytics.stripeRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${((analytics.stripeRevenue / analytics.totalRevenue) * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((analytics.stripeRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">PayPal</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${analytics.paypalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${((analytics.paypalRevenue / analytics.totalRevenue) * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((analytics.paypalRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Revenue */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Last 30 Days Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${analytics.last30DaysRevenue.toFixed(2)}
                  </p>
                </div>
                <div className={`text-right ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenueGrowth >= 0 ? (
                    <TrendingUp className="w-8 h-8" />
                  ) : (
                    <TrendingDown className="w-8 h-8" />
                  )}
                  <p className="text-sm font-semibold mt-1">
                    {analytics.revenueGrowth >= 0 ? '+' : ''}
                    {analytics.revenueGrowth.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Previous 30 Days</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    ${analytics.previous30DaysRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Health Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Metrics</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.churnRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Monthly churn</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Customer Metrics</p>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {analytics.payingCustomers} paying
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.totalCustomers - analytics.payingCustomers} free
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {analytics.conversionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">conversion</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
