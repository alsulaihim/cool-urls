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
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
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
            cardHeight: 180,
            input: {
              color: 'black',
              fontSize: '14px',
              fontFamily: 'sans-serif',
              inputHeight: '32px',
              inputMargin: '8px',
              borderColor: 'hsl(var(--border))',
              borderWidth: '1px',
              borderRadius: '0.5rem',
              boxShadow: 'none',
              placeHolder: {
                holderName: 'Name on Card',
                cardNumber: 'Card Number',
                expiryDate: 'MM/YY',
                securityCode: 'CVV',
              },
            },
            label: {
              display: true,
              color: 'hsl(var(--foreground))',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'sans-serif',
              text: {
                holderName: 'Cardholder Name',
                cardNumber: 'Card Number',
                expiryDate: 'Expiry Date',
                securityCode: 'CVV',
              },
            },
            error: {
              borderColor: 'hsl(var(--destructive))',
              borderRadius: '0.5rem',
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
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">
          Payment Details
        </div>
        <div className="text-xs text-gray-500 mb-4">
          Subscribing to {planName} - ${planPrice}/month
        </div>

        {/* MyFatoorah Embedded Payment Card */}
        <div
          id="card-element"
          className="min-h-[200px] border border-gray-200 rounded-lg p-4"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || !sessionId}
        className="w-full h-11"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe to ${planName}`
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Powered by MyFatoorah • Secure payment processing
      </p>
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
