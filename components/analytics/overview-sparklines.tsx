'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { TrendingUp, Users, Globe } from 'lucide-react';

interface OverviewSparklinesProps {
  urls: any[];
}

interface DailyData {
  date: string;
  clicks: number;
  visitors: number;
  countries: number;
}

export function OverviewSparklines({ urls }: OverviewSparklinesProps) {
  // Get all analytics data
  const allAnalytics = urls.flatMap(url => {
    try {
      if (url.analyticsData) {
        return JSON.parse(url.analyticsData);
      }
    } catch (e) {
      console.error('Error parsing analytics:', e);
    }
    return [];
  });

  // Group data by day for the last 30 days
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Create daily buckets
  const dailyMap = new Map<string, DailyData>();

  // Initialize last 30 days with zero values
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    dailyMap.set(dateKey, {
      date: dateKey,
      clicks: 0,
      visitors: 0,
      countries: 0,
    });
  }

  // Aggregate analytics by day
  allAnalytics.forEach(click => {
    if (!click.timestamp || click.timestamp < thirtyDaysAgo) return;

    const date = new Date(click.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (dailyMap.has(dateKey)) {
      const data = dailyMap.get(dateKey)!;
      data.clicks += 1;
    }
  });

  // Calculate unique visitors and countries per day
  const visitorsByDay = new Map<string, Set<string>>();
  const countriesByDay = new Map<string, Set<string>>();

  allAnalytics.forEach(click => {
    if (!click.timestamp || click.timestamp < thirtyDaysAgo) return;

    const date = new Date(click.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (!visitorsByDay.has(dateKey)) {
      visitorsByDay.set(dateKey, new Set());
    }
    if (!countriesByDay.has(dateKey)) {
      countriesByDay.set(dateKey, new Set());
    }

    if (click.ipHash) {
      visitorsByDay.get(dateKey)!.add(click.ipHash);
    }
    if (click.country) {
      countriesByDay.get(dateKey)!.add(click.country);
    }
  });

  // Update daily data with unique counts
  dailyMap.forEach((data, dateKey) => {
    data.visitors = visitorsByDay.get(dateKey)?.size || 0;
    data.countries = countriesByDay.get(dateKey)?.size || 0;
  });

  const chartData = Array.from(dailyMap.values());

  // Calculate totals
  const totalClicks = chartData.reduce((sum, d) => sum + d.clicks, 0);
  const totalVisitors = new Set(allAnalytics.map(c => c.ipHash).filter(Boolean)).size;
  const totalCountries = new Set(allAnalytics.map(c => c.country).filter(Boolean)).size;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold text-foreground mb-2">{formattedDate}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-muted-foreground">Clicks:</span>
              <span className="font-medium text-foreground">{data.clicks}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-black" />
              <span className="text-muted-foreground">Visitors:</span>
              <span className="font-medium text-foreground">{data.visitors}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Countries:</span>
              <span className="font-medium text-foreground">{data.countries}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="rounded-xl border shadow-sm p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Activity Trends</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">Last 30 days performance overview</p>
      </div>

      {/* Metric Cards on Top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Total Clicks */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="p-1.5 sm:p-2 rounded-md bg-gray-100">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Total Clicks</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="p-1.5 sm:p-2 rounded-md bg-gray-100">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Unique Visitors</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalVisitors.toLocaleString()}</p>
          </div>
        </div>

        {/* Global Reach */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="p-1.5 sm:p-2 rounded-md bg-gray-100">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Global Reach</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalCountries}</p>
          </div>
        </div>
      </div>

      {/* Single Combined Chart */}
      <div className="mt-2">
        <ResponsiveContainer width="100%" height={160} className="sm:h-[200px]">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Tooltip content={<CustomTooltip />} />
            <YAxis hide />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#ec4899"
              strokeWidth={2.5}
              dot={false}
              animationDuration={500}
            />
            <Line
              type="monotone"
              dataKey="visitors"
              stroke="#000000"
              strokeWidth={2.5}
              dot={false}
              animationDuration={500}
            />
            <Line
              type="monotone"
              dataKey="countries"
              stroke="#9ca3af"
              strokeWidth={2.5}
              dot={false}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
        <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 sm:w-3 h-0.5 bg-pink-500" />
            <span className="text-muted-foreground">Clicks</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 sm:w-3 h-0.5 bg-black" />
            <span className="text-muted-foreground">Visitors</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 sm:w-3 h-0.5 bg-gray-400" />
            <span className="text-muted-foreground">Countries</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
