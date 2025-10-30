'use client';

import { useState } from 'react';
import { db } from '@/lib/instant';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';
import { LogOut, User, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AuthHeader() {
  const { isLoading, user, error } = db.useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    db.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <header className="border-b border-gray-200 bg-white relative z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-semibold font-[family-name:var(--font-orbitron)] lowercase text-pink-500">
            cool urls
          </Link>
          <div className="w-20 h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white relative z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-semibold font-[family-name:var(--font-orbitron)] lowercase transition-opacity hover:opacity-80 text-pink-500">
            cool urls
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" className="text-gray-600 hover:text-black hover:bg-gray-50">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="max-w-[150px] truncate">{user.email}</span>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                data-auth-trigger
                className="bg-black text-white hover:bg-gray-800"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
