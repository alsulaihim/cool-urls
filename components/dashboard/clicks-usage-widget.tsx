'use client';

import { motion } from 'framer-motion';
import { MousePointerClick, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { getPlanById, getRemainingClicks, getUsagePercentage } from '@/lib/pricing';
import type { PlanId } from '@/lib/pricing';

interface ClicksUsageWidgetProps {
  clicksUsed: number;
  planId: PlanId;
  compact?: boolean;
}

export function ClicksUsageWidget({ clicksUsed, planId, compact = false }: ClicksUsageWidgetProps) {
  const plan = getPlanById(planId);
  const remaining = getRemainingClicks(clicksUsed, planId);
  const usagePercent = getUsagePercentage(clicksUsed, planId);

  // Determine color based on usage
  const getColorClasses = () => {
    if (usagePercent >= 90) return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      progress: 'bg-red-500',
      badge: 'bg-red-100 text-red-700',
    };
    if (usagePercent >= 75) return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      progress: 'bg-orange-500',
      badge: 'bg-orange-100 text-orange-700',
    };
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      progress: 'bg-green-500',
      badge: 'bg-green-100 text-green-700',
    };
  };

  const colors = getColorClasses();

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${colors.bg} ${colors.border} border rounded-lg p-3 flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-full ${colors.badge} flex items-center justify-center flex-shrink-0`}>
            <MousePointerClick className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-bold ${colors.text}`}>
                {remaining.toLocaleString()}
              </span>
              <span className="text-xs text-gray-600">clicks left</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full ${colors.progress} transition-all duration-500`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>
        <Link
          href="/pricing"
          className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          Upgrade
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${colors.bg} ${colors.border} border rounded-xl p-6`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${colors.badge} flex items-center justify-center`}>
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Monthly Clicks</h3>
            <p className={`text-2xl font-bold ${colors.text} mt-1`}>
              {clicksUsed.toLocaleString()} / {plan.clicksLimit.toLocaleString()}
            </p>
          </div>
        </div>
        <div className={`${colors.badge} px-3 py-1 rounded-full`}>
          <span className="text-xs font-semibold">{plan.name}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Usage</span>
          <span className={`text-sm font-semibold ${colors.text}`}>
            {usagePercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-2.5 rounded-full ${colors.progress}`}
          />
        </div>
      </div>

      {/* Remaining Clicks */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${colors.text}`} />
          <span className="text-sm text-gray-600">Remaining</span>
        </div>
        <span className={`text-lg font-bold ${colors.text}`}>
          {remaining.toLocaleString()} clicks
        </span>
      </div>

      {/* Upgrade Button */}
      {usagePercent >= 75 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/pricing"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            {usagePercent >= 90 ? 'Upgrade Now' : 'Upgrade Plan'}
          </Link>
        </motion.div>
      )}

      {usagePercent < 75 && (
        <Link
          href="/pricing"
          className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-1"
        >
          View Plans
          <TrendingUp className="w-3 h-3" />
        </Link>
      )}
    </motion.div>
  );
}
