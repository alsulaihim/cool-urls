// PayPal REST API configuration
// Note: @paypal/paypal-server-sdk doesn't support subscriptions yet
// So we use direct REST API calls instead

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  isProduction: boolean;
}

// Lazy singleton for config
let paypalConfig: PayPalConfig | null = null;

// Lazy singleton for access token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Get PayPal configuration
function getConfig(): PayPalConfig {
  if (!paypalConfig) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in environment variables');
    }

    // Allow explicit control of PayPal mode via PAYPAL_MODE env var
    const paypalMode = process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');
    const isProduction = paypalMode === 'production';

    console.log(`[PayPal] Initializing in ${isProduction ? 'Production' : 'Sandbox'} mode`);

    paypalConfig = {
      clientId,
      clientSecret,
      baseUrl: isProduction
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com',
      isProduction,
    };
  }

  return paypalConfig;
}

// Get or refresh access token
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const config = getConfig();
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  console.log('[PayPal] Fetching new access token');

  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Token fetch failed:', error);
    throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Set expiry to 1 minute before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  console.log('[PayPal] Access token obtained successfully');
  return accessToken;
}

// Helper to create a PayPal subscription
export async function createPayPalSubscription(params: {
  planId: string;
  userId: string;
  email?: string;
}) {
  const config = getConfig();
  const token = await getAccessToken();

  console.log('[PayPal] Creating subscription with plan:', params.planId);

  const requestBody = {
    plan_id: params.planId,
    ...(params.email && {
      subscriber: {
        email_address: params.email,
      },
    }),
    application_context: {
      brand_name: 'Cool URLs',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/subscription/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    },
    custom_id: params.userId, // Store userId for webhook processing
  };

  console.log('[PayPal] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${config.baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[PayPal] Subscription creation failed:', error);
      throw new Error(error.message || `PayPal API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[PayPal] Subscription created successfully:', result.id);
    return result;
  } catch (error: any) {
    console.error('[PayPal] Subscription creation failed:', error);
    throw new Error(`PayPal subscription creation failed: ${error.message}`);
  }
}

// Helper to get subscription details
export async function getPayPalSubscription(subscriptionId: string) {
  const config = getConfig();
  const token = await getAccessToken();

  const response = await fetch(`${config.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[PayPal] Get subscription failed:', error);
    throw new Error(error.message || `PayPal API error: ${response.statusText}`);
  }

  return await response.json();
}

// Helper to cancel a PayPal subscription
export async function cancelPayPalSubscription(subscriptionId: string, reason?: string) {
  const config = getConfig();
  const token = await getAccessToken();

  const response = await fetch(`${config.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      reason: reason || 'Customer requested cancellation',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[PayPal] Cancel subscription failed:', error);
    throw new Error(error.message || `PayPal API error: ${response.statusText}`);
  }

  // Cancel returns 204 No Content on success
  return response.status === 204 ? { success: true } : await response.json();
}

// Helper to suspend a PayPal subscription
export async function suspendPayPalSubscription(subscriptionId: string, reason?: string) {
  const config = getConfig();
  const token = await getAccessToken();

  const response = await fetch(`${config.baseUrl}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      reason: reason || 'Subscription suspended',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[PayPal] Suspend subscription failed:', error);
    throw new Error(error.message || `PayPal API error: ${response.statusText}`);
  }

  // Suspend returns 204 No Content on success
  return response.status === 204 ? { success: true } : await response.json();
}

// Helper to activate a suspended PayPal subscription
export async function activatePayPalSubscription(subscriptionId: string, reason?: string) {
  const config = getConfig();
  const token = await getAccessToken();

  const response = await fetch(`${config.baseUrl}/v1/billing/subscriptions/${subscriptionId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      reason: reason || 'Subscription reactivated',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[PayPal] Activate subscription failed:', error);
    throw new Error(error.message || `PayPal API error: ${response.statusText}`);
  }

  // Activate returns 204 No Content on success
  return response.status === 204 ? { success: true } : await response.json();
}

// Helper to verify webhook signature
export async function verifyPayPalWebhook(params: {
  webhookId: string;
  headers: Record<string, string>;
  body: any;
}) {
  const config = getConfig();
  const token = await getAccessToken();

  const requestBody = {
    transmission_id: params.headers['paypal-transmission-id'],
    transmission_time: params.headers['paypal-transmission-time'],
    cert_url: params.headers['paypal-cert-url'],
    auth_algo: params.headers['paypal-auth-algo'],
    transmission_sig: params.headers['paypal-transmission-sig'],
    webhook_id: params.webhookId,
    webhook_event: params.body,
  };

  const response = await fetch(`${config.baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[PayPal] Webhook verification failed:', error);
    throw new Error(error.message || `PayPal API error: ${response.statusText}`);
  }

  return await response.json();
}

// Get PayPal Client ID for frontend
export function getPayPalClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;

  if (!clientId) {
    throw new Error('PayPal Client ID is not configured');
  }

  return clientId;
}
