'use client';

import { useState, useEffect } from 'react';
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
  const [displayDomain, setDisplayDomain] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Query all URLs to check for collisions
  const { data: urlsData } = db.useQuery({
    urls: {},
  });

  useEffect(() => {
    setDisplayDomain(getDisplayDomain());
  }, []);

  // Helper function to generate alternative prefix suggestions
  const generateSuggestions = (originalPrefix: string): string[] => {
    const suggestions = [];

    // If there was a prefix, suggest variations of the prefix
    if (originalPrefix) {
      // Add numbered variations of the prefix
      for (let i = 1; i <= 3; i++) {
        suggestions.push(`${originalPrefix}${i}-go`);
      }

      // Add suffix variations to the prefix
      const suffixes = ['new', 'app', 'link', 'url', 'hot', 'cool', 'my'];
      for (const suffix of suffixes) {
        suggestions.push(`${originalPrefix}-${suffix}-go`);
      }

      // Shortened prefix variations
      if (originalPrefix.length > 3) {
        suggestions.push(`${originalPrefix.slice(0, 3)}-go`);
      }
    } else {
      // If no prefix, suggest common prefix options
      const commonPrefixes = ['my', 'app', 'link', 'url', 'go', 'hot', 'cool', 'new', 'click', 'visit'];
      for (const prefix of commonPrefixes) {
        suggestions.push(`${prefix}-go`);
      }
    }

    return suggestions;
  };

  // Helper function to check if short code exists
  const shortCodeExists = (code: string): boolean => {
    return urlsData?.urls?.some((url: any) => url.shortCode === code) || false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');
    setSuggestions([]);
    setShowSuggestions(false);

    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        setError('Invalid URL format');
        setLoading(false);
        return;
      }

      const isRegistered = !!user;
      let shortCode: string;
      let expiresAt: number | undefined;
      let isAnonymous = false;

      if (isRegistered) {
        // Registered users: Can use prefix with "-go" suffix
        if (!prefix) {
          setError('Please enter a prefix for your branded link');
          setLoading(false);
          return;
        }
        shortCode = `${prefix}-go`;
      } else {
        // Anonymous users: Random short code, expires in 24 hours
        shortCode = nanoid(6);
        expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
        isAnonymous = true;
      }

      // Check if short code already exists
      if (shortCodeExists(shortCode)) {
        if (isRegistered) {
          // Generate suggestions with alternative prefixes
          const suggestionsList = generateSuggestions(prefix);
          const availableSuggestions = suggestionsList.filter(s => !shortCodeExists(s));

          setSuggestions(availableSuggestions.slice(0, 5));
          setShowSuggestions(true);
          setError('This short link already exists. Try one of these alternative prefixes:');
        } else {
          // For anonymous, just retry with new random code
          shortCode = nanoid(6);
        }
        setLoading(false);
        return;
      }

      // Save to InstantDB - use UUID for entity ID
      const urlData: any = {
        originalUrl: url,
        shortCode,
        createdAt: Date.now(),
        clicks: 0,
        userId: user?.id || 'anonymous',
        isAnonymous,
      };

      if (prefix && isRegistered) {
        urlData.prefix = prefix;
      }

      if (expiresAt) {
        urlData.expiresAt = expiresAt;
      }

      await db.transact(
        db.tx.urls[uuidv4()].update(urlData)
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

  // Handle using a suggested short code
  const useSuggestion = async (suggestedCode: string) => {
    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      // Save to InstantDB with suggested code
      await db.transact(
        db.tx.urls[uuidv4()].update({
          originalUrl: url,
          shortCode: suggestedCode,
          prefix,
          createdAt: Date.now(),
          clicks: 0,
          userId: user?.id || 'anonymous',
        })
      );

      const baseUrl = getShortUrlBase();
      setShortUrl(`${baseUrl}/${suggestedCode}`);
      setUrl('');
      setPrefix('');
      setSuggestions([]);
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 tracking-tight text-black">
            Get Short Links with Style
          </h1>
          <p className="text-gray-500 text-sm sm:text-base md:text-lg px-2">
            {user
              ? 'Create beautiful branded short URLs with custom prefixes'
              : 'Create short URLs instantly - Sign in for branded links'}
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

              {/* Prefix Input - Only for registered users */}
              {user ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Prefix <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      placeholder="mybrand"
                      maxLength={20}
                      required
                      className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 break-all">
                    Your branded URL: <span className="font-mono text-xs">{displayDomain || 'loading...'}/<wbr/>{prefix || 'mybrand'}<span className="text-pink-500 font-semibold">-go</span></span>
                  </p>
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Permanent link - never expires
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-medium mb-2">Anonymous Link</p>
                  <p className="text-xs text-blue-700 mb-3">
                    Your link will be a random short code and will expire in 24 hours.
                  </p>
                  <p className="text-xs text-blue-600">
                    Want permanent branded links like <span className="font-mono">yourname-go</span>?{' '}
                    <Link href="/#" className="underline font-semibold hover:text-blue-800">
                      Sign in now
                    </Link>
                  </p>
                </div>
              )}

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

              {/* Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-medium text-gray-700">
                      Available alternatives:
                    </p>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={suggestion}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          type="button"
                          onClick={() => useSuggestion(suggestion)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-all group"
                        >
                          <span className="font-mono text-sm text-gray-700 group-hover:text-black">
                            {displayDomain}/{suggestion}
                          </span>
                          <span className="text-xs text-gray-500 group-hover:text-black">
                            Use this →
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        setSuggestions([]);
                        setError('');
                      }}
                      variant="ghost"
                      className="w-full text-sm text-gray-600 hover:text-black"
                    >
                      Try again with different prefix
                    </Button>
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
                  {!user && (
                    <p className="mt-3 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                      ⏰ This link will expire in 24 hours. Sign in to create permanent branded links!
                    </p>
                  )}
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
