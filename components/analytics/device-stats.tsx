'use client';

import { Smartphone, Monitor, Tablet, Globe, MapPin, Wifi, Share2, Languages, Bot, Users, Shield, Clock, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

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
}

interface DeviceStatsProps {
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
 * StatCard component - displays statistics with a title and data list
 */
const StatCard = ({ title, data, icon }: { title: string; data: Array<{ name: string; value: number }>; icon?: React.ReactNode }) => (
  <Card className="p-5 border">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h4 className="font-semibold text-foreground text-base">{title}</h4>
    </div>
    {data.length === 0 ? (
      <p className="text-muted-foreground text-sm">No data</p>
    ) : (
      <div className="space-y-3">
        {data.map((item, idx) => (
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
    )}
  </Card>
);

export function DeviceStats({ clicks }: DeviceStatsProps) {
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
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

  // Specific device colors using corporate palette
  const DEVICE_COLORS: Record<string, string> = {
    'mobile': '#EC4899', // Pink - stands out, most common device
    'desktop': '#000000', // Black - professional and prominent
    'tablet': '#6B7280', // Gray - neutral and distinct
    'unknown': '#9CA3AF', // Light Gray - subtle for unknown
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
                      if (active && payload && payload.length) {
                        const deviceType = payload[0].name.toLowerCase();
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
                        {/* Device-specific color indicator */}
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color, opacity: 0.6 }}
                        />
                        <div className="h-1 w-16 rounded-full overflow-hidden bg-muted">
                          {/* Analytics visualization - dynamic width */}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Top Operating Systems"
          data={osData}
          icon={
            <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Monitor className="w-4 h-4 text-black" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top Browsers"
          data={browserData}
          icon={
            <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Globe className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top Countries"
          data={countryData}
          icon={
            <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
              <MapPin className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top Cities"
          data={cityData}
          icon={
            <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
              <MapPin className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top ISPs"
          data={ispData}
          icon={
            <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
              <Wifi className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top Referrer Apps"
          data={referrerAppData}
          icon={
            <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Share2 className="w-4 h-4 text-black" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top Referrer Domains"
          data={referrerDomainData}
          icon={
            <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Globe className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top Languages"
          data={languageData}
          icon={
            <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
              <Languages className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Traffic Type"
          data={trafficTypeData}
          icon={
            <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Bot className="w-4 h-4 text-black" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Visitor Stats"
          data={uniqueClicksData}
          icon={
            <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Users className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Top Timezones"
          data={timezoneData}
          icon={
            <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
              <Globe className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Network Type"
          data={proxyData}
          icon={
            <div className="w-8 h-8 border border-black/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Shield className="w-4 h-4 text-black" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Clicks by Hour"
          data={hourlyData.filter(h => h.value > 0).slice(0, 5).sort((a, b) => b.value - a.value)}
          icon={
            <div className="w-8 h-8 border border-gray-500/20 rounded-lg flex items-center justify-center bg-gray-50">
              <Clock className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
          }
        />
        <StatCard
          title="Clicks by Day"
          data={dayOfWeekData}
          icon={
            <div className="w-8 h-8 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
              <Calendar className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
            </div>
          }
        />
      </div>
    </div>
  );
}
