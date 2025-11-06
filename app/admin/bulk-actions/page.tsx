'use client';

import { useState } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Download,
  Mail,
  Users,
  Link2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Layers,
  FileDown,
} from 'lucide-react';

/**
 * Bulk Actions Page
 *
 * Perform bulk operations on users, subscriptions, and URLs
 */
export default function BulkActionsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Query data for counts
  const { data, isLoading } = db.useQuery({
    userProfiles: {},
    urls: {},
    subscriptions: {},
    payments: {},
  });

  const handleExportUsers = async () => {
    if (!data) return;

    setIsProcessing(true);
    try {
      const users = data.userProfiles || [];
      const subscriptions = data.subscriptions || [];

      // Create CSV
      const headers = ['Name', 'User ID', 'Plan', 'Status', 'Created At'];
      const rows = users.map((user) => {
        const sub = subscriptions.find((s) => s.userId === user.userId);
        return [
          user.name || 'N/A',
          user.userId,
          sub?.planId || 'free',
          sub?.status || 'active',
          new Date(user.createdAt).toISOString(),
        ];
      });

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setResult({ success: true, message: `Exported ${users.length} users to CSV` });
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setResult({ success: false, message: 'Failed to export users' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportAnalytics = async () => {
    if (!data) return;

    setIsProcessing(true);
    try {
      const urls = data.urls || [];

      // Create CSV
      const headers = ['Short Code', 'Original URL', 'User ID', 'Clicks', 'Created At'];
      const rows = urls.map((url) => [
        url.shortCode,
        url.originalUrl,
        url.userId,
        url.clicks || 0,
        new Date(url.createdAt).toISOString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setResult({ success: true, message: `Exported ${urls.length} URLs to CSV` });
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setResult({ success: false, message: 'Failed to export analytics' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPayments = async () => {
    if (!data) return;

    setIsProcessing(true);
    try {
      const payments = data.payments || [];

      // Create CSV
      const headers = ['Date', 'User ID', 'Amount', 'Currency', 'Status', 'Provider', 'Plan ID', 'Payment ID'];
      const rows = payments.map((payment) => [
        new Date(payment.createdAt).toISOString(),
        payment.userId,
        (payment.amount / 100).toFixed(2),
        payment.currency.toUpperCase(),
        payment.status,
        payment.provider,
        payment.planId,
        payment.providerPaymentId,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setResult({ success: true, message: `Exported ${payments.length} payments to CSV` });
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setResult({ success: false, message: 'Failed to export payments' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userCount = data?.userProfiles?.length || 0;
  const urlCount = data?.urls?.length || 0;
  const subscriptionCount = data?.subscriptions?.length || 0;
  const paymentCount = data?.payments?.length || 0;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bulk Actions</h1>
          </div>
          <p className="text-gray-600 mt-1">Perform mass operations and export data</p>
        </div>

        {/* Result Message */}
        {result && (
          <Card
            className={`p-4 mb-6 ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.message}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResult(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Export Operations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Export Users */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <FileDown className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Users</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download all user data including subscriptions and status
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-900">{userCount}</span>
                <span className="text-sm text-gray-500">users</span>
              </div>
              <Button
                onClick={handleExportUsers}
                disabled={isProcessing || userCount === 0}
                className="w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export to CSV
                  </>
                )}
              </Button>
            </Card>

            {/* Export Analytics */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-purple-600" />
                </div>
                <FileDown className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export URLs</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download all URL data with click analytics
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-900">{urlCount}</span>
                <span className="text-sm text-gray-500">URLs</span>
              </div>
              <Button
                onClick={handleExportAnalytics}
                disabled={isProcessing || urlCount === 0}
                className="w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export to CSV
                  </>
                )}
              </Button>
            </Card>

            {/* Export Payments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <FileDown className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Payments</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download payment history for accounting
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-900">{paymentCount}</span>
                <span className="text-sm text-gray-500">payments</span>
              </div>
              <Button
                onClick={handleExportPayments}
                disabled={isProcessing || paymentCount === 0}
                className="w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export to CSV
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>

        {/* Bulk Communication */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bulk Communication</h2>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send Bulk Email</h3>
                <p className="text-sm text-gray-600">Email all users or specific segments</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="recipients-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <select
                  id="recipients-select"
                  name="recipients"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>All Users ({userCount})</option>
                  <option>Paying Customers ({subscriptionCount})</option>
                  <option>Free Plan Users ({userCount - subscriptionCount})</option>
                  <option>Past Due Subscriptions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <Input type="text" placeholder="Email subject..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <Textarea
                  rows={6}
                  placeholder="Your message here..."
                  className="resize-none"
                />
              </div>

              <Button className="w-full gap-2" disabled>
                <Mail className="w-4 h-4" />
                Send Email (Coming Soon)
              </Button>
            </div>
          </Card>
        </div>

        {/* Scheduled Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Usage Reset</h3>
              <p className="text-sm text-gray-600 mb-4">
                Automatically reset click usage at the start of each billing period
              </p>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">Status: Active</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expired Trial Cleanup</h3>
              <p className="text-sm text-gray-600 mb-4">
                Automatically downgrade expired trials to free plan
              </p>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">Status: Active</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
