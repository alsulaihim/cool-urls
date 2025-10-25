import { NextResponse } from 'next/server';
import { urlStore } from '@/lib/store';

export async function GET() {
  const urls = urlStore.getAll();
  return NextResponse.json({ urls });
}
