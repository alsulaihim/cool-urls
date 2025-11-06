'use client';

import { useState } from 'react';
import { db } from '@/lib/instant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Mail, Lock, User, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_NAME = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_NAME || 'google-web';
const APPLE_CLIENT_NAME = process.env.NEXT_PUBLIC_APPLE_CLIENT_NAME || 'apple-web';
const APPLE_SERVICE_ID = process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || '';

export function AuthModal({ isOpen, onClose, inline = false }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  // Separate loading states to avoid cross-disabling inputs
  const [isSubmittingMagic, setIsSubmittingMagic] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [nonce] = useState(crypto.randomUUID());

  // Apple Sign In handler
  const handleAppleSignIn = async () => {
    try {
      setIsOAuthLoading(true);
      setError('');

      // Check if AppleID is available
      if (typeof window === 'undefined' || !(window as any).AppleID) {
        setError('Apple Sign In is not available. Please try another method.');
        setIsOAuthLoading(false);
        return;
      }

      // Check if Services ID is configured
      if (!APPLE_SERVICE_ID) {
        setError('Apple Sign In is not configured. Please add NEXT_PUBLIC_APPLE_SERVICE_ID to your environment variables.');
        setIsOAuthLoading(false);
        return;
      }

      // Check if client name is configured
      if (!APPLE_CLIENT_NAME) {
        setError('Apple Sign In is not configured. Please add NEXT_PUBLIC_APPLE_CLIENT_NAME to your environment variables.');
        setIsOAuthLoading(false);
        return;
      }

      // Initialize Apple ID authentication
      // Note: Apple doesn't allow localhost URLs
      // For local development, Apple Sign In will only work if using a tunnel (ngrok) or deployed URL
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        setError('Apple Sign In is not available on localhost. Please use ngrok tunnel, or test on your deployed environment.');
        setIsOAuthLoading(false);
        return;
      }

      const redirectURI = window.location.origin;

      console.log('🍎 Initializing Apple Sign In with:', {
        clientId: APPLE_SERVICE_ID,
        redirectURI,
        clientName: APPLE_CLIENT_NAME,
      });

      try {
        (window as any).AppleID.auth.init({
          clientId: APPLE_SERVICE_ID,
          scope: 'name email',
          redirectURI: redirectURI,
          usePopup: true,
        });
        console.log('✅ Apple SDK initialized successfully');
      } catch (initErr) {
        console.error('❌ Failed to initialize Apple SDK:', initErr);
        throw new Error('Failed to initialize Apple Sign In. Please check your configuration.');
      }

      // Generate nonce for security
      const nonce = crypto.randomUUID();
      console.log('🔐 Generated nonce:', nonce);

      // Call Apple Sign In
      console.log('🚀 Calling Apple Sign In...');
      let resp;
      try {
        resp = await (window as any).AppleID.auth.signIn({
          nonce: nonce,
          usePopup: true,
        });
        console.log('✅ Apple Sign In response received:', JSON.stringify(resp, null, 2));
      } catch (signInErr: any) {
        // Check if it's a user cancellation FIRST before logging as error
        if (signInErr?.error === 'popup_closed_by_user' || signInErr?.error === 'user_cancelled_authorize') {
          console.log('ℹ️  Apple Sign In popup was closed');
          setIsOAuthLoading(false);
          return;
        }

        // If it's a real error, log it
        console.error('❌ Apple signIn() failed:', signInErr);
        console.error('❌ signIn error type:', typeof signInErr);
        console.error('❌ signIn error keys:', signInErr ? Object.keys(signInErr) : 'null');
        console.error('❌ signIn error.error value:', signInErr?.error);
        console.error('❌ Full error structure:', JSON.stringify(signInErr, null, 2));

        throw signInErr;
      }

      // Check if user cancelled or missing data
      if (!resp || !resp.authorization || !resp.authorization.id_token) {
        console.log('❌ Apple Sign In cancelled by user or missing data. Response:', resp);
        setError('Apple Sign In was not completed. This may be due to domain configuration. Please try Magic Link authentication instead.');
        setIsOAuthLoading(false);
        return;
      }

      console.log('✅ Got ID token from Apple');

      // Sign in with InstantDB
      console.log('🔄 Signing in with InstantDB...');
      try {
        const result = await db.auth.signInWithIdToken({
          clientName: APPLE_CLIENT_NAME,
          idToken: resp.authorization.id_token,
          nonce: nonce,
        });
        console.log('✅ InstantDB sign in result:', result);
      } catch (dbErr) {
        console.error('❌ InstantDB sign in failed:', dbErr);
        throw dbErr;
      }

      console.log('✅ Successfully signed in with InstantDB');
      onClose();
    } catch (err: any) {
      console.error('❌ Apple sign-in error:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error constructor:', err?.constructor?.name);
      console.error('❌ Error details:', {
        error: err?.error,
        message: err?.message,
        body: err?.body,
        stack: err?.stack,
        stringified: JSON.stringify(err),
      });

      // Check if error is due to user cancellation
      if (err?.error === 'popup_closed_by_user' || err?.error === 'user_cancelled_authorize') {
        console.log('ℹ️  User cancelled Apple Sign In');
        setIsOAuthLoading(false);
        return;
      }

      // Show error message
      const errorMessage = err?.error || err?.body?.message || err?.message || 'Apple sign-in failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email before proceeding
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsSubmittingMagic(true);

    try {
      // Check if user already exists before sending magic code
      const { data } = await db.queryOnce({ userProfiles: {} });
      const profiles = (data as any)?.userProfiles || [];

      // Find if any profile with this email exists (we'll match on email after auth)
      // For now, we'll check after they sign in
      setIsExistingUser(false); // Will be checked after sign-in

      await db.auth.sendMagicCode({ email });
      setSentEmail(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send magic code';
      setError(message);
    } finally {
      setIsSubmittingMagic(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifyingCode(true);

    try {
      // Sign in with magic code
      const result = await db.auth.signInWithMagicCode({ email, code });

      if (result) {
        // Wait a bit for auth to complete
        setTimeout(async () => {
          try {
            // Check if profile already exists
            const { data } = await db.queryOnce({ userProfiles: {} });
            const existingProfile = (data as any)?.userProfiles?.find(
              (p: any) => p.userId === result.user.id
            );

            // Only create profile if it doesn't exist AND name was provided
            if (!existingProfile && name.trim()) {
              await db.transact(
                db.tx.userProfiles[uuidv4()].update({
                  userId: result.user.id,
                  name: name.trim(),
                  createdAt: Date.now(),
                })
              );
            }
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
      setIsExistingUser(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      setError(message);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  if (!isOpen) return null;

  // Content component used by both inline and modal modes
  const AuthContent = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black">
          {sentEmail ? 'Check your email' : 'Sign In / Sign Up'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close dialog"
        >
          {inline ? <ArrowUp className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

              {!sentEmail ? (
                <>
                  {/* OAuth Providers */}
                  {(GOOGLE_CLIENT_ID || (APPLE_SERVICE_ID && APPLE_CLIENT_NAME)) ? (
                    <div className="flex gap-3 mb-6">
                      {/* Apple Sign In Button */}
                      {APPLE_SERVICE_ID && APPLE_CLIENT_NAME && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAppleSignIn}
                        disabled={isOAuthLoading}
                        className="flex-1 h-11 border-gray-300 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        <span>Apple</span>
                      </Button>
                    )}

                    {/* Google Sign In Button */}
                    {GOOGLE_CLIENT_ID && (
                      <div className="flex-1">
                        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                          <GoogleLogin
                            nonce={nonce}
                            onSuccess={async ({ credential }) => {
                              try {
                                setIsOAuthLoading(true);
                                setError('');
                                await db.auth.signInWithIdToken({
                                  clientName: GOOGLE_CLIENT_NAME,
                                  idToken: credential!,
                                  nonce,
                                });
                                onClose();
                              } catch (err: any) {
                                setError(err.body?.message || 'Google sign-in failed');
                              } finally {
                                setIsOAuthLoading(false);
                              }
                            }}
                            onError={() => {
                              setError('Google sign-in failed');
                              setIsOAuthLoading(false);
                            }}
                            useOneTap={false}
                            theme="outline"
                            size="large"
                            text="continue_with"
                            shape="rectangular"
                            width="100%"
                          />
                        </GoogleOAuthProvider>
                      </div>
                    )}
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> OAuth providers (Google/Apple Sign In) are not configured. Please use Magic Link authentication below.
                      </p>
                    </div>
                  )}

                  {/* Divider */}
                  {(GOOGLE_CLIENT_ID || (APPLE_SERVICE_ID && APPLE_CLIENT_NAME)) && (
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                      </div>
                    </div>
                  )}

                  {/* Magic Link Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter key unless the submit button is focused
                      if (e.key === 'Enter' && e.target !== e.currentTarget) {
                        const target = e.target as HTMLElement;
                        if (target.tagName !== 'BUTTON') {
                          e.preventDefault();
                        }
                      }
                    }}
                  >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What shall we call you? <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your first name"
                        disabled={isSubmittingMagic}
                        className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only needed if this is your first time signing in
                    </p>
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
                        disabled={isSubmittingMagic}
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
                    disabled={isSubmittingMagic}
                    className="w-full h-11 bg-black text-white font-medium hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isSubmittingMagic ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Send Magic Link'
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    We&apos;ll send you a magic link to sign in without a password
                  </p>
                </form>
                </>
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
                        disabled={isVerifyingCode}
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
                    disabled={isVerifyingCode}
                    className="w-full h-11 bg-black text-white font-medium hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isVerifyingCode ? (
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
    </>
  );

  // Inline mode: render content directly without modal wrapper or card
  if (inline) {
    return <AuthContent />;
  }

  // Modal mode: render with backdrop and positioning
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
              <AuthContent />
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
