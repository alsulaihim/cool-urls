/**
 * MyFatoorah Payment Integration SDK
 *
 * Provides inline embedded payment processing for worldwide customers
 * Supports recurring subscriptions, card saving, and multiple payment methods
 */

const MYFATOORAH_API_KEY = process.env.MYFATOORAH_API_KEY;
const MYFATOORAH_MODE = process.env.MYFATOORAH_MODE || 'test';
const NEXT_PUBLIC_MYFATOORAH_ENABLED = process.env.NEXT_PUBLIC_MYFATOORAH_ENABLED === 'true';

// API Base URLs
const API_URLS = {
  test: 'https://apitest.myfatoorah.com',
  production: 'https://api.myfatoorah.com',
};

const MYFATOORAH_API_BASE = API_URLS[MYFATOORAH_MODE as keyof typeof API_URLS] || API_URLS.test;

export interface MyFatoorahConfig {
  apiKey: string;
  mode: 'test' | 'production';
}

export interface InitiateSessionResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: {
    SessionId: string;
    CountryCode: string;
    UserDefinedField: string;
  };
}

export interface ExecutePaymentRequest {
  SessionId: string;
  InvoiceValue: number;
  CustomerName: string;
  CustomerEmail: string;
  CallBackUrl: string;
  ErrorUrl: string;
  Language: string;
  CustomerReference?: string;
  UserDefinedField?: string;
  DisplayCurrencyIso?: string;
  MobileCountryCode?: string;
  CustomerMobile?: string;
  CustomerCivilId?: string;
  CustomerAddress?: {
    Block?: string;
    Street?: string;
    HouseBuildingNo?: string;
    Address?: string;
    AddressInstructions?: string;
  };
}

export interface ExecutePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: {
    InvoiceId: number;
    IsDirectPayment: boolean;
    PaymentURL: string;
    CustomerReference: string;
    UserDefinedField: string;
    RecurringId: string;
  };
}

export interface PaymentStatusResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: {
    InvoiceId: number;
    InvoiceStatus: string;
    InvoiceReference: string;
    CustomerReference: string;
    CreatedDate: string;
    ExpiryDate: string;
    InvoiceValue: number;
    Comments: string;
    CustomerName: string;
    CustomerMobile: string;
    CustomerEmail: string;
    UserDefinedField: string;
    InvoiceTransactions: Array<{
      TransactionDate: string;
      PaymentGateway: string;
      ReferenceId: string;
      TrackId: string;
      TransactionId: string;
      PaymentId: string;
      AuthorizationId: string;
      TransactionStatus: string;
      TransactionValue: string;
      CustomerServiceCharge: string;
      DueValue: string;
      PaidCurrency: string;
      PaidCurrencyValue: string;
      Currency: string;
      Error: string;
      ErrorCode: string;
      CardNumber: string;
      RecurringId: string;
    }>;
  };
}

/**
 * Initialize MyFatoorah payment session
 */
export async function initiateSession(
  customerIdentifier?: string
): Promise<InitiateSessionResponse> {
  if (!MYFATOORAH_API_KEY) {
    throw new Error('MyFatoorah API key is not configured');
  }

  const response = await fetch(`${MYFATOORAH_API_BASE}/v2/InitiateSession`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      CustomerIdentifier: customerIdentifier || '',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initiate session: ${error}`);
  }

  return response.json();
}

/**
 * Execute payment with session
 */
export async function executePayment(
  request: ExecutePaymentRequest
): Promise<ExecutePaymentResponse> {
  if (!MYFATOORAH_API_KEY) {
    throw new Error('MyFatoorah API key is not configured');
  }

  const response = await fetch(`${MYFATOORAH_API_BASE}/v2/ExecutePayment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to execute payment: ${error}`);
  }

  return response.json();
}

/**
 * Get payment status
 */
export async function getPaymentStatus(
  invoiceId: number
): Promise<PaymentStatusResponse> {
  if (!MYFATOORAH_API_KEY) {
    throw new Error('MyFatoorah API key is not configured');
  }

  const response = await fetch(
    `${MYFATOORAH_API_BASE}/v2/GetPaymentStatus`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Key: invoiceId.toString(),
        KeyType: 'InvoiceId',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get payment status: ${error}`);
  }

  return response.json();
}

/**
 * Create recurring payment (subscription)
 */
export async function createRecurringPayment(params: {
  recurringId: string;
  invoiceValue: number;
  customerName: string;
  customerEmail: string;
  customerReference: string;
}): Promise<ExecutePaymentResponse> {
  if (!MYFATOORAH_API_KEY) {
    throw new Error('MyFatoorah API key is not configured');
  }

  const response = await fetch(`${MYFATOORAH_API_BASE}/v2/ExecutePayment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      RecurringId: params.recurringId,
      InvoiceValue: params.invoiceValue,
      CustomerName: params.customerName,
      CustomerEmail: params.customerEmail,
      CustomerReference: params.customerReference,
      Language: 'en',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create recurring payment: ${error}`);
  }

  return response.json();
}

/**
 * Check if MyFatoorah is enabled
 */
export function isMyFatoorahEnabled(): boolean {
  return NEXT_PUBLIC_MYFATOORAH_ENABLED && !!MYFATOORAH_API_KEY;
}

/**
 * Get MyFatoorah mode
 */
export function getMyFatoorahMode(): 'test' | 'production' {
  return MYFATOORAH_MODE as 'test' | 'production';
}

/**
 * Get client-side configuration
 */
export function getClientConfig() {
  return {
    enabled: isMyFatoorahEnabled(),
    mode: getMyFatoorahMode(),
    apiBase: MYFATOORAH_API_BASE,
  };
}
