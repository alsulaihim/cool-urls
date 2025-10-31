'use client';

import React from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Link2, MousePointerClick, Globe, TrendingUp, Users, Zap } from 'lucide-react';

interface OverviewStatsProps {
  urls: any[];
}

export function OverviewStats({ urls }: OverviewStatsProps) {
  // Calculate aggregate statistics
  const totalLinks = urls.length;
  const totalClicks = urls.reduce((sum, url) => sum + (url.clicks || 0), 0);

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

  // Calculate unique visitors
  const uniqueVisitors = new Set(
    allAnalytics.map(click => click.ipHash).filter(Boolean)
  ).size;

  // Calculate unique countries
  const uniqueCountries = new Set(
    allAnalytics.map(click => click.country).filter(Boolean)
  ).size;

  // Calculate average clicks per link
  const avgClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0;

  // Calculate click-through rate (unique vs total)
  const clickThroughRate = totalClicks > 0
    ? Math.round((uniqueVisitors / totalClicks) * 100)
    : 0;

  // Calculate top performing link
  const topLink = urls.reduce((max, url) =>
    (url.clicks || 0) > (max.clicks || 0) ? url : max,
    urls[0] || { clicks: 0 }
  );

  // Calculate recent growth (last 7 days vs previous 7 days)
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const recentClicks = allAnalytics.filter(
    click => click.timestamp && click.timestamp > sevenDaysAgo
  ).length;

  const previousClicks = allAnalytics.filter(
    click => click.timestamp && click.timestamp > fourteenDaysAgo && click.timestamp <= sevenDaysAgo
  ).length;

  const growthRate = previousClicks > 0
    ? Math.round(((recentClicks - previousClicks) / previousClicks) * 100)
    : recentClicks > 0 ? 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      <StatCard
        title="Total Links"
        value={totalLinks}
        icon={Link2}
        iconClassName="text-gray-700"
        iconBgClassName="bg-gray-100"
        description={`${totalLinks} shortened ${totalLinks === 1 ? 'link' : 'links'}`}
      />

      <StatCard
        title="Total Clicks"
        value={totalClicks.toLocaleString()}
        icon={MousePointerClick}
        iconClassName="text-gray-700"
        iconBgClassName="bg-gray-100"
        trend={{
          value: growthRate,
          label: 'vs last 7 days'
        }}
      />

      <StatCard
        title="Unique Visitors"
        value={uniqueVisitors.toLocaleString()}
        icon={Users}
        iconClassName="text-gray-700"
        iconBgClassName="bg-gray-100"
        description={`${clickThroughRate}% unique rate`}
      />

      <StatCard
        title="Global Reach"
        value={uniqueCountries}
        icon={Globe}
        iconClassName="text-gray-700"
        iconBgClassName="bg-gray-100"
        description={`${uniqueCountries} ${uniqueCountries === 1 ? 'country' : 'countries'}`}
      />

      <StatCard
        title="Avg Clicks/Link"
        value={avgClicksPerLink}
        icon={TrendingUp}
        iconClassName="text-gray-700"
        iconBgClassName="bg-gray-100"
        description="Average performance"
      />

      <StatCard
        title="Top Performer"
        value={topLink.clicks || 0}
        icon={Zap}
        iconClassName="text-gray-700"
        iconBgClassName="bg-gray-100"
        description={topLink.shortCode ? `/${topLink.shortCode}` : 'No links yet'}
      />
    </div>
  );
}
