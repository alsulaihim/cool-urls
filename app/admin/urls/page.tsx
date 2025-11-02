'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Link2,
  Search,
  CheckCircle,
  ExternalLink,
  Copy,
  MousePointerClick
} from 'lucide-react';
import Link from 'next/link';

/**
 * Admin URLs Management Page
 *
 * Shows all shortened URLs in the system with admin actions
 */
export default function AdminUrlsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Query all URLs
  const { data, isLoading } = db.useQuery({
    urls: {},
    userProfiles: {},
  });

  // Filter and search URLs
  const filteredUrls = useMemo(() => {
    const urls = data?.urls || [];

    return urls
      .filter(url => {
        const matchesSearch = searchQuery === '' ||
          url.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          url.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
          url.prefix?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data?.urls, searchQuery]);

  // Get user profile for a userId
  const getUserProfile = (userId: string) => {
    return data?.userProfiles?.find(profile => profile.userId === userId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">URL Management</h1>
          <p className="text-gray-600 mt-1">View and manage all shortened URLs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total URLs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.urls?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.urls?.reduce((sum, url) => sum + (url.clicks || 0), 0).toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Clicks/URL</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.urls?.length
                    ? (data.urls.reduce((sum, url) => sum + (url.clicks || 0), 0) / data.urls.length).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by short code, URL, or prefix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* URLs List */}
        <div className="space-y-4">
          {filteredUrls.length === 0 ? (
            <Card className="p-12 text-center">
              <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No URLs found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search query' : 'No URLs have been created yet'}
              </p>
            </Card>
          ) : (
            filteredUrls.map(url => {
              const userProfile = getUserProfile(url.userId);
              const shortUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${url.shortCode}`;

              return (
                <Card key={url.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {url.shortCode}
                        </h3>
                        {url.prefix && (
                          <Badge variant="outline" className="text-xs">
                            {url.prefix}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Short URL:</span>
                          <code className="text-blue-600 bg-blue-50 px-2 py-1 rounded truncate max-w-md">
                            {shortUrl}
                          </code>
                          <button
                            onClick={() => copyToClipboard(shortUrl)}
                            className="p-1 hover:bg-gray-100 rounded"
                            aria-label="Copy short URL to clipboard"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Original:</span>
                          <a
                            href={url.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-md flex items-center gap-1"
                          >
                            {url.originalUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            <MousePointerClick className="w-4 h-4 inline mr-1" />
                            {url.clicks || 0} clicks
                          </span>
                          <span>
                            Created {new Date(url.createdAt).toLocaleDateString()}
                          </span>
                          {userProfile && (
                            <span>
                              By: {userProfile.name || url.userId.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/admin/urls/${url.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination info */}
        {filteredUrls.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredUrls.length} of {data?.urls?.length || 0} URLs
          </div>
        )}
      </div>
    </div>
  );
}
