'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Copy, CheckCircle2, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import type { ShortUrl } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LinksPage() {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const response = await fetch('/api/urls');
      const data = await response.json();
      setUrls(data.urls);
    } catch (error) {
      console.error('Failed to fetch URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortCode: string, id: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/">
            <Button variant="ghost" className="text-gray-600 hover:text-black hover:bg-gray-50 mb-8 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-3 tracking-tight">
            My Links
          </h1>
          <p className="text-gray-500 text-base">Manage and share all your shortened URLs</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : urls.length === 0 ? (
          <Card className="border border-gray-200 rounded-lg p-12 text-center bg-white">
            <p className="text-gray-600 mb-6">No URLs yet. Create your first one!</p>
            <Link href="/">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-md">
                Create Short URL
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {urls.map((url, index) => (
              <motion.div
                key={url.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className="px-2.5 py-0.5 bg-gray-900 text-white hover:bg-gray-800 font-mono text-xs">
                          {url.shortCode}
                        </Badge>
                        {url.prefix && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">
                            {url.prefix}
                          </Badge>
                        )}
                      </div>

                      <a
                        href={url.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 text-sm transition-colors flex items-center gap-1.5 group break-all mb-3"
                      >
                        <span className="truncate">{url.originalUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          {url.clicks} clicks
                        </span>
                        <span>{formatDate(url.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => copyToClipboard(url.shortCode, url.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:bg-gray-50 flex items-center gap-2 h-9"
                      >
                        {copiedId === url.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
