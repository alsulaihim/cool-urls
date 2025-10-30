'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Copy, CheckCircle2, Link as LinkIcon, BarChart3, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AuthHeader } from '@/components/auth/auth-header';
import { SetupBanner } from '@/components/setup-banner';
import { db } from '@/lib/instant';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { getShortUrlBase, getDisplayDomain } from '@/lib/config';

export default function Home() {
  const { user } = db.useAuth();
  const [url, setUrl] = useState('');
  const [prefix, setPrefix] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');

    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        setError('Invalid URL format');
        setLoading(false);
        return;
      }

      // Generate short code
      const randomCode = nanoid(6);
      const shortCode = prefix ? `${prefix}-${randomCode}` : randomCode;

      // Save to InstantDB - use UUID for entity ID
      await db.transact(
        db.tx.urls[uuidv4()].update({
          originalUrl: url,
          shortCode,
          prefix,
          createdAt: Date.now(),
          clicks: 0,
          userId: user?.id || 'anonymous',
        })
      );

      const baseUrl = getShortUrlBase();
      setShortUrl(`${baseUrl}/${shortCode}`);
      setUrl('');
      setPrefix('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />
      <SetupBanner />

      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white pointer-events-none" />

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-6 sm:py-12 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-10 md:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 tracking-tight font-[family-name:var(--font-orbitron)] lowercase" style={{ color: '#8B0000' }}>
            cool urls
          </h1>
          <p className="text-gray-500 text-sm sm:text-base md:text-lg px-2">
            Create beautiful short links with custom prefixes
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border border-gray-200 p-4 sm:p-6 md:p-8 rounded-lg bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Long URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/very/long/url"
                    required
                    className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Prefix Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prefix <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="my-brand"
                    maxLength={20}
                    className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 break-all">
                  Your short URL will look like: <span className="font-mono text-xs">{getDisplayDomain()}/{prefix || 'abc123'}-xyz789</span>
                </p>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-200"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-black text-white font-medium hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Shorten URL'
                )}
              </Button>
            </form>

            {/* Result */}
            <AnimatePresence>
              {shortUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    ✓ Your short URL is ready!
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      type="text"
                      value={shortUrl}
                      readOnly
                      className="flex-1 font-mono text-xs sm:text-sm border-gray-300 bg-white focus-visible:ring-0"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="px-4 h-9 border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Dashboard CTA - Show for signed-in users */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 sm:mt-8"
            >
              <Link href="/dashboard">
                <Card className="border border-gray-200 p-4 sm:p-6 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-black/5 rounded-lg shrink-0">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black text-sm sm:text-base">View Your Dashboard</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Track all your links and view analytics
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-black text-sm sm:text-base self-stretch sm:self-auto">
                      Go to Dashboard →
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* Login CTA - Show for signed-out users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 sm:mt-8"
            >
              <Card className="border border-gray-200 p-6 sm:p-8 rounded-lg bg-gradient-to-br from-gray-50 to-white text-center">
                <div className="max-w-md mx-auto">
                  <div className="inline-flex p-3 sm:p-4 bg-black/5 rounded-full mb-3 sm:mb-4">
                    <LogIn className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-black mb-2">
                    Want to track your links?
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
                    Sign in to access your personal dashboard, view analytics, and manage all your shortened URLs in one place.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => {
                        const signInButton = document.querySelector('[data-auth-trigger]') as HTMLButtonElement;
                        signInButton?.click();
                      }}
                      className="bg-black text-white hover:bg-gray-800 h-11 px-6 w-full sm:w-auto"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In / Sign Up
                    </Button>
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button variant="outline" className="border-gray-300 hover:bg-gray-50 h-11 px-6 w-full">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Preview Dashboard
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 px-2">
                    Free forever • No password needed • Magic link authentication
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
