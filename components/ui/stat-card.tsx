import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  description?: string;
  iconClassName?: string;
  iconBgClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  iconClassName = 'text-black',
  iconBgClassName = 'bg-black/5',
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  return (
    <Card className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
                {value}
              </h3>
              {trend && (
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  isPositiveTrend ? 'text-green-600' : 'text-red-600'
                )}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {(description || trend?.label) && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {trend?.label || description}
              </p>
            )}
          </div>
          <div className={cn('p-2 sm:p-2.5 rounded-lg shrink-0', iconBgClassName)}>
            <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6', iconClassName)} />
          </div>
        </div>
      </div>
    </Card>
  );
}
