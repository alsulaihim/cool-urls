'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
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
          <div className="w-10 h-10 border border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-50">
            <Activity className="w-5 h-5 text-pink-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
            <p className="text-2xl font-bold text-foreground">{totalClicks}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">Average</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
            <p className="text-lg font-semibold text-foreground">{avgClicks.toFixed(1)}</p>
          </div>
        </div>
      </div>
      <div className="w-full h-64 bg-pink-50 rounded-lg p-4 border border-pink-200">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                <stop offset="50%" stopColor="#EC4899" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#EC4899" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#FFC0CB" opacity={0.3} />
            <XAxis
              dataKey="time"
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                if (timeRange === '24h') {
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              }}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              stroke="#D1D5DB"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11 }}
              stroke="#D1D5DB"
              label={{ value: 'Clicks', angle: -90, position: 'insideLeft', style: { fill: '#6B7280', fontSize: 12 } }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const date = new Date(payload[0].payload.time);
                  return (
                    <Card className="bg-background/95 backdrop-blur-sm border border-pink-200 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
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
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px' }}
              formatter={() => 'Clicks'}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#EC4899"
              strokeWidth={2}
              fill="url(#clickGradient)"
              animationDuration={800}
              name="Clicks"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
