'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load MyFatoorah SDK script
  useEffect(() => {
    if (isScriptLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://demo.myfatoorah.com/cardview/v2/session.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      onError('Failed to load MyFatoorah payment script');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isScriptLoaded, onError]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);

      // Create payment session
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setCountryCode(data.countryCode);

      // Initialize MyFatoorah embedded payment
      if (window.myFatoorah) {
        window.myFatoorah.init({
          countryCode: data.countryCode,
          sessionId: data.sessionId,
          cardViewId: 'card-element',
          style: {
            cardHeight: 300,
            direction: 'ltr',
            input: {
              color: '#000000',
              fontSize: '15px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              inputHeight: '42px',
              inputMargin: '12px',
              borderColor: '#e5e7eb',
              borderWidth: '1px',
              borderRadius: '8px',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              placeHolder: {
                holderName: 'Name on Card',
                cardNumber: 'Card Number',
                expiryDate: 'MM/YY',
                securityCode: 'CVV',
              },
            },
            label: {
              display: true,
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              text: {
                holderName: 'Name on Card',
                cardNumber: 'Card Number',
                expiryDate: 'Expiry Date',
                securityCode: 'Security Code',
              },
            },
            error: {
              borderColor: '#ef4444',
              borderRadius: '8px',
            },
          },
        });
      }

    } catch (error) {
      console.error('Session initialization error:', error);
      onError(error instanceof Error ? error.message : 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!sessionId || !isScriptLoaded || !window.myFatoorah) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Submit payment to MyFatoorah
      window.myFatoorah.submit().then(async (response: any) => {
        if (response.IsSuccess) {
          // Create subscription in our database
          const subscriptionResponse = await fetch('/api/myfatoorah/subscription/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              planId,
              userId,
              customerName: userName,
              customerEmail: userEmail,
              invoiceValue: planPrice,
              recurringId: response.Data.RecurringId,
            }),
          });

          if (!subscriptionResponse.ok) {
            throw new Error('Failed to create subscription');
          }

          const subscriptionData = await subscriptionResponse.json();

          // If payment requires redirect (3DS), redirect user
          if (subscriptionData.paymentURL && !subscriptionData.isDirectPayment) {
            window.location.href = subscriptionData.paymentURL;
          } else {
            // Payment completed directly
            onSuccess();
          }
        } else {
          onError(response.Message || 'Payment failed');
        }
      }).catch((error: any) => {
        console.error('Payment submission error:', error);
        onError('Payment submission failed');
      });

    } catch (error) {
      console.error('Payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isScriptLoaded) {
      initializeSession();
    }
  }, [isScriptLoaded]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          <p className="text-sm text-gray-600 mt-1">
            Subscribing to {planName} - ${planPrice}/month
          </p>
        </div>

        {/* MyFatoorah Embedded Payment Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div
            id="card-element"
            className="min-h-[320px] p-6"
          />
        </div>

        {!sessionId && isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Initializing payment form...</span>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || !sessionId}
        className="w-full h-12 text-base font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Subscribe to ${planName}`
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Powered by MyFatoorah • Secure payment processing</span>
      </div>
    </form>
  );
}

// Extend Window interface for MyFatoorah
declare global {
  interface Window {
    myFatoorah?: {
      init: (config: any) => void;
      submit: () => Promise<any>;
    };
  }
}
