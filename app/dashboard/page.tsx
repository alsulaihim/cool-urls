'use client';

import React, { useState } from 'react';
import { db } from '@/lib/instant';
import { AuthHeader } from '@/components/auth/auth-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, MousePointerClick, Calendar, Copy, CheckCircle2, Trash2, ExternalLink, Plus, LogOut, ChevronDown, ChevronUp, BarChart3, LayoutDashboard, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/lib/useUserProfile';
import { ClickSparkline } from '@/components/analytics/click-sparkline';
import { ClickMap } from '@/components/analytics/click-map';
import { DeviceStats } from '@/components/analytics/device-stats';
import { LinksTable } from '@/components/analytics/links-table';
import { OverviewSparklines } from '@/components/analytics/overview-sparklines';
import { useSubscription } from '@/lib/useSubscription';
import { ClicksUsageWidget } from '@/components/dashboard/clicks-usage-widget';

export default function Dashboard() {
  const { user, isLoading } = db.useAuth();
  const router = useRouter();
  const { profile } = useUserProfile(user?.id);
  const { subscription } = useSubscription(user?.id);

  // Query URLs - analytics are stored within each URL
  const { data, isLoading: urlsLoading } = db.useQuery({
    urls: {},
  });

  // Debug: Log the queried data
  console.log('[Dashboard] Query data:', data);
  console.log('[Dashboard] URLs:', data?.urls);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Filter URLs for the current user client-side
  const allUrls = data?.urls || [];
  const urls = user ? allUrls.filter((url) => url.userId === user.id) : [];

  const totalClicks = urls.reduce((sum: number, url: any) => sum + (url.clicks || 0), 0);
  const totalLinks = urls.length;

  // Get user's display name (from profile or email)
  const getDisplayName = (): string => {
    // Use profile name if available
    if (profile?.name) {
      return profile.name;
    }

    // Fall back to extracting from email
    if (!user?.email) return 'User';

    const username = user.email.split('@')[0];
    const parts = username.split(/[._-]/);
    const firstName = parts[0];

    return firstName.charAt(0).toUpperCase() + firstName.slice(1);
  };

  const copyToClipboard = (shortCode: string, id: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/${shortCode}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = () => {
    db.auth.signOut();
    router.push('/');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    setDeletingId(id);
    try {
      await db.transact(db.tx.urls[id].delete());
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete link. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedLinkId(expandedLinkId === id ? null : id);
  };

  const getAnalyticsForUrl = (url: any) => {
    console.log('[Dashboard] Getting analytics for URL:', url.id);
    console.log('[Dashboard] Raw analyticsData:', url.analyticsData);

    try {
      if (url.analyticsData) {
        const parsed = JSON.parse(url.analyticsData);
        console.log('[Dashboard] Parsed analytics:', parsed);
        return parsed;
      }
    } catch (e) {
      console.error('[Dashboard] Error parsing analytics:', e);
    }

    console.log('[Dashboard] No analytics data found');
    return [];
  };

  if (isLoading || urlsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <AuthHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-10 bg-gray-200 rounded w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
              </div>
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <AuthHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-black mb-4">Sign in to view your dashboard</h1>
            <p className="text-gray-600 mb-8">
              Track your links, view statistics, and manage your shortened URLs
            </p>
            <Link href="/">
              <Button className="bg-black text-white hover:bg-gray-800">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />

      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white pointer-events-none" />

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-6 sm:py-12 md:py-16">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-10 md:mb-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-2">
                  Welcome back, {getDisplayName()}! 👋
                </h1>
                <p className="text-sm sm:text-base text-gray-500">
                  Manage your shortened links and view analytics
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/">
                  <Button className="bg-black text-white hover:bg-gray-800 h-11 px-6 flex-shrink-0 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Link
                  </Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 h-11 px-6 flex-shrink-0 w-full sm:w-auto"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Clicks Usage Widget */}
            {subscription && (
              <ClicksUsageWidget
                clicksUsed={subscription.clicksUsed}
                planId={subscription.planId}
                compact={true}
              />
            )}
          </motion.div>

          {/* Enhanced Stats with Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Links
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Activity Trends with All Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <OverviewSparklines urls={urls} />
              </motion.div>

              {/* Section Separator */}
              <Separator className="my-6" />

              {/* Links Performance Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black">Link Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed analytics for all your shortened links
                  </p>
                </div>
                <LinksTable
                  urls={urls}
                  onCopy={copyToClipboard}
                  copiedId={copiedId}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="links" className="space-y-6">
              {/* Links Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-black">Your Links</h2>
              </div>

              {urls.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Link2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 mb-2 text-sm sm:text-base">No links yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 px-4">
                    Create your first shortened link to get started
                  </p>
                  <Link href="/">
                    <Button className="bg-black text-white hover:bg-gray-800 text-sm sm:text-base">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Link
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop Table View - Hidden on mobile */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Short Link
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clicks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {urls.map((url) => {
                        const urlAnalytics = getAnalyticsForUrl(url);
                        const isExpanded = expandedLinkId === url.id;

                        return (
                          <React.Fragment key={url.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-mono text-black">
                                    {url.shortCode}
                                  </code>
                                  <a
                                    href={`/${url.shortCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-black transition-colors"
                                    aria-label={`Open short URL ${url.shortCode} in new tab`}
                                    title={`Open short URL ${url.shortCode} in new tab`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="max-w-xs truncate text-sm text-gray-600">
                                  {url.originalUrl}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-black">
                                    {url.clicks || 0}
                                  </span>
                                  {url.clicks > 0 && (
                                    <Button
                                      onClick={() => toggleExpanded(url.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-black"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(url.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    onClick={() => copyToClipboard(url.shortCode, url.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-black hover:bg-gray-100"
                                  >
                                    {copiedId === url.id ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4 mr-1" />
                                        Copy
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => handleDelete(url.id)}
                                    variant="ghost"
                                    size="sm"
                                    disabled={deletingId === url.id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    {deletingId === url.id ? (
                                      <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                  {url.clicks > 0 && (
                                    <Button
                                      onClick={() => toggleExpanded(url.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-600 hover:text-black hover:bg-gray-100"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            <AnimatePresence>
                              {isExpanded && (
                                <tr key={`${url.id}-analytics`}>
                                  <td colSpan={5} className="px-0 py-0 bg-gray-50">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                        {/* Header with time range selector */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                          <h3 className="text-base sm:text-lg font-semibold text-black flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Analytics for {url.shortCode}
                                          </h3>
                                          <div className="flex gap-2">
                                            {(['24h', '7d', '30d'] as const).map((range) => (
                                              <Button
                                                key={range}
                                                onClick={() => setTimeRange(range)}
                                                variant={timeRange === range ? 'default' : 'outline'}
                                                size="sm"
                                                className={`text-xs sm:text-sm ${timeRange === range ? 'bg-black text-white' : ''}`}
                                              >
                                                {range === '24h' ? '24h' : range === '7d' ? '7d' : '30d'}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Sparkline */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                                          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Click Trends</h4>
                                          <ClickSparkline data={urlAnalytics} timeRange={timeRange} />
                                        </div>

                                        {/* Map - Full Width */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6">
                                          <h4 className="text-sm sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Geographic Distribution</h4>
                                          <ClickMap clicks={urlAnalytics} />
                                        </div>

                                        {/* Device & Browser Stats */}
                                        <div>
                                          <DeviceStats clicks={urlAnalytics} />
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - Shown on mobile/tablet */}
                <div className="lg:hidden divide-y divide-gray-200">
                  {urls.map((url) => {
                    const urlAnalytics = getAnalyticsForUrl(url);
                    const isExpanded = expandedLinkId === url.id;

                    return (
                      <div key={url.id} className="p-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono text-black font-semibold truncate">
                                {url.shortCode}
                              </code>
                              <a
                                href={`/${url.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-black transition-colors shrink-0"
                                aria-label={`Open short URL ${url.shortCode} in new tab`}
                                title={`Open short URL ${url.shortCode} in new tab`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {url.originalUrl}
                            </p>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            <span className="font-semibold text-black">{url.clicks || 0}</span>
                            <span>clicks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(url.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => copyToClipboard(url.shortCode, url.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8"
                          >
                            {copiedId === url.id ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                          {url.clicks > 0 && (
                            <Button
                              onClick={() => toggleExpanded(url.id)}
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 px-3"
                            >
                              <BarChart3 className="w-3.5 h-3.5 mr-1" />
                              {isExpanded ? 'Hide' : 'Analytics'}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete(url.id)}
                            variant="outline"
                            size="sm"
                            disabled={deletingId === url.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 px-3"
                          >
                            {deletingId === url.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>

                        {/* Analytics Section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden mt-4"
                            >
                              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                                {/* Header with time range */}
                                <div className="flex flex-col gap-3">
                                  <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Analytics
                                  </h3>
                                  <div className="flex gap-2">
                                    {(['24h', '7d', '30d'] as const).map((range) => (
                                      <Button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        variant={timeRange === range ? 'default' : 'outline'}
                                        size="sm"
                                        className={`flex-1 text-xs h-8 ${timeRange === range ? 'bg-black text-white' : ''}`}
                                      >
                                        {range === '24h' ? '24h' : range === '7d' ? '7d' : '30d'}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Sparkline */}
                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Click Trends</h4>
                                  <ClickSparkline data={urlAnalytics} timeRange={timeRange} />
                                </div>

                                {/* Map */}
                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Geographic Distribution</h4>
                                  <ClickMap clicks={urlAnalytics} />
                                </div>

                                {/* Device Stats */}
                                <div>
                                  <DeviceStats clicks={urlAnalytics} />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </>
              )}
            </Card>
          </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
