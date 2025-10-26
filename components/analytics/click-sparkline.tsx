'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';

interface ClickSparklineProps {
  data: Array<{ timestamp: number }>;
  timeRange?: '24h' | '7d' | '30d';
}

export function ClickSparkline({ data, timeRange = '7d' }: ClickSparklineProps) {
  // Group clicks by time buckets
  const groupedData = () => {
    const now = Date.now();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const bucketSize = {
      '24h': 60 * 60 * 1000, // 1 hour buckets
      '7d': 24 * 60 * 60 * 1000, // 1 day buckets
      '30d': 24 * 60 * 60 * 1000, // 1 day buckets
    }[timeRange];

    const range = ranges[timeRange];
    const startTime = now - range;

    // Filter clicks within time range
    const relevantClicks = data.filter(click => click.timestamp >= startTime);

    // Create buckets
    const buckets = new Map<number, number>();
    const bucketCount = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;

    for (let i = 0; i < bucketCount; i++) {
      const bucketTime = startTime + (i * bucketSize);
      buckets.set(bucketTime, 0);
    }

    // Fill buckets with click counts
    relevantClicks.forEach(click => {
      const bucketTime = Math.floor((click.timestamp - startTime) / bucketSize) * bucketSize + startTime;
      buckets.set(bucketTime, (buckets.get(bucketTime) || 0) + 1);
    });

    // Convert to array format for recharts
    return Array.from(buckets.entries())
      .map(([time, clicks]) => ({
        time,
        clicks,
      }))
      .sort((a, b) => a.time - b.time);
  };

  const chartData = groupedData();
  const maxClicks = Math.max(...chartData.map(d => d.clicks), 1);
  const totalClicks = chartData.reduce((sum, d) => sum + d.clicks, 0);
  const avgClicks = totalClicks / chartData.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#EA580C]/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#EA580C]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
            <p className="text-2xl font-bold text-foreground">{totalClicks}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">Average</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-[#D97706]" strokeWidth={1.5} />
            <p className="text-lg font-semibold text-foreground">{avgClicks.toFixed(1)}</p>
          </div>
        </div>
      </div>
      <div className="w-full h-32 bg-[#D97706]/5 dark:bg-[#D97706]/3 rounded-lg p-2 border border-[#D97706]/20 dark:border-[#EA580C]/20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.2}/>
                <stop offset="50%" stopColor="#EA580C" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const date = new Date(payload[0].payload.time);
                  return (
                    <Card className="bg-background/95 backdrop-blur-sm border border-[#EA580C]/20 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-[#EA580C] rounded-full"></div>
                        <p className="font-semibold text-foreground text-sm">{payload[0].value} clicks</p>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {date.toLocaleDateString()} {timeRange === '24h' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </Card>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#EA580C"
              strokeWidth={2}
              fill="url(#clickGradient)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
