import { Client as PayPalClient, Environment } from '@paypal/paypal-server-sdk';

// Lazy singleton instance
let paypalInstance: PayPalClient | null = null;

// Get PayPal instance with lazy initialization
export function getPayPal(): PayPalClient {
  if (!paypalInstance) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!clientId || !clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in environment variables');
    }

    paypalInstance = new PayPalClient({
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret,
      },
      environment: isProduction ? Environment.Production : Environment.Sandbox,
      logging: {
        logLevel: 'info',
        logRequest: { logBody: true },
        logResponse: { logHeaders: true },
      },
    });
  }

  return paypalInstance;
}

// Helper to create a PayPal subscription
export async function createPayPalSubscription(params: {
  planId: string;
  userId: string;
  email?: string;
}) {
  const paypal = getPayPal();

  const request = {
    body: {
      planId: params.planId,
      subscriber: params.email ? {
        emailAddress: params.email,
      } : undefined,
      applicationContext: {
        brandName: 'Cool URLs',
        locale: 'en-US',
        shippingPreference: 'NO_SHIPPING',
        userAction: 'SUBSCRIBE_NOW',
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/subscription/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      },
      customId: params.userId, // Store userId for webhook processing
    },
  };

  const response = await paypal.subscriptions.subscriptionsCreate(request);
  return response.result;
}

// Helper to get subscription details
export async function getPayPalSubscription(subscriptionId: string) {
  const paypal = getPayPal();

  const response = await paypal.subscriptions.subscriptionsGet({
    subscriptionId,
  });

  return response.result;
}

// Helper to cancel a PayPal subscription
export async function cancelPayPalSubscription(subscriptionId: string, reason?: string) {
  const paypal = getPayPal();

  const request = {
    subscriptionId,
    body: {
      reason: reason || 'Customer requested cancellation',
    },
  };

  const response = await paypal.subscriptions.subscriptionsCancel(request);
  return response.result;
}

// Helper to suspend a PayPal subscription
export async function suspendPayPalSubscription(subscriptionId: string, reason?: string) {
  const paypal = getPayPal();

  const request = {
    subscriptionId,
    body: {
      reason: reason || 'Subscription suspended',
    },
  };

  const response = await paypal.subscriptions.subscriptionsSuspend(request);
  return response.result;
}

// Helper to activate a suspended PayPal subscription
export async function activatePayPalSubscription(subscriptionId: string, reason?: string) {
  const paypal = getPayPal();

  const request = {
    subscriptionId,
    body: {
      reason: reason || 'Subscription reactivated',
    },
  };

  const response = await paypal.subscriptions.subscriptionsActivate(request);
  return response.result;
}

// Helper to verify webhook signature
export async function verifyPayPalWebhook(params: {
  webhookId: string;
  headers: Record<string, string>;
  body: any;
}) {
  const paypal = getPayPal();

  const request = {
    body: {
      transmissionId: params.headers['paypal-transmission-id'],
      transmissionTime: params.headers['paypal-transmission-time'],
      certUrl: params.headers['paypal-cert-url'],
      authAlgo: params.headers['paypal-auth-algo'],
      transmissionSig: params.headers['paypal-transmission-sig'],
      webhookId: params.webhookId,
      webhookEvent: params.body,
    },
  };

  const response = await paypal.webhooks.verifyWebhookSignature(request);
  return response.result;
}

// Get PayPal Client ID for frontend
export function getPayPalClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;

  if (!clientId) {
    throw new Error('PayPal Client ID is not configured');
  }

  return clientId;
}
