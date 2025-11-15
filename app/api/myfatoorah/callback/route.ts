import { NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/myfatoorah';

/**
 * GET /api/myfatoorah/callback
 *
 * Handle MyFatoorah payment callback after user completes payment
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const invoiceId = searchParams.get('Id');

    if (!invoiceId) {
      return NextResponse.redirect(new URL('/pricing?error=missing_invoice', request.url));
    }

    // Get payment status
    const paymentStatus = await getPaymentStatus(parseInt(invoiceId));

    if (!paymentStatus.IsSuccess) {
      return NextResponse.redirect(new URL('/pricing?error=payment_verification_failed', request.url));
    }

    const { InvoiceStatus } = paymentStatus.Data;

    if (InvoiceStatus === 'Paid') {
      // Payment successful - redirect to success page
      return NextResponse.redirect(new URL('/pricing?success=true', request.url));
    } else {
      // Payment failed or pending
      return NextResponse.redirect(new URL(`/pricing?error=payment_${InvoiceStatus.toLowerCase()}`, request.url));
    }

  } catch (error) {
    console.error('MyFatoorah callback error:', error);
    return NextResponse.redirect(new URL('/pricing?error=callback_failed', request.url));
  }
}
