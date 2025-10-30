import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { urlStore } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const { url, prefix } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generate short code with 2-character suffix for cleaner look
    const randomCode = nanoid(2);
    const shortCode = prefix ? `${prefix}-${randomCode}` : randomCode;

    // Check if short code already exists (rare but possible)
    if (urlStore.exists(shortCode)) {
      return NextResponse.json(
        { error: 'Short code already exists, please try again' },
        { status: 409 }
      );
    }

    const shortUrl = {
      id: nanoid(),
      originalUrl: url,
      shortCode,
      prefix,
      createdAt: new Date(),
      clicks: 0,
    };

    urlStore.add(shortUrl);

    const baseUrl = request.nextUrl.origin;
    return NextResponse.json({
      shortUrl: `${baseUrl}/${shortCode}`,
      shortCode,
      originalUrl: url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create short URL' },
      { status: 500 }
    );
  }
}
