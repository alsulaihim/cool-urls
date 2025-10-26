'use client';

import { useState } from 'react';
import { db } from '@/lib/instant';
import { AuthHeader } from '@/components/auth/auth-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link2, MousePointerClick, Calendar, Copy, CheckCircle2, Trash2, ExternalLink, Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/lib/useUserProfile';

export default function Dashboard() {
  const { user, isLoading } = db.useAuth();
  const router = useRouter();
  const { profile } = useUserProfile(user?.id);

  // Query URLs - we'll filter by user after fetching
  const { data, isLoading: urlsLoading } = db.useQuery({
    urls: {},
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  if (isLoading || urlsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <AuthHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
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

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-black mb-2">
                  Welcome back, {getDisplayName()}! 👋
                </h1>
                <p className="text-gray-500">
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
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <Card className="p-6 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/5 rounded-lg">
                  <Link2 className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Links</p>
                  <p className="text-3xl font-bold text-black">{totalLinks}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/5 rounded-lg">
                  <MousePointerClick className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Clicks</p>
                  <p className="text-3xl font-bold text-black">{totalClicks}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/5 rounded-lg">
                  <Calendar className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-lg font-bold text-black">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Links Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-black">Your Links</h2>
              </div>

              {urls.length === 0 ? (
                <div className="p-12 text-center">
                  <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No links yet</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Create your first shortened link to get started
                  </p>
                  <Link href="/">
                    <Button className="bg-black text-white hover:bg-gray-800">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Link
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {urls.map((url) => (
                        <tr key={url.id} className="hover:bg-gray-50 transition-colors">
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
                            <span className="text-sm font-semibold text-black">
                              {url.clicks || 0}
                            </span>
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
