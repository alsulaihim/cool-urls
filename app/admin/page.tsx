'use client';

import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Users, Link2, MousePointerClick, Activity, DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { PRICING_PLANS } from '@/lib/pricing';

/**
 * Admin Dashboard
 * 
 * Overview page showing key metrics and recent activity
 */
export default function AdminDashboard() {
  // Query all data
  const { data, isLoading } = db.useQuery({
    urls: {},
    userProfiles: {},
    adminUsers: {},
    subscriptions: {},
    payments: {},
    auditLogs: {
      $: {
        limit: 10,
      },
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data) {
      return {
        totalUsers: 0,
        totalUrls: 0,
        totalClicks: 0,
        activeAdmins: 0,
        newUsersToday: 0,
        newUrlsToday: 0,
      };
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalUsers = data.userProfiles?.length || 0;
    const totalUrls = data.urls?.length || 0;
    const totalClicks = data.urls?.reduce((sum, url) => sum + (url.clicks || 0), 0) || 0;
    const activeAdmins = data.adminUsers?.length || 0;

    const newUsersToday = data.userProfiles?.filter(
      (profile) => profile.createdAt >= oneDayAgo
    ).length || 0;

    const newUrlsToday = data.urls?.filter(
      (url) => url.createdAt >= oneDayAgo
    ).length || 0;

    const activeUsers = data.userProfiles?.filter(
      (profile) => {
        // Find user's most recent URL
        const userUrls = data.urls?.filter((url) => url.userId === profile.userId) || [];
        const mostRecentUrl = userUrls.sort((a, b) => b.createdAt - a.createdAt)[0];
        return mostRecentUrl && mostRecentUrl.createdAt >= thirtyDaysAgo;
      }
    ).length || 0;

    // Calculate revenue metrics
    const subscriptions = data.subscriptions || [];
    const payments = data.payments || [];

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const mrr = subscriptions
      .filter(s => s.status === 'active' && s.provider !== 'none')
      .reduce((sum, s) => {
        const plan = PRICING_PLANS[s.planId as keyof typeof PRICING_PLANS];
        return sum + (plan?.price || 0);
      }, 0);

    const totalRevenue = payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + (p.amount / 100), 0);

    const recentPayments = payments.filter(
      p => p.status === 'succeeded' && p.createdAt >= thirtyDaysAgo
    );
    const last30DaysRevenue = recentPayments.reduce((sum, p) => sum + (p.amount / 100), 0);

    return {
      totalUsers,
      totalUrls,
      totalClicks,
      activeAdmins,
      newUsersToday,
      newUrlsToday,
      activeUsers,
      activeSubscriptions,
      mrr,
      totalRevenue,
      last30DaysRevenue,
    };
  }, [data]);

  // Recent activity
  const recentActivity = useMemo(() => {
    if (!data?.auditLogs) return [];

    return data.auditLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your Cool URLs instance</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
              <p className="text-sm text-gray-600 mt-1">Total Users</p>
              <p className="text-xs text-green-600 mt-2">
                +{metrics.newUsersToday} today
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUrls}</p>
              <p className="text-sm text-gray-600 mt-1">Total URLs</p>
              <p className="text-xs text-green-600 mt-2">
                +{metrics.newUrlsToday} today
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalClicks.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Total Clicks</p>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.totalUrls > 0 ? (metrics.totalClicks / metrics.totalUrls).toFixed(1) : 0} avg per URL
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
              <p className="text-sm text-gray-600 mt-1">Active Users</p>
              <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
            </div>
          </Card>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${metrics.mrr.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Monthly Recurring Revenue</p>
              <p className="text-xs text-gray-500 mt-2">
                ${(metrics.mrr * 12).toLocaleString()} annual
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeSubscriptions}</p>
              <p className="text-sm text-gray-600 mt-1">Active Subscriptions</p>
              <p className="text-xs text-gray-500 mt-2">
                Paying customers
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${metrics.last30DaysRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">Revenue (Last 30 Days)</p>
              <p className="text-xs text-gray-500 mt-2">
                ${metrics.totalRevenue.toFixed(2)} all-time
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Admin Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log) => {
                const metadata = JSON.parse(log.metadata || '{}');
                const timeAgo = getTimeAgo(log.timestamp);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {log.adminEmail}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {getActionDescription(log.action, log.targetType, metadata)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function getActionDescription(action: string, targetType: string, metadata: any): string {
  const actionMap: Record<string, string> = {
    'user.suspend': 'Suspended a user',
    'user.unsuspend': 'Unsuspended a user',
    'user.ban': 'Banned a user',
    'user.delete': 'Deleted a user',
    'url.disable': 'Disabled a URL',
    'url.enable': 'Enabled a URL',
    'url.delete': 'Deleted a URL',
    'admin.grant': 'Granted admin access',
    'admin.revoke': 'Revoked admin access',
  };

  return actionMap[action] || `Performed ${action} on ${targetType}`;
}

