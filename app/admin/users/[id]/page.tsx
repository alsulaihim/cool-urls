'use client';

import { use, useState, useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Link2,
  MousePointerClick,
  Calendar,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuditLog, getIpAddress, getUserAgent } from '@/lib/admin/audit';

/**
 * User Detail Page
 * 
 * Shows detailed information about a specific user
 * and provides admin actions
 */
export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: userId } = use(params);
  const [isActing, setIsActing] = useState(false);

  const { user: currentAdmin } = db.useAuth();

  // Query user data
  const { data, isLoading } = db.useQuery({
    userProfiles: {
      $: {
        where: {
          userId,
        },
      },
    },
    userStatus: {
      $: {
        where: {
          userId,
        },
      },
    },
    urls: {
      $: {
        where: {
          userId,
        },
      },
    },
  });

  const userProfile = data?.userProfiles?.[0];
  const userStatus = data?.userStatus?.[0];
  const userUrls = data?.urls || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalClicks = userUrls.reduce((sum, url) => sum + (url.clicks || 0), 0);
    const avgClicks = userUrls.length > 0 ? (totalClicks / userUrls.length).toFixed(1) : '0';
    
    return {
      totalUrls: userUrls.length,
      totalClicks,
      avgClicks,
      mostRecentUrl: userUrls.sort((a, b) => b.createdAt - a.createdAt)[0],
    };
  }, [userUrls]);

  const status = userStatus?.status || 'active';

  // Actions
  const handleSuspend = async () => {
    if (!currentAdmin || !userProfile) return;
    
    const reason = prompt('Reason for suspension:');
    if (!reason) return;

    setIsActing(true);
    try {
      // Update or create user status
      const statusId = userStatus?.id || crypto.randomUUID();
      
      await db.transact(
        db.tx.userStatus[statusId].update({
          userId,
          status: 'suspended',
          reason,
          modifiedBy: currentAdmin.id,
          modifiedAt: Date.now(),
        })
      );

      // Create audit log
      await createAuditLog({
        adminId: currentAdmin.id,
        adminEmail: currentAdmin.email || 'unknown',
        action: 'user.suspend',
        targetType: 'user',
        targetId: userId,
        metadata: { reason },
      });

      alert('User suspended successfully');
      router.refresh();
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setIsActing(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!currentAdmin || !userProfile) return;

    setIsActing(true);
    try {
      const statusId = userStatus?.id || crypto.randomUUID();
      
      await db.transact(
        db.tx.userStatus[statusId].update({
          userId,
          status: 'active',
          reason: '',
          modifiedBy: currentAdmin.id,
          modifiedAt: Date.now(),
        })
      );

      // Create audit log
      await createAuditLog({
        adminId: currentAdmin.id,
        adminEmail: currentAdmin.email || 'unknown',
        action: 'user.unsuspend',
        targetType: 'user',
        targetId: userId,
      });

      alert('User unsuspended successfully');
      router.refresh();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Failed to unsuspend user');
    } finally {
      setIsActing(false);
    }
  };

  const handleBan = async () => {
    if (!currentAdmin || !userProfile) return;

    const reason = prompt('Reason for ban:');
    if (!reason) return;

    const confirm = window.confirm(
      'Are you sure you want to ban this user? This is a serious action.'
    );
    if (!confirm) return;

    setIsActing(true);
    try {
      const statusId = userStatus?.id || crypto.randomUUID();
      
      await db.transact(
        db.tx.userStatus[statusId].update({
          userId,
          status: 'banned',
          reason,
          modifiedBy: currentAdmin.id,
          modifiedAt: Date.now(),
        })
      );

      // Create audit log
      await createAuditLog({
        adminId: currentAdmin.id,
        adminEmail: currentAdmin.email || 'unknown',
        action: 'user.ban',
        targetType: 'user',
        targetId: userId,
        metadata: { reason },
      });

      alert('User banned successfully');
      router.refresh();
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-600">User not found</p>
            <Link href="/admin/users" className="text-blue-600 hover:underline mt-4 inline-block">
              Back to Users
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>

        {/* User Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-700">
                  {userProfile.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{userProfile.name || 'Unknown'}</h1>
                <p className="text-gray-600 font-mono text-sm mt-1">{userId}</p>
              </div>
            </div>
            <Badge
              variant={
                status === 'active' ? 'default' : status === 'suspended' ? 'secondary' : 'destructive'
              }
              className="text-base px-4 py-2"
            >
              {status}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Total URLs</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUrls}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-pink-600" />
              </div>
              <p className="text-sm text-gray-600">Total Clicks</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Member Since</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {new Date(userProfile.createdAt).toLocaleDateString()}
            </p>
          </Card>
        </div>

        {/* Actions */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {status === 'active' && (
              <Button
                onClick={handleSuspend}
                disabled={isActing}
                variant="outline"
                className="gap-2"
              >
                <Ban className="w-4 h-4" />
                Suspend User
              </Button>
            )}
            {status === 'suspended' && (
              <Button
                onClick={handleUnsuspend}
                disabled={isActing}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Unsuspend User
              </Button>
            )}
            {status !== 'banned' && (
              <Button
                onClick={handleBan}
                disabled={isActing}
                variant="destructive"
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                Ban User
              </Button>
            )}
          </div>
          {userStatus?.reason && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-900">Reason:</p>
              <p className="text-sm text-orange-700 mt-1">{userStatus.reason}</p>
            </div>
          )}
        </Card>

        {/* User URLs */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">URLs ({userUrls.length})</h2>
          {userUrls.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No URLs created yet</p>
          ) : (
            <div className="space-y-3">
              {userUrls.map((url) => (
                <div
                  key={url.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-gray-900">{url.shortCode}</p>
                    <p className="text-sm text-gray-600 truncate">{url.originalUrl}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Clicks</p>
                      <p className="font-semibold text-gray-900">{url.clicks}</p>
                    </div>
                    <Link
                      href={`/admin/urls/${url.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

