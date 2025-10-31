'use client';

import { useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import {
  BarChart3,
  MousePointerClick,
  Link2,
  Users,
  TrendingUp,
  Globe,
  Smartphone
} from 'lucide-react';

/**
 * Admin Analytics Page
 *
 * Shows comprehensive analytics across all URLs
 */
export default function AdminAnalyticsPage() {
  // Query all data
  const { data, isLoading } = db.useQuery({
    urls: {},
    userProfiles: {},
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!data?.urls) return null;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalClicks = data.urls.reduce((sum, url) => sum + (url.clicks || 0), 0);
    const totalUrls = data.urls.length;

    // Get clicks per time period
    let clicksToday = 0;
    let clicksThisWeek = 0;
    let clicksThisMonth = 0;

    // Device and location stats
    const deviceStats: Record<string, number> = {};
    const browserStats: Record<string, number> = {};
    const countryStats: Record<string, number> = {};
    const osStats: Record<string, number> = {};

    data.urls.forEach(url => {
      if (url.analyticsData) {
        try {
          const analytics = JSON.parse(url.analyticsData);
          analytics.forEach((click: any) => {
            const clickTime = click.timestamp;

            if (clickTime >= oneDayAgo) clicksToday++;
            if (clickTime >= oneWeekAgo) clicksThisWeek++;
            if (clickTime >= oneMonthAgo) clicksThisMonth++;

            // Device stats
            if (click.deviceType) {
              deviceStats[click.deviceType] = (deviceStats[click.deviceType] || 0) + 1;
            }

            // Browser stats
            if (click.browser) {
              browserStats[click.browser] = (browserStats[click.browser] || 0) + 1;
            }

            // Country stats
            if (click.country) {
              countryStats[click.country] = (countryStats[click.country] || 0) + 1;
            }

            // OS stats
            if (click.os) {
              osStats[click.os] = (osStats[click.os] || 0) + 1;
            }
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    // Get top performing URLs
    const topUrls = [...data.urls]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 10);

    return {
      totalClicks,
      totalUrls,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      avgClicksPerUrl: totalUrls > 0 ? (totalClicks / totalUrls).toFixed(1) : 0,
      deviceStats: Object.entries(deviceStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      browserStats: Object.entries(browserStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      countryStats: Object.entries(countryStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      osStats: Object.entries(osStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      topUrls,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>
          <Card className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No analytics data available</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">System-wide analytics and statistics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalClicks.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Total Clicks</p>
            <p className="text-xs text-green-600 mt-2">
              +{analytics.clicksToday} today
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalUrls}</p>
            <p className="text-sm text-gray-600 mt-1">Total URLs</p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.avgClicksPerUrl} avg clicks/URL
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.clicksThisWeek.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Clicks This Week</p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.clicksThisMonth.toLocaleString()} this month
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.userProfiles?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Users</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Device Stats */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Top Devices</h3>
            </div>
            <div className="space-y-3">
              {analytics.deviceStats.length === 0 ? (
                <p className="text-sm text-gray-500">No device data</p>
              ) : (
                analytics.deviceStats.map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{device}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Browser Stats */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Top Browsers</h3>
            </div>
            <div className="space-y-3">
              {analytics.browserStats.length === 0 ? (
                <p className="text-sm text-gray-500">No browser data</p>
              ) : (
                analytics.browserStats.map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{browser}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* OS Stats */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Operating Systems</h3>
            </div>
            <div className="space-y-3">
              {analytics.osStats.length === 0 ? (
                <p className="text-sm text-gray-500">No OS data</p>
              ) : (
                analytics.osStats.map(([os, count]) => (
                  <div key={os} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{os}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Country Stats */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Top Countries</h3>
            </div>
            <div className="space-y-3">
              {analytics.countryStats.length === 0 ? (
                <p className="text-sm text-gray-500">No location data</p>
              ) : (
                analytics.countryStats.map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{country}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Top URLs */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing URLs</h3>
          <div className="space-y-3">
            {analytics.topUrls.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No URLs yet</p>
            ) : (
              analytics.topUrls.map((url, index) => (
                <div
                  key={url.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-500 w-6">#{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{url.shortCode}</p>
                      <p className="text-xs text-gray-500 truncate">{url.originalUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{url.clicks || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
