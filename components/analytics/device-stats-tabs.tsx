'use client';

import { useState } from 'react';
import { Smartphone, Monitor, Tablet, Globe, MapPin, Wifi, Share2, Languages, Bot, Users, Shield, Clock, Calendar, Link } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface ClickAnalytics {
  deviceType?: string;
  os?: string;
  browser?: string;
  country?: string;
  city?: string;
  isp?: string;
  org?: string;
  referrerApp?: string;
  referrerDomain?: string;
  language?: string;
  isBot?: boolean;
  ipHash?: string;
  timestamp?: number;
  timezone?: string;
  isProxy?: boolean;
  isMobileConnection?: boolean;
  isHosting?: boolean;
  urlParams?: Record<string, string>;
}

interface DeviceStatsTabsProps {
  clicks: ClickAnalytics[];
}

// Corporate color palette: Black, Gray, and Pink
const COLORS = [
  '#000000', // Pure Black - professional and strong
  '#EC4899', // Pink - corporate accent color
  '#6B7280', // Medium Gray - neutral
  '#9CA3AF', // Light Gray - subtle
  '#1F2937', // Dark Gray - depth
];

/**
 * StatList component - displays statistics data with expand functionality
 */
const StatList = ({
  data,
  icon,
  showViewMore = true,
  defaultLimit = 5
}: {
  data: Array<{ name: string; value: number }>;
  icon?: React.ReactNode;
  showViewMore?: boolean;
  defaultLimit?: number;
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data : data.slice(0, defaultLimit);
  const hasMore = data.length > defaultLimit;

  return (
    <div>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
      ) : (
        <>
          <div className="space-y-3">
            {displayData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Dynamic color indicator - inline styles required for data-driven visualization */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length], opacity: 0.6 }}
                  />
                  <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden w-16 hidden sm:block">
                    {/* Dynamic progress bar - width calculated from analytics data */}
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                        opacity: 0.6
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground ml-2 min-w-[2rem] text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
          {showViewMore && hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                {showAll ? 'Show Less' : `View All (${data.length})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export function DeviceStatsTabs({ clicks }: DeviceStatsTabsProps) {
  // Aggregate device types
  const deviceData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      const device = click.deviceType || 'Unknown';
      counts[device] = (counts[device] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Aggregate OS
  const osData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      const os = click.os || 'Unknown';
      counts[os] = (counts[os] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate browsers
  const browserData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      const browser = click.browser || 'Unknown';
      counts[browser] = (counts[browser] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate countries
  const countryData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      const country = click.country || 'Unknown';
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate cities
  const cityData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.city) {
        const city = `${click.city}${click.country ? ', ' + click.country : ''}`;
        counts[city] = (counts[city] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate ISPs
  const ispData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.isp) {
        const isp = click.isp;
        counts[isp] = (counts[isp] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate referrer apps
  const referrerAppData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.referrerApp) {
        const app = click.referrerApp;
        counts[app] = (counts[app] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate referrer domains
  const referrerDomainData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.referrerDomain) {
        const domain = click.referrerDomain;
        counts[domain] = (counts[domain] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate languages
  const languageData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.language) {
        const lang = click.language;
        counts[lang] = (counts[lang] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Calculate bot vs human traffic
  const trafficTypeData = (() => {
    const botCount = clicks.filter(click => click.isBot).length;
    const humanCount = clicks.length - botCount;
    return [
      { name: 'Human', value: humanCount },
      { name: 'Bot', value: botCount }
    ].filter(item => item.value > 0);
  })();

  // Calculate unique vs total clicks
  const uniqueClicksData = (() => {
    const uniqueIPs = new Set(clicks.map(click => click.ipHash).filter(Boolean));
    return [
      { name: 'Unique Visitors', value: uniqueIPs.size },
      { name: 'Total Clicks', value: clicks.length }
    ];
  })();

  // Aggregate timezones
  const timezoneData = (() => {
    const counts: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.timezone) {
        const tz = click.timezone;
        counts[tz] = (counts[tz] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Calculate proxy vs clean traffic
  const proxyData = (() => {
    const proxyCount = clicks.filter(click => click.isProxy).length;
    const cleanCount = clicks.length - proxyCount;
    return [
      { name: 'Clean', value: cleanCount },
      { name: 'Proxy/VPN', value: proxyCount }
    ].filter(item => item.value > 0);
  })();

  // Calculate hourly click patterns
  const hourlyData = (() => {
    const counts: Record<number, number> = {};
    // Initialize all 24 hours
    for (let i = 0; i < 24; i++) {
      counts[i] = 0;
    }
    // Count clicks per hour
    clicks.forEach(click => {
      if (click.timestamp) {
        const date = new Date(click.timestamp);
        const hour = date.getHours();
        counts[hour] = (counts[hour] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([hour, value]) => ({
        name: `${hour.toString().padStart(2, '0')}:00`,
        value
      }))
      .sort((a, b) => b.value - a.value);
  })();

  // Calculate day of week patterns
  const dayOfWeekData = (() => {
    const counts: Record<string, number> = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0
    };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    clicks.forEach(click => {
      if (click.timestamp) {
        const date = new Date(click.timestamp);
        const dayName = dayNames[date.getDay()];
        counts[dayName] = (counts[dayName] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Aggregate URL parameters
  const urlParamsData = (() => {
    const paramCounts: Record<string, Record<string, number>> = {};

    clicks.forEach(click => {
      if (click.urlParams) {
        Object.entries(click.urlParams).forEach(([key, value]) => {
          if (!paramCounts[key]) {
            paramCounts[key] = {};
          }
          paramCounts[key][value] = (paramCounts[key][value] || 0) + 1;
        });
      }
    });

    // Convert to array format for display
    const result: Array<{ paramName: string; values: Array<{ name: string; value: number }> }> = [];
    Object.entries(paramCounts).forEach(([paramName, valueCounts]) => {
      const values = Object.entries(valueCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      result.push({ paramName, values });
    });

    return result;
  })();

  // Specific device colors using corporate palette
  const DEVICE_COLORS: Record<string, string> = {
    'mobile': '#EC4899',
    'desktop': '#000000',
    'tablet': '#6B7280',
    'unknown': '#9CA3AF',
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile':
        return (
          <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
            <Smartphone className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
          </div>
        );
      case 'tablet':
        return (
          <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
            <Tablet className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
          </div>
        );
      case 'desktop':
        return (
          <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
            <Monitor className="w-4 h-4 text-black" strokeWidth={1.5} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 border border-gray-300/20 rounded-lg flex items-center justify-center bg-gray-50">
            <Monitor className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Device Type Distribution Chart */}
      {deviceData.length > 0 && (
        <Card className="p-4 sm:p-6 border">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border border-pink-500/20 rounded-lg flex items-center justify-center shrink-0 bg-pink-50">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" strokeWidth={1.5} />
            </div>
            <h4 className="font-semibold text-foreground text-base sm:text-lg">Device Distribution</h4>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
            <div className="w-full lg:w-1/2 h-56 sm:h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => {
                      const { name, percent } = entry as unknown as { name: string; percent: number };
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={85}
                    innerRadius={45}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                    paddingAngle={2}
                    animationDuration={600}
                  >
                    {deviceData.map((entry, index) => {
                      const deviceType = entry.name.toLowerCase();
                      const color = DEVICE_COLORS[deviceType] || COLORS[index % COLORS.length];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={color}
                          fillOpacity={0.6}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0]?.name) {
                        const deviceType = String(payload[0].name).toLowerCase();
                        return (
                          <Card className="bg-background/95 backdrop-blur-sm border px-3 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              {deviceType === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-pink-500" strokeWidth={1.5} />}
                              {deviceType === 'tablet' && <Tablet className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />}
                              {deviceType === 'desktop' && <Monitor className="w-3.5 h-3.5 text-black" strokeWidth={1.5} />}
                              <p className="font-semibold text-foreground text-sm">{payload[0].name}</p>
                            </div>
                            <p className="text-muted-foreground text-xs">{payload[0].value} clicks</p>
                          </Card>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-1/2 space-y-3">
              {deviceData.map((item, idx) => {
                const deviceType = item.name.toLowerCase();
                const color = DEVICE_COLORS[deviceType] || COLORS[idx % COLORS.length];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(item.name)}
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color, opacity: 0.6 }}
                        />
                        <div className="h-1 w-16 rounded-full overflow-hidden bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.value / Math.max(...deviceData.map(d => d.value))) * 100}%`,
                              backgroundColor: color,
                              opacity: 0.6
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-foreground min-w-[2.5rem] text-right">{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Tabbed Analytics */}
      <Card className="border">
        <Tabs defaultValue="systems" className="w-full">
          <div className="border-b px-4 sm:px-6 pt-4">
            <TabsList className="w-full grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 h-auto gap-1 sm:gap-2 bg-transparent">
              <TabsTrigger value="systems" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Monitor className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Systems</span>
                <span className="sm:hidden">OS</span>
              </TabsTrigger>
              <TabsTrigger value="browsers" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Browsers</span>
                <span className="sm:hidden">Brow</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Location</span>
                <span className="sm:hidden">Loc</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Network</span>
                <span className="sm:hidden">Net</span>
              </TabsTrigger>
              <TabsTrigger value="referrers" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Referrers</span>
                <span className="sm:hidden">Ref</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Languages className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Language</span>
                <span className="sm:hidden">Lang</span>
              </TabsTrigger>
              <TabsTrigger value="traffic" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Traffic</span>
                <span className="sm:hidden">Traf</span>
              </TabsTrigger>
              <TabsTrigger value="time" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Time</span>
                <span className="sm:hidden">Time</span>
              </TabsTrigger>
              <TabsTrigger value="parameters" className="text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white">
                <Link className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Parameters</span>
                <span className="sm:hidden">Param</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 sm:p-6">
            <TabsContent value="systems" className="mt-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
                  <Monitor className="w-4 h-4 text-black" strokeWidth={1.5} />
                </div>
                <h4 className="font-semibold text-foreground text-base">Top Operating Systems</h4>
              </div>
              <StatList data={osData} />
            </TabsContent>

            <TabsContent value="browsers" className="mt-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
                  <Globe className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                </div>
                <h4 className="font-semibold text-foreground text-base">Top Browsers</h4>
              </div>
              <StatList data={browserData} />
            </TabsContent>

            <TabsContent value="location" className="mt-0 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
                    <MapPin className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Top Countries</h4>
                </div>
                <StatList data={countryData} />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
                    <MapPin className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Top Cities</h4>
                </div>
                <StatList data={cityData} />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
                    <Globe className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Top Timezones</h4>
                </div>
                <StatList data={timezoneData} />
              </div>
            </TabsContent>

            <TabsContent value="network" className="mt-0 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
                    <Wifi className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Top ISPs</h4>
                </div>
                <StatList data={ispData} />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
                    <Shield className="w-4 h-4 text-black" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Network Type</h4>
                </div>
                <StatList data={proxyData} showViewMore={false} />
              </div>
            </TabsContent>

            <TabsContent value="referrers" className="mt-0 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
                    <Share2 className="w-4 h-4 text-black" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Top Referrer Apps</h4>
                </div>
                <StatList data={referrerAppData} />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
                    <Globe className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Top Referrer Domains</h4>
                </div>
                <StatList data={referrerDomainData} />
              </div>
            </TabsContent>

            <TabsContent value="language" className="mt-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
                  <Languages className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
                </div>
                <h4 className="font-semibold text-foreground text-base">Top Languages</h4>
              </div>
              <StatList data={languageData} />
            </TabsContent>

            <TabsContent value="traffic" className="mt-0 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
                    <Bot className="w-4 h-4 text-black" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Traffic Type</h4>
                </div>
                <StatList data={trafficTypeData} showViewMore={false} />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
                    <Users className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Visitor Stats</h4>
                </div>
                <StatList data={uniqueClicksData} showViewMore={false} />
              </div>
            </TabsContent>

            <TabsContent value="time" className="mt-0 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
                    <Clock className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Clicks by Hour</h4>
                </div>
                <StatList data={hourlyData.filter(h => h.value > 0)} defaultLimit={8} />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
                    <Calendar className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">Clicks by Day of Week</h4>
                </div>
                <StatList data={dayOfWeekData} showViewMore={false} />
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="mt-0">
              {urlParamsData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border border-gray-300/20 rounded-lg flex items-center justify-center bg-gray-50 mx-auto mb-3">
                    <Link className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-muted-foreground text-sm">No URL parameters tracked</p>
                  <p className="text-xs text-muted-foreground mt-1">Add ?param=value to your links to track custom parameters</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {urlParamsData.map((param, idx) => (
                    <div key={idx} className={idx > 0 ? "pt-6 border-t" : ""}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
                          <Link className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-base flex items-center gap-2">
                            Parameter: <code className="text-pink-600 bg-pink-50 px-2 py-0.5 rounded text-sm font-mono">{param.paramName}</code>
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {param.values.reduce((sum, v) => sum + v.value, 0)} total clicks
                          </p>
                        </div>
                      </div>
                      <StatList data={param.values} defaultLimit={10} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
