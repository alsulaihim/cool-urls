import { NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/myfatoorah';
import { getDb } from '@/lib/instant-admin';

/**
 * POST /api/webhooks/myfatoorah
 *
 * Handle MyFatoorah webhook notifications for payment updates
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { Data } = body;

    if (!Data || !Data.InvoiceId) {
      console.log('MyFatoorah webhook: Missing invoice ID');
      return NextResponse.json({ received: true });
    }

    console.log('MyFatoorah webhook received:', {
      invoiceId: Data.InvoiceId,
      status: Data.InvoiceStatus,
    });

    // Get full payment status from MyFatoorah
    const paymentStatus = await getPaymentStatus(Data.InvoiceId);

    if (!paymentStatus.IsSuccess) {
      console.error('Failed to get payment status:', paymentStatus.Message);
      return NextResponse.json({ received: true });
    }

    const { InvoiceStatus, CustomerReference, UserDefinedField, InvoiceId } = paymentStatus.Data;
    const userId = CustomerReference;
    const planId = UserDefinedField;

    // Update subscription based on payment status
    const db = await getDb();

    if (InvoiceStatus === 'Paid') {
      // Payment successful - subscription already created, just confirm
      console.log(`Payment confirmed for user ${userId}, invoice ${InvoiceId}`);

      await db.transact([
        db.tx.subscriptions[userId].update({
          status: 'active',
          updatedAt: Date.now(),
        }),
      ]);
    } else if (InvoiceStatus === 'Failed' || InvoiceStatus === 'Expired') {
      // Payment failed - mark subscription as past_due or cancelled
      console.log(`Payment failed for user ${userId}, invoice ${InvoiceId}`);

      await db.transact([
        db.tx.subscriptions[userId].update({
          status: 'past_due',
          updatedAt: Date.now(),
        }),
      ]);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('MyFatoorah webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
