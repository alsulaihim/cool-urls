'use client';

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

export function SetupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const isConfigured = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

  if (isConfigured || dismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              Setup Required: InstantDB not configured
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              To enable authentication and link management, please set up your InstantDB credentials.{' '}
              <span className="font-semibold">See SETUP.md or QUICKSTART.md in the project root for instructions.</span>
            </p>
            <div className="mt-2 text-xs text-yellow-600 font-mono bg-yellow-100 p-2 rounded">
              <p>1. Create account at https://instantdb.com</p>
              <p>2. Create .env.local file with your credentials</p>
              <p>3. Restart the dev server</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-900 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
