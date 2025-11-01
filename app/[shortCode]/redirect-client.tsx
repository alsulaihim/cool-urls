'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectClient({ shortCode }: { shortCode: string }) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent double execution in development (React Strict Mode)
    if (hasRedirected.current) {
      return;
    }
    hasRedirected.current = true;

    const fetchAndRedirect = async () => {
      try {
        // Capture URL parameters from the current page URL and forward them to the API
        const urlParams = new URLSearchParams(window.location.search);
        const apiUrl = `/api/redirect/${shortCode}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
          setError(true);
          return;
        }

        // Redirect to the original URL
        window.location.href = data.originalUrl;
      } catch (err) {
        setError(true);
      }
    };

    fetchAndRedirect();
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-4">404</h1>
          <p className="text-gray-600 mb-8">This short URL doesn't exist</p>
          <a
            href="/"
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
