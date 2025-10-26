'use client';

import { Smartphone, Monitor, Tablet, Globe, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ClickAnalytics {
  deviceType?: string;
  os?: string;
  browser?: string;
  country?: string;
  city?: string;
}

interface DeviceStatsProps {
  clicks: ClickAnalytics[];
}

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

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const StatCard = ({ title, data, icon }: { title: string; data: Array<{ name: string; value: number }>; icon?: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm">No data</p>
      ) : (
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm text-gray-700 truncate">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 ml-2">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Device Type Distribution Chart */}
      {deviceData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Device Distribution</h4>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="w-full lg:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-1/2 space-y-3">
              {deviceData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(item.name)}
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Top Operating Systems"
          data={osData}
          icon={<Monitor className="w-4 h-4 text-gray-600" />}
        />
        <StatCard
          title="Top Browsers"
          data={browserData}
          icon={<Globe className="w-4 h-4 text-gray-600" />}
        />
        <StatCard
          title="Top Countries"
          data={countryData}
          icon={<MapPin className="w-4 h-4 text-gray-600" />}
        />
        <StatCard
          title="Top Cities"
          data={cityData}
          icon={<MapPin className="w-4 h-4 text-gray-600" />}
        />
      </div>
    </div>
  );
}
