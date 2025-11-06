import { NextRequest, NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

/**
 * Admin API: Save/Update app settings
 *
 * POST /api/admin/settings
 *
 * Updates application-wide settings including payment provider availability
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as {
      settings: Array<{
        key: string;
        value: string;
      }>;
    };

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid settings array' },
        { status: 400 }
      );
    }

    // Validate settings format
    for (const setting of settings) {
      if (!setting.key || setting.value === undefined) {
        return NextResponse.json(
          { error: 'Each setting must have a key and value' },
          { status: 400 }
        );
      }
    }

    // Validate payment provider settings - at least one must be enabled
    const stripeEnabled = settings.find(s => s.key === 'payment.stripe.enabled');
    const paypalEnabled = settings.find(s => s.key === 'payment.paypal.enabled');

    if (stripeEnabled && paypalEnabled) {
      if (stripeEnabled.value === 'false' && paypalEnabled.value === 'false') {
        return NextResponse.json(
          { error: 'At least one payment provider must be enabled' },
          { status: 400 }
        );
      }
    }

    // Get current settings to check if they exist
    const { data: currentSettings } = await db.query({
      appSettings: {},
    });

    const now = Date.now();

    // Update or create each setting
    for (const setting of settings) {
      const existingSetting = currentSettings?.appSettings?.find(
        s => s.key === setting.key
      );

      if (existingSetting) {
        // Update existing setting
        await db.update({
          appSettings: {
            id: existingSetting.id,
            value: setting.value,
            updatedAt: now,
            updatedBy: 'admin', // In production, use actual admin user ID
          },
        });
      } else {
        // Create new setting
        await db.transact([
          db.tx.appSettings[db.id()].update({
            key: setting.key,
            value: setting.value,
            updatedAt: now,
            updatedBy: 'admin', // In production, use actual admin user ID
          }),
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Admin settings API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/settings
 *
 * Retrieves current app settings
 */
export async function GET() {
  try {
    const { data } = await db.query({
      appSettings: {},
    });

    // Convert settings array to object for easier use
    const settingsObj: Record<string, string> = {};
    if (data?.appSettings) {
      for (const setting of data.appSettings) {
        settingsObj[setting.key] = setting.value;
      }
    }

    return NextResponse.json({
      settings: settingsObj,
      raw: data?.appSettings || [],
    });
  } catch (error) {
    console.error('Get settings API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
