'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Admin Login Page
 *
 * Separate login page for admin panel access
 * Enhanced security with admin verification
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();

  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query admin users to verify if logged-in user is admin
  const { data: adminData, isLoading: adminLoading } = db.useQuery({
    adminUsers: {},
  });

  // Check if current user is admin
  const isAdmin = user && adminData?.adminUsers
    ? adminData.adminUsers.some(admin => admin.userId === user.id)
    : false;

  // If already logged in as admin, redirect to admin dashboard
  useEffect(() => {
    if (!authLoading && !adminLoading && user && isAdmin) {
      router.push('/admin');
    }
  }, [authLoading, adminLoading, user, isAdmin, router]);

  // Send magic code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify code and check admin status
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Sign in with code
      await db.auth.signInWithMagicCode({ email: sentEmail, code });

      // The useEffect will handle redirect after admin check
      // We'll wait for the auth and admin data to load
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-pink-600 animate-pulse" />
            </div>
            <p className="text-gray-600">Verifying access...</p>
          </div>
        </Card>
      </div>
    );
  }

  // If user is logged in but not admin, show access denied
  if (user && !isAdmin && !adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">
                Your account does not have admin privileges.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Contact a system administrator if you believe this is an error.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => {
                  db.auth.signOut();
                  setSentEmail('');
                  setCode('');
                  setError('');
                }}
                variant="outline"
                className="flex-1"
              >
                Sign Out
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-pink-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 text-center mt-2">
            Secure access for administrators only
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Email Form */}
        {!sentEmail ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Only registered admin accounts can access this panel
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Code Verification Form */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="pl-10 text-center text-lg tracking-widest"
                  required
                  disabled={isSubmitting}
                  autoFocus
                  maxLength={6}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Check your email ({sentEmail}) for the verification code
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify & Access Admin Panel
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => {
                setSentEmail('');
                setCode('');
                setError('');
              }}
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
            >
              Use Different Email
            </Button>
          </form>
        )}

        {/* Security Notice */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Secure Access</p>
              <p className="text-xs text-gray-600 mt-1">
                This login is monitored and audited. All admin actions are logged for security purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Main Site */}
        <div className="mt-6 text-center">
          <Button
            onClick={() => router.push('/')}
            variant="link"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Main Site
          </Button>
        </div>
      </Card>
    </div>
  );
}
