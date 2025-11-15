import { NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/myfatoorah';

/**
 * GET /api/myfatoorah/callback
 *
 * Handle MyFatoorah payment callback after user completes payment
 */
export async function GET(request: Request) {
  try {
    console.log('🔵 MyFatoorah callback received:', request.url);

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const invoiceId = searchParams.get('Id');

    console.log('🔵 Callback params:', { paymentId, invoiceId });

    if (!invoiceId) {
      console.error('❌ Missing invoice ID in callback');
      return NextResponse.redirect(new URL('/pricing?error=missing_invoice', request.url));
    }

    // Get payment status
    console.log('🔵 Fetching payment status for invoice:', invoiceId);
    const paymentStatus = await getPaymentStatus(parseInt(invoiceId));
    console.log('🔵 Payment status response:', JSON.stringify(paymentStatus, null, 2));

    if (!paymentStatus.IsSuccess) {
      console.error('❌ Payment status check failed:', paymentStatus.Message);
      return NextResponse.redirect(new URL('/pricing?error=payment_verification_failed', request.url));
    }

    const { InvoiceStatus } = paymentStatus.Data;
    console.log('🔵 Invoice status:', InvoiceStatus);

    if (InvoiceStatus === 'Paid') {
      // Payment successful - redirect to success page
      console.log('✅ Payment verified as paid, redirecting to success');
      return NextResponse.redirect(new URL('/pricing?success=true', request.url));
    } else {
      // Payment failed or pending
      console.log('⚠️ Payment not paid, status:', InvoiceStatus);
      return NextResponse.redirect(new URL(`/pricing?error=payment_${InvoiceStatus.toLowerCase()}`, request.url));
    }

  } catch (error) {
    console.error('❌ MyFatoorah callback error:', error);
    return NextResponse.redirect(new URL('/pricing?error=callback_failed', request.url));
  }
}
