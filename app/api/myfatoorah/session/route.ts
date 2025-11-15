import { NextResponse } from 'next/server';
import { initiateSession } from '@/lib/myfatoorah';

/**
 * POST /api/myfatoorah/session
 *
 * Initialize MyFatoorah payment session for embedded checkout
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, userId } = body;

    if (!userEmail && !userId) {
      return NextResponse.json(
        { error: 'User email or ID required' },
        { status: 400 }
      );
    }

    // Get user email as customer identifier
    const customerIdentifier = userEmail || userId;

    // Initiate session with MyFatoorah
    const sessionData = await initiateSession(customerIdentifier);

    if (!sessionData.IsSuccess) {
      return NextResponse.json(
        { error: sessionData.Message || 'Failed to create session' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sessionId: sessionData.Data.SessionId,
      countryCode: sessionData.Data.CountryCode,
    });

  } catch (error) {
    console.error('MyFatoorah session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
