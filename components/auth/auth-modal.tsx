'use client';

import { useState } from 'react';
import { db } from '@/lib/instant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Mail, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sign in with magic code
      const result = await db.auth.signInWithMagicCode({ email, code });
      
      // Save the user's name to their profile if provided
      if (result && name.trim()) {
        // Wait a bit for auth to complete
        setTimeout(async () => {
          try {
            await db.transact(
              db.tx.userProfiles[uuidv4()].update({
                userId: result.user.id,
                name: name.trim(),
                createdAt: Date.now(),
              })
            );
          } catch (profileError) {
            console.error('Error saving profile:', profileError);
          }
        }, 500);
      }

      onClose();
      // Reset form
      setEmail('');
      setName('');
      setCode('');
      setSentEmail(false);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-md"
          >
            <Card className="border border-gray-200 p-8 rounded-lg bg-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">
                  {sentEmail ? 'Check your email' : 'Sign In / Sign Up'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!sentEmail ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What shall we call you?
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your first name"
                        required
                        className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-200">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-black text-white font-medium hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Send Magic Link'
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    We'll send you a magic link to sign in without a password
                  </p>
                </form>
              ) : (
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    We sent a verification code to <strong>{email}</strong>
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        required
                        maxLength={6}
                        className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-200">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-black text-white font-medium hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setSentEmail(false);
                      setCode('');
                      setError('');
                    }}
                    className="text-sm text-gray-600 hover:text-black transition-colors w-full text-center mt-2"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
