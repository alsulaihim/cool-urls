'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Shield,
  User,
  Link2,
  Settings,
  Search,
  Calendar,
  Globe,
  Monitor,
  AlertCircle
} from 'lucide-react';

/**
 * Admin Audit Logs Page
 *
 * Shows comprehensive audit trail of all admin actions
 */
export default function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Query all audit logs
  const { data, isLoading } = db.useQuery({
    auditLogs: {},
  });

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Actions', icon: Shield },
    { value: 'user', label: 'User Actions', icon: User },
    { value: 'url', label: 'URL Actions', icon: Link2 },
    { value: 'admin', label: 'Admin Actions', icon: Settings },
  ];

  // Filter and search audit logs
  const filteredLogs = useMemo(() => {
    if (!data?.auditLogs) return [];

    return data.auditLogs
      .filter(log => {
        // Filter by type
        if (filterType !== 'all') {
          const actionPrefix = log.action.split('.')[0];
          if (actionPrefix !== filterType) return false;
        }

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            log.action.toLowerCase().includes(query) ||
            log.adminEmail?.toLowerCase().includes(query) ||
            log.targetType?.toLowerCase().includes(query) ||
            log.ipAddress?.toLowerCase().includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [data?.auditLogs, filterType, searchQuery]);

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    if (action.includes('delete') || action.includes('suspend') || action.includes('revoke')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (action.includes('grant') || action.includes('create')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (action.includes('update') || action.includes('moderate')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    const actionType = action.split('.')[0];
    switch (actionType) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'url':
        return <Link2 className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'config':
        return <Settings className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Full date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all administrative actions and system events</p>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by action, admin, target, or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilterType(option.value)}
                    className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      filterType === option.value
                        ? 'bg-pink-50 border-pink-300 text-pink-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 pt-6 border-t flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{data?.auditLogs?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
            </div>
          </div>
        </Card>

        {/* Audit Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <Card className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery || filterType !== 'all'
                  ? 'No audit logs match your filters'
                  : 'No audit logs yet'}
              </p>
            </Card>
          ) : (
            filteredLogs.map((log) => {
              let metadata = {};
              try {
                metadata = log.metadata ? JSON.parse(log.metadata) : {};
              } catch (e) {
                // Skip invalid JSON
              }

              return (
                <Card key={log.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Action info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`${getActionBadgeColor(log.action)} border`}>
                            {log.action}
                          </Badge>
                          {log.targetType && (
                            <span className="text-sm text-gray-500">
                              on <span className="font-medium">{log.targetType}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-900 mb-2">
                          <span className="font-medium">{log.adminEmail || 'System'}</span>
                          {' performed this action'}
                        </p>

                        {/* Metadata */}
                        {Object.keys(metadata).length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3 border">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Details:</p>
                            <div className="space-y-1">
                              {Object.entries(metadata).map(([key, value]) => (
                                <p key={key} className="text-xs text-gray-600">
                                  <span className="font-medium">{key}:</span>{' '}
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Context info */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatTimestamp(log.timestamp)}</span>
                          </div>
                          {log.ipAddress && log.ipAddress !== 'system' && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>{log.ipAddress}</span>
                            </div>
                          )}
                          {log.userAgent && log.userAgent !== 'setup-admin-user script' && (
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{log.userAgent}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Load more placeholder */}
        {filteredLogs.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {data?.auditLogs?.length || 0} total logs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
