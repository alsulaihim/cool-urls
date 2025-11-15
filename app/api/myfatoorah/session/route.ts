import { NextResponse } from 'next/server';
import { initiateSession } from '@/lib/myfatoorah';
import { db } from '@/lib/instant';

/**
 * POST /api/myfatoorah/session
 *
 * Initialize MyFatoorah payment session for embedded checkout
 */
export async function POST(request: Request) {
  try {
    const { user } = await db.auth.verifyToken({ token: request.headers.get('authorization')?.replace('Bearer ', '') || '' });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user email as customer identifier
    const customerIdentifier = user.email || user.id;

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
