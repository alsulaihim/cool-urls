'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Copy,
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Users,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ClickAnalytics {
  deviceType?: string;
  os?: string;
  browser?: string;
  country?: string;
  city?: string;
  isp?: string;
  referrerApp?: string;
  referrerDomain?: string;
  language?: string;
  isBot?: boolean;
  ipHash?: string;
  timestamp?: number;
  timezone?: string;
  isProxy?: boolean;
}

interface URL {
  id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: number;
  analyticsData?: string;
}

interface LinksTableProps {
  urls: URL[];
  onCopy: (shortCode: string, id: string) => void;
  copiedId: string | null;
}

export function LinksTable({ urls, onCopy, copiedId }: LinksTableProps) {
  // Sort URLs by clicks first to determine which should be expanded
  const sortedUrls = [...urls].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

  const [expandedRow, setExpandedRow] = useState<string | null>(
    sortedUrls.length > 0 ? sortedUrls[0].id : null
  );

  // Parse analytics data for a URL
  const getAnalytics = (url: URL) => {
    if (!url.analyticsData) return [];
    try {
      return JSON.parse(url.analyticsData) as ClickAnalytics[];
    } catch {
      return [];
    }
  };

  // Calculate stats for each URL
  const getUrlStats = (url: URL) => {
    const analytics = getAnalytics(url);

    // Unique visitors
    const uniqueVisitors = new Set(analytics.map(a => a.ipHash).filter(Boolean)).size;

    // Countries
    const countries = new Set(analytics.map(a => a.country).filter(Boolean));

    // Devices
    const devices = analytics.reduce((acc, a) => {
      const type = a.deviceType || 'desktop';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mobileCount = (devices.mobile || 0) + (devices.tablet || 0);
    const desktopCount = devices.desktop || 0;
    const mobilePercent = url.clicks > 0 ? Math.round((mobileCount / url.clicks) * 100) : 0;

    // Top referrers
    const referrers = analytics.reduce((acc, a) => {
      const ref = a.referrerApp || a.referrerDomain || 'Direct';
      acc[ref] = (acc[ref] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReferrer = Object.entries(referrers)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Direct';

    // Last clicked
    const lastClick = analytics.length > 0
      ? Math.max(...analytics.map(a => a.timestamp || 0))
      : null;

    return {
      uniqueVisitors,
      countries: countries.size,
      mobilePercent,
      topReferrer,
      lastClick,
      analytics,
    };
  };


  return (
    <Card className="rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold w-[120px] sm:w-[180px] text-xs sm:text-sm">Short Link</TableHead>
              <TableHead className="font-semibold min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm hidden sm:table-cell">Destination</TableHead>
              <TableHead className="font-semibold text-center w-[60px] sm:w-[80px] text-xs sm:text-sm">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Clicks</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-center w-[60px] sm:w-[80px] text-xs sm:text-sm hidden md:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Unique</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-center w-[70px] sm:w-[90px] text-xs sm:text-sm hidden lg:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xl:inline">Countries</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-center w-[60px] sm:w-[80px] text-xs sm:text-sm hidden lg:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xl:inline">Mobile</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold w-[120px] hidden lg:table-cell text-xs sm:text-sm">Top Source</TableHead>
              <TableHead className="font-semibold w-[140px] hidden xl:table-cell text-xs sm:text-sm">Created</TableHead>
              <TableHead className="font-semibold text-center w-[90px] sm:w-[120px] text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUrls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No links yet. Create your first link to get started!
                </TableCell>
              </TableRow>
            ) : (
              sortedUrls.map((url) => {
                const stats = getUrlStats(url);
                const isExpanded = expandedRow === url.id;

                return (
                  <React.Fragment key={url.id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : url.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
                          <span className="text-foreground text-xs sm:text-sm">/{url.shortCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[300px]">
                          <span className="text-xs sm:text-sm text-muted-foreground truncate">
                            {url.originalUrl}
                          </span>
                          <a
                            href={`/${url.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 sm:py-3 px-2 sm:px-4">
                        <span className="font-semibold text-foreground text-xs sm:text-sm">{url.clicks || 0}</span>
                      </TableCell>
                      <TableCell className="text-center py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                        <span className="text-foreground text-xs sm:text-sm">{stats.uniqueVisitors}</span>
                      </TableCell>
                      <TableCell className="text-center py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                        <span className="text-foreground text-xs sm:text-sm">{stats.countries}</span>
                      </TableCell>
                      <TableCell className="text-center py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                        <span className="text-foreground text-xs sm:text-sm">{stats.mobilePercent}%</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 sm:py-3 px-2 sm:px-4">
                        <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[100px] inline-block">
                          {stats.topReferrer}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {formatDistanceToNow(url.createdAt, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 sm:py-3 px-2 sm:px-4">
                        <Button
                          onClick={() => onCopy(url.shortCode, url.id)}
                          variant="outline"
                          size="sm"
                          className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                        >
                          {copiedId === url.id ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1" />
                              <span className="hidden sm:inline">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1" />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row - Detailed Analytics */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/30 p-3 sm:p-4 md:p-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Click Timeline */}
                            <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm">
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Activity</h4>
                              <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Total Clicks:</span>
                                  <span className="font-medium text-foreground">{url.clicks || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Unique Visitors:</span>
                                  <span className="font-medium text-foreground">{stats.uniqueVisitors}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Unique Rate:</span>
                                  <span className="font-medium text-foreground">
                                    {url.clicks > 0 ? Math.round((stats.uniqueVisitors / url.clicks) * 100) : 0}%
                                  </span>
                                </div>
                                {stats.lastClick && (
                                  <div className="flex justify-between">
                                    <span>Last Click:</span>
                                    <span className="font-medium text-foreground">
                                      {formatDistanceToNow(stats.lastClick, { addSuffix: true })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Geographic Distribution */}
                            <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm">
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Geography</h4>
                              <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Countries:</span>
                                  <span className="font-medium text-foreground">{stats.countries}</span>
                                </div>
                                {stats.analytics.length > 0 && (() => {
                                  const topCountries = Object.entries(
                                    stats.analytics.reduce((acc, a) => {
                                      if (a.country) acc[a.country] = (acc[a.country] || 0) + 1;
                                      return acc;
                                    }, {} as Record<string, number>)
                                  ).sort(([, a], [, b]) => b - a).slice(0, 3);

                                  return topCountries.map(([country, count]) => (
                                    <div key={country} className="flex justify-between">
                                      <span>{country}:</span>
                                      <span className="font-medium text-foreground">{count}</span>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>

                            {/* Device Stats */}
                            <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm">
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Devices</h4>
                              <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                                {stats.analytics.length > 0 && (() => {
                                  const devices = stats.analytics.reduce((acc, a) => {
                                    const type = a.deviceType || 'desktop';
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>);

                                  return Object.entries(devices)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([device, count]) => (
                                      <div key={device} className="flex justify-between">
                                        <span className="capitalize">{device}:</span>
                                        <span className="font-medium text-foreground">
                                          {count} ({Math.round((count / url.clicks) * 100)}%)
                                        </span>
                                      </div>
                                    ));
                                })()}
                              </div>
                            </div>

                            {/* Top Referrers */}
                            <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm">
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Referrers</h4>
                              <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                                {stats.analytics.length > 0 && (() => {
                                  const referrers = stats.analytics.reduce((acc, a) => {
                                    const ref = a.referrerApp || a.referrerDomain || 'Direct';
                                    acc[ref] = (acc[ref] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>);

                                  return Object.entries(referrers)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 4)
                                    .map(([referrer, count]) => (
                                      <div key={referrer} className="flex justify-between">
                                        <span className="truncate max-w-[100px]">{referrer}:</span>
                                        <span className="font-medium text-foreground">{count}</span>
                                      </div>
                                    ));
                                })()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
