import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RedirectClient from './redirect-client';

type Props = {
  params: { shortCode: string };
};

async function getUrlData(shortCode: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/redirect/${shortCode}`, {
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
  const data = await getUrlData(params.shortCode);

  if (!data) {
    return {
      title: '404 - Cool URLs',
      description: 'This short URL does not exist',
    };
  }

  const title = `${params.shortCode} - Cool URLs`;
  const description = `This short link redirects to ${data.originalUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${params.shortCode}`,
      siteName: 'Cool URLs',
      images: [
        {
          url: '/og-image.jpg',
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
      images: ['/og-image.jpg'],
    },
  };
}

export default function RedirectPage({ params }: Props) {
  return <RedirectClient shortCode={params.shortCode} />;
}
