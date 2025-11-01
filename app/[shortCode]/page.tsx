import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RedirectClient from './redirect-client';

type Props = {
  params: Promise<{ shortCode: string }>;
};

async function getUrlData(shortCode: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Use url-data endpoint which doesn't track clicks (for metadata only)
    const response = await fetch(`${baseUrl}/api/url-data/${shortCode}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortCode } = await params;
  const data = await getUrlData(shortCode);

  if (!data) {
    return {
      title: '404 - Cool URLs',
      description: 'This short URL does not exist',
    };
  }

  // Get the base URL for absolute URLs in Open Graph tags
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const ogImageUrl = `${baseUrl}/og-image.jpg`;

  const title = `${shortCode} - Cool URLs`;
  const description = `This short link redirects to ${data.originalUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${shortCode}`,
      siteName: 'Cool URLs',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Cool URLs - URL Shortener',
          type: 'image/jpeg',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function RedirectPage({ params }: Props) {
  const { shortCode } = await params;
  return <RedirectClient shortCode={shortCode} />;
}
