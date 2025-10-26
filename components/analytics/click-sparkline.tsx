'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

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

  return (
    <div className="w-full h-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const date = new Date(payload[0].payload.time);
                return (
                  <div className="bg-black text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                    <p className="font-semibold">{payload[0].value} clicks</p>
                    <p className="text-gray-300">
                      {date.toLocaleDateString()} {timeRange === '24h' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#clickGradient)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
