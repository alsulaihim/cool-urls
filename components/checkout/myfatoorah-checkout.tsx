'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import type { PlanId } from '@/lib/pricing';

interface MyFatoorahCheckoutProps {
  planId: PlanId;
  planName: string;
  planPrice: number;
  userId: string;
  userEmail: string;
  userName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function MyFatoorahCheckout({
  planId,
  planName,
  planPrice,
  userId,
  userEmail,
  userName,
  onSuccess,
  onError,
}: MyFatoorahCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useEmbedded, setUseEmbedded] = useState(true);

  // Check if we should use embedded (not localhost)
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasNgrok = window.location.hostname.includes('ngrok');
    setUseEmbedded(!isLocalhost || hasNgrok);
  }, []);

  // Payment callback handler for embedded flow
  const handlePaymentCallback = useCallback(async (response: any) => {
    console.log('✅ MyFatoorah payment callback:', response);

    if (response.IsSuccess || response.isSuccess) {
      try {
        setIsProcessing(true);
        console.log('✅ Payment successful, creating subscription...');

        const subscriptionResponse = await fetch('/api/myfatoorah/subscription/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: response.sessionId || response.SessionId || sessionId,
            planId,
            userId,
            customerName: userName,
            customerEmail: userEmail,
            invoiceValue: planPrice,
          }),
        });

        if (!subscriptionResponse.ok) {
          const errorData = await subscriptionResponse.json();
          throw new Error(errorData.error || 'Failed to create subscription');
        }

        const subscriptionData = await subscriptionResponse.json();
        console.log('✅ Subscription created:', subscriptionData);

        if (subscriptionData.paymentURL && !subscriptionData.isDirectPayment) {
          window.location.href = subscriptionData.paymentURL;
        } else {
          onSuccess();
        }
      } catch (error) {
        console.error('❌ Subscription creation error:', error);
        onError(error instanceof Error ? error.message : 'Failed to create subscription');
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.error('❌ Payment failed:', response);
      const errorMessage = response.Message || response.message || 'Payment failed';
      onError(errorMessage);
      setIsProcessing(false);
    }
  }, [planId, userId, userName, userEmail, planPrice, sessionId, onSuccess, onError]);

  // Load MyFatoorah SDK script for embedded flow
  useEffect(() => {
    if (!useEmbedded || isScriptLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://demo.myfatoorah.com/payment/v1/session.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ MyFatoorah script loaded');
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load MyFatoorah script');
      setUseEmbedded(false); // Fallback to redirect
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [useEmbedded, isScriptLoaded]);

  // Initialize embedded payment session
  useEffect(() => {
    if (!useEmbedded || !isScriptLoaded) {
      setIsLoading(false);
      return;
    }

    const initializeSession = async () => {
      try {
        setIsLoading(true);
        console.log('🔵 Initializing MyFatoorah embedded session...');
        console.log('🔵 Current hostname:', window.location.hostname);
        console.log('🔵 useEmbedded:', useEmbedded);
        console.log('🔵 isScriptLoaded:', isScriptLoaded);

        const response = await fetch('/api/myfatoorah/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        console.log('✅ Session data:', data);
        setSessionId(data.sessionId);
        setCountryCode(data.countryCode);

        // Set up global callback
        (window as any).myFatoorahPaymentCallback = handlePaymentCallback;

        // Wait for SDK to be available
        let retries = 0;
        const checkSDK = setInterval(() => {
          retries++;
          console.log(`🔵 Checking for MyFatoorah SDK (attempt ${retries})...`);

          if (window.myfatoorah) {
            clearInterval(checkSDK);
            const config = {
              sessionId: data.sessionId,
              countryCode: data.countryCode,
              currencyCode: data.countryCode === 'KWT' ? 'KWD' : 'USD',
              amount: planPrice.toString(),
              callback: (window as any).myFatoorahPaymentCallback,
              containerId: 'myfatoorah-payment-container',
            };

            console.log('🔵 Initializing MyFatoorah SDK with config:', config);
            window.myfatoorah.init(config);
            console.log('✅ MyFatoorah SDK initialized');
            setIsLoading(false);
          } else if (retries > 10) {
            clearInterval(checkSDK);
            console.error('❌ MyFatoorah SDK not available after retries');
            setUseEmbedded(false);
            setIsLoading(false);
          }
        }, 500);

      } catch (error) {
        console.error('❌ Session error:', error);
        setUseEmbedded(false); // Fallback to redirect
        setIsLoading(false);
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useEmbedded, isScriptLoaded, userEmail, userId, planPrice, planName]);

  // Redirect flow handler
  const handleRedirectPayment = async () => {
    try {
      setIsLoading(true);
      console.log('🔵 Starting redirect payment...');

      const response = await fetch('/api/myfatoorah/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          customerName: userName,
          customerEmail: userEmail,
          invoiceValue: planPrice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const data = await response.json();

      if (data.paymentURL) {
        window.location.href = data.paymentURL;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
      setIsLoading(false);
    }
  };

  // Render embedded form
  if (useEmbedded) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
            <p className="text-sm text-gray-600 mt-1">
              Subscribing to {planName} - ${planPrice}/month
            </p>
          </div>

          {/* MyFatoorah Embedded Payment Container */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div
              id="myfatoorah-payment-container"
              className="min-h-[450px] p-6"
              style={{ overflow: 'visible' }}
            />
          </div>

          {/* Loading State */}
          {(isLoading || isProcessing) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin mr-2" />
              <span className="text-sm text-gray-600">
                {isLoading ? 'Loading payment form...' : 'Processing payment...'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Powered by MyFatoorah • PCI DSS Compliant</span>
        </div>
      </div>
    );
  }

  // Render redirect flow (fallback)
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          <p className="text-sm text-gray-600 mt-1">
            Subscribing to {planName} - ${planPrice}/month
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Payment with MyFatoorah
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Click below to continue to our secure payment page where you can pay with:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Credit & Debit Cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Apple Pay & Google Pay</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Local payment methods</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleRedirectPayment}
        disabled={isLoading}
        className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Continue to Secure Payment
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Powered by MyFatoorah • PCI DSS Compliant</span>
      </div>
    </div>
  );
}

// Extend Window interface for MyFatoorah
declare global {
  interface Window {
    myfatoorah?: {
      init: (config: {
        sessionId: string;
        countryCode: string;
        currencyCode: string;
        amount: string;
        callback: (response: any) => void;
        containerId: string;
      }) => void;
    };
  }
}
