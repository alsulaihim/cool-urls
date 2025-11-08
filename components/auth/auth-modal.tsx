'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
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

interface AuthContentProps {
  email: string;
  setEmail: (email: string) => void;
  name: string;
  setName: (name: string) => void;
  sentEmail: boolean;
  onClose: () => void;
  error: string;
  showGoogle: boolean;
  isOAuthLoading: boolean;
  isSubmittingMagic: boolean;
  code: string;
  setCode: (code: string) => void;
  isVerifyingCode: boolean;
  isExistingUser: boolean;
  handleAppleSignIn: () => void;
  handleSubmit: (e?: React.FormEvent | React.MouseEvent) => void;
  handleCodeSubmit: () => void;
  setShowGoogle: (show: boolean) => void;
  setSentEmail: (sent: boolean) => void;
  setError: (error: string) => void;
  nonce: string;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_NAME = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_NAME || 'google-web';
const APPLE_CLIENT_NAME = process.env.NEXT_PUBLIC_APPLE_CLIENT_NAME || 'apple-web';
const APPLE_SERVICE_ID = process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || '';


// Extracted AuthContent component to prevent recreation on state changes
// This fixes the input losing focus issue after typing the first character
const AuthContent = memo(({
  email,
  setEmail,
  name,
  setName,
  sentEmail,
  onClose,
  error,
  showGoogle,
  isOAuthLoading,
  isSubmittingMagic,
  code,
  setCode,
  isVerifyingCode,
  isExistingUser,
  handleAppleSignIn,
  handleSubmit,
  handleCodeSubmit,
  setShowGoogle,
  setSentEmail,
  setError,
  nonce
}: AuthContentProps) => (
  <>
    <style jsx global>{`
      .custom-google-btn {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .custom-google-btn > div {
        width: 100% !important;
      }
      .custom-google-btn iframe {
        width: 100% !important;
        height: 44px !important;
      }
    `}</style>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-black">
        {sentEmail ? 'Check your email' : 'Sign In / Sign Up'}
      </h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
        aria-label="Close dialog"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {!sentEmail ? (
      <>
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleAppleSignIn}
            disabled={isOAuthLoading}
            className="w-full h-11 border-gray-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.89-3.08.42-1.09-.48-2.09-.49-3.24 0-1.44.62-2.2.51-3.06-.42C2.79 15.26 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74.78 0 2.24-.91 3.78-.79 1.04.06 1.98.45 2.68 1.39-2.44 1.45-2.08 4.63.44 5.54-.52 1.36-.74 1.88-1.98 3.09zM11.89 7.15c-.04-2.01 1.64-3.64 3.62-3.82.22 2.19-2 3.82-3.62 3.82z"/>
            </svg>
            Apple
          </Button>

          {showGoogle ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <div className="w-full custom-google-btn" style={{ display: 'none' }}>
                <GoogleLogin
                  nonce={nonce}
                  onSuccess={async (credentialResponse) => {
                    if (!credentialResponse.credential) {
                      setError('No credentials received');
                      return;
                    }

                    try {
                      await db.auth.signInWithIdToken({
                        clientName: GOOGLE_CLIENT_NAME,
                        idToken: credentialResponse.credential,
                        nonce: nonce,
                      });

                      onClose();
                      setEmail('');
                      setName('');
                      setCode('');
                      setSentEmail(false);
                    } catch (err) {
                      console.error('Google auth error:', err);
                      setError('Authentication failed. Please try again.');
                    }
                  }}
                  onError={() => {
                    setError('Google Sign-In failed');
                  }}
                  useOneTap={false}
                  auto_select={false}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const iframe = document.querySelector('.custom-google-btn iframe');
                  if (iframe) {
                    (iframe as HTMLElement).click();
                  }
                }}
                disabled={isOAuthLoading}
                className="w-full h-11 border-gray-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </GoogleOAuthProvider>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={true}
              className="w-full h-11 border-gray-300 opacity-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Sign-In Loading...
            </Button>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What shall we call you? <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                key="name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  console.debug('[AuthModal] name onChange START', {
                    value: e.target.value,
                    isSubmittingMagic,
                    disabled: isSubmittingMagic
                  });
                  setName(e.target.value);
                  console.debug('[AuthModal] name onChange END');
                }}
                placeholder="Your first name"
                disabled={isSubmittingMagic}
                className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                autoComplete="given-name"
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
                key="email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  console.debug('[AuthModal] email change');
                  setEmail(e.target.value);
                }}
                placeholder="you@example.com"
                required
                disabled={isSubmittingMagic}
                className="pl-10 h-11 border-gray-300 rounded-md focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black transition-colors"
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <Button
            type="button"
            onClick={(e) => {
              console.debug('[AuthModal] Button clicked explicitly');
              handleSubmit(e);
            }}
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
        </div>
      </>
    ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-4"
      >
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
              placeholder="000000"
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
          type="button"
          onClick={handleCodeSubmit}
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
          className="w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Use a different email
        </button>
      </form>
    )}
  </>
));

AuthContent.displayName = 'AuthContent';

export function AuthModal({ isOpen, onClose, inline = false }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  // Separate loading states to avoid cross-disabling inputs
  const [isSubmittingMagic, setIsSubmittingMagic] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showGoogle, setShowGoogle] = useState(true);
  const [sentEmail, setSentEmail] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [nonce] = useState(crypto.randomUUID());

  // Refs to maintain focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Initialize Apple Sign-In SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).AppleID && APPLE_SERVICE_ID) {
      const AppleID = (window as any).AppleID;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Don't initialize on localhost as Apple doesn't support it
      if (!isLocalhost) {
        try {
          AppleID.auth.init({
            clientId: APPLE_SERVICE_ID,
            scope: 'name email',
            redirectURI: window.location.origin,
            usePopup: true
          });
          console.debug('Apple Sign-In SDK initialized on mount');
        } catch (err) {
          console.debug('Apple Sign-In initialization:', err);
        }
      }
    }
  }, []);

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

      // Check for localhost
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        setError('Apple Sign In is not available on localhost. Please use ngrok tunnel, or test on your deployed environment.');
        setIsOAuthLoading(false);
        return;
      }

      const AppleID = (window as any).AppleID;
      const redirectURI = window.location.origin;

      console.log('🍎 Initializing Apple Sign In with:', {
        clientId: APPLE_SERVICE_ID,
        redirectURI,
        clientName: APPLE_CLIENT_NAME,
      });

      // Initialize Apple ID
      try {
        await AppleID.auth.init({
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

      console.log('🔐 Generated nonce:', nonce);
      console.log('🚀 Calling Apple Sign In...');

      // Call Apple Sign In with minimal config
      let response;
      try {
        response = await AppleID.auth.signIn({
          nonce: nonce,
          usePopup: true,
        });
        console.log('✅ Apple Sign In response received:', JSON.stringify(response, null, 2));
      } catch (signInErr: any) {
        // Check if it's a user cancellation
        if (signInErr?.error === 'popup_closed_by_user' || signInErr?.error === 'user_cancelled_authorize') {
          console.log('ℹ️  Apple Sign In popup was closed');
          setIsOAuthLoading(false);
          return;
        }

        console.error('❌ Apple signIn() failed:', signInErr);
        throw signInErr;
      }

      // Check if user cancelled or missing data
      if (!response || !response.authorization || !response.authorization.id_token) {
        console.log('❌ Apple Sign In cancelled by user or missing data. Response:', response);
        setError('Apple Sign In was not completed. This may be due to domain configuration. Please try Magic Link authentication instead.');
        setIsOAuthLoading(false);
        return;
      }

      console.log('✅ Got ID token from Apple');
      console.log('🔄 Signing in with InstantDB...');

      // Sign in directly with InstantDB using the ID token
      try {
        const result = await db.auth.signInWithIdToken({
          clientName: APPLE_CLIENT_NAME,
          idToken: response.authorization.id_token,
          nonce: nonce,
        });
        console.log('✅ InstantDB sign in result:', result);
      } catch (dbErr) {
        console.error('❌ InstantDB sign in failed:', dbErr);
        throw dbErr;
      }

      onClose();
      // Reset form
      setEmail('');
      setName('');
      setCode('');
      setSentEmail(false);
    } catch (err: any) {
      console.error('❌ Apple Sign In error:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error keys:', err ? Object.keys(err) : 'null');
      console.error('❌ Error.error value:', err?.error);
      console.error('❌ Full error structure:', JSON.stringify(err, null, 2));

      // Check if it's a user cancellation
      if (err?.error === 'popup_closed_by_user' || err?.error === 'user_cancelled_authorize') {
        setError('Sign in was cancelled');
      } else if (err instanceof Error) {
        setError(err.message);
      } else if (err?.error) {
        setError('Apple Sign In failed. Please try again.');
      } else {
        setError('Apple Sign In failed. Please try again.');
      }
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    console.debug('[AuthModal] handleSubmit START', {
      email,
      eventType: e?.type,
      target: e ? (e.target as HTMLElement)?.tagName : 'NO_EVENT',
      currentTarget: e ? (e.currentTarget as HTMLElement)?.tagName : 'NO_EVENT',
      isSubmittingMagic
    });

    // Prevent duplicate submissions
    if (isSubmittingMagic) {
      console.debug('[AuthModal] handleSubmit BLOCKED - already submitting');
      return;
    }

    // Stop event propagation to prevent any bubbling issues
    if (e) {
      e.stopPropagation();
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmittingMagic(true);
    setError('');

    try {
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setIsExistingUser(data.exists);

      // Send magic code using InstantDB
      await db.auth.sendMagicCode({ email });
      setSentEmail(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setIsSubmittingMagic(false);
    }

    console.debug('[AuthModal] handleSubmit END', { sentEmail, error });
  };

  const handleCodeSubmit = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsVerifyingCode(true);
    setError('');

    try {
      // Verify the magic code
      await db.auth.signInWithMagicCode({ email, code });

      // Create profile if user provided a name and is a new user
      if (name && !isExistingUser) {
        // Small delay to ensure auth is fully processed
        setTimeout(async () => {
          try {
            // Use email as userId (InstantDB uses email as the user ID for magic link auth)
            const userId = email;
            // Try to create profile - will fail silently if already exists
            await db.transact(
              db.tx.userProfiles[uuidv4()].update({
                userId: userId,
                name: name.trim() || 'Anonymous',
                createdAt: Date.now(),
              })
            );
          } catch (profileError) {
            // Profile might already exist, which is fine
            console.debug('Profile creation attempt:', profileError);
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

  // Inline mode: render content directly without modal wrapper or card
  if (inline) {
    return (
      <AuthContent
        email={email}
        setEmail={setEmail}
        name={name}
        setName={setName}
        sentEmail={sentEmail}
        onClose={onClose}
        error={error}
        showGoogle={showGoogle}
        isOAuthLoading={isOAuthLoading}
        isSubmittingMagic={isSubmittingMagic}
        code={code}
        setCode={setCode}
        isVerifyingCode={isVerifyingCode}
        isExistingUser={isExistingUser}
        handleAppleSignIn={handleAppleSignIn}
        handleSubmit={handleSubmit}
        handleCodeSubmit={handleCodeSubmit}
        setShowGoogle={setShowGoogle}
        setSentEmail={setSentEmail}
        setError={setError}
        nonce={nonce}
      />
    );
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
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md"
          >
            <Card className="p-6">
              <AuthContent
                email={email}
                setEmail={setEmail}
                name={name}
                setName={setName}
                sentEmail={sentEmail}
                onClose={onClose}
                error={error}
                showGoogle={showGoogle}
                isOAuthLoading={isOAuthLoading}
                isSubmittingMagic={isSubmittingMagic}
                code={code}
                setCode={setCode}
                isVerifyingCode={isVerifyingCode}
                isExistingUser={isExistingUser}
                handleAppleSignIn={handleAppleSignIn}
                handleSubmit={handleSubmit}
                handleCodeSubmit={handleCodeSubmit}
                setShowGoogle={setShowGoogle}
                setSentEmail={setSentEmail}
                setError={setError}
                nonce={nonce}
              />
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}