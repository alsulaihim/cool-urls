'use client';

import { useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Pie, PieChart, Cell } from 'recharts';
import {
  BarChart3,
  MousePointerClick,
  Link2,
  Users,
  TrendingUp,
  Globe,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1'];

/**
 * Admin Analytics Page
 *
 * Shows comprehensive analytics across all URLs with charts and visualizations
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
    let clicksYesterday = 0;
    let clicksLastWeek = 0;

    // Daily clicks for last 7 days (for sparkline)
    const dailyClicks: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyClicks[dateKey] = 0;
    }

    // Device and location stats
    const deviceStats: Record<string, number> = {};
    const browserStats: Record<string, number> = {};
    const countryStats: Record<string, number> = {};
    const osStats: Record<string, number> = {};

    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    data.urls.forEach(url => {
      if (url.analyticsData) {
        try {
          const analytics = JSON.parse(url.analyticsData);
          analytics.forEach((click: any) => {
            const clickTime = click.timestamp;

            if (clickTime >= oneDayAgo) clicksToday++;
            if (clickTime >= oneWeekAgo) clicksThisWeek++;
            if (clickTime >= oneMonthAgo) clicksThisMonth++;
            if (clickTime >= twoDaysAgo && clickTime < oneDayAgo) clicksYesterday++;
            if (clickTime >= twoWeeksAgo && clickTime < oneWeekAgo) clicksLastWeek++;

            // Track daily clicks for last 7 days
            const clickDate = new Date(clickTime).toISOString().split('T')[0];
            if (dailyClicks[clickDate] !== undefined) {
              dailyClicks[clickDate]++;
            }

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

    // Calculate growth percentages
    const todayGrowth = clicksYesterday > 0
      ? ((clicksToday - clicksYesterday) / clicksYesterday) * 100
      : clicksToday > 0 ? 100 : 0;

    const weekGrowth = clicksLastWeek > 0
      ? ((clicksThisWeek - clicksLastWeek) / clicksLastWeek) * 100
      : clicksThisWeek > 0 ? 100 : 0;

    // Format data for charts
    const dailyClicksData = Object.entries(dailyClicks).map(([date, clicks]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks,
    }));

    const deviceChartData = Object.entries(deviceStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    const browserChartData = Object.entries(browserStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const countryChartData = Object.entries(countryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    return {
      totalClicks,
      totalUrls,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      todayGrowth,
      weekGrowth,
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
      dailyClicksData,
      deviceChartData,
      browserChartData,
      countryChartData,
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">System-wide analytics and statistics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.clicksToday} clicks today
              </p>
              <div className={`flex items-center gap-1 mt-2 text-xs ${analytics.todayGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.todayGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(analytics.todayGrowth).toFixed(1)}% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUrls}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.avgClicksPerUrl} avg clicks/URL
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.clicksThisWeek.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.clicksThisMonth.toLocaleString()} this month
              </p>
              <div className={`flex items-center gap-1 mt-2 text-xs ${analytics.weekGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.weekGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(analytics.weekGrowth).toFixed(1)}% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.userProfiles?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Clicks Over Time Chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Clicks Over Time</CardTitle>
            <CardDescription>Daily clicks for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <ChartContainer
              config={{
                clicks: {
                  label: "Clicks",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[350px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyClicksData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
              <CardDescription>Clicks by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.deviceChartData.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No device data</p>
              ) : (
                <ChartContainer
                  config={{
                    value: {
                      label: "Clicks",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.deviceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.deviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Browser Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Top Browsers</CardTitle>
              <CardDescription>Most popular browsers</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.browserChartData.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No browser data</p>
              ) : (
                <ChartContainer
                  config={{
                    value: {
                      label: "Clicks",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.browserChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Country Stats */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Clicks by country</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            {analytics.countryChartData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No location data</p>
            ) : (
              <ChartContainer
                config={{
                  value: {
                    label: "Clicks",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[350px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.countryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top URLs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing URLs</CardTitle>
            <CardDescription>URLs with the most clicks</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topUrls.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No URLs yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead className="hidden md:table-cell">Original URL</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topUrls.map((url, index) => (
                    <TableRow key={url.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{url.shortCode}</TableCell>
                      <TableCell className="hidden md:table-cell truncate max-w-md text-sm text-muted-foreground">
                        {url.originalUrl}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {(url.clicks || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Device & OS Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Operating Systems</CardTitle>
              <CardDescription>Breakdown by OS</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.osStats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No OS data</p>
              ) : (
                <div className="space-y-3">
                  {analytics.osStats.map(([os, count], index) => {
                    const percentage = (count / analytics.totalClicks) * 100;
                    return (
                      <div key={os}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{os}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Devices</CardTitle>
              <CardDescription>Breakdown by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.deviceStats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No device data</p>
              ) : (
                <div className="space-y-3">
                  {analytics.deviceStats.map(([device, count], index) => {
                    const percentage = (count / analytics.totalClicks) * 100;
                    return (
                      <div key={device}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">{device}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
