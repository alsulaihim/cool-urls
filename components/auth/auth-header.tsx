'use client';

import { useState } from 'react';
import { db } from '@/lib/instant';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';
import { LogOut, User, BarChart3, Zap, Crown, Rocket, Star, Sparkles, TrendingUp, Flame, Gem } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/useSubscription';
import { getPlanById } from '@/lib/pricing';

export function AuthHeader() {
  const { isLoading, user, error } = db.useAuth();
  const { subscription, isLoading: subLoading } = useSubscription(user?.id);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const currentPlan = subscription ? getPlanById(subscription.planId) : getPlanById('free');

  const handleSignOut = () => {
    db.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <header className="border-b border-gray-200 bg-white relative z-50">
        <div className="container mx-auto px-4 py-4 flex justify-center sm:justify-between items-center">
          <Link href="/" className="text-2xl font-semibold font-[family-name:var(--font-orbitron)] lowercase text-pink-500">
            cool urls
          </Link>
          <div className="w-20 h-10 bg-gray-100 rounded animate-pulse hidden sm:block" />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white relative z-50">
        <div className="container mx-auto px-4 py-4 flex justify-center sm:justify-between items-center relative">
          <Link href="/" className="text-2xl font-semibold font-[family-name:var(--font-orbitron)] lowercase transition-opacity hover:opacity-80 text-pink-500">
            cool urls
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 absolute sm:relative right-4 sm:right-0">
            {user ? (
              <>
                <Link href="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" className="text-gray-600 hover:text-black hover:bg-gray-50">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/pricing" className="hidden sm:block">
                  <Button variant="ghost" className="text-gray-600 hover:text-black hover:bg-gray-50">
                    <Zap className="w-4 h-4 mr-2" />
                    Pricing
                  </Button>
                </Link>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Plan Badge */}
                  {!subLoading && currentPlan && (
                    <Link href="/pricing">
                      <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 ${
                        currentPlan.id === 'premium'
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-300'
                          : currentPlan.id === 'scale'
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : currentPlan.id === 'enterprise'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : currentPlan.id === 'business'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : currentPlan.id === 'growth'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : currentPlan.id === 'starter'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {currentPlan.id === 'premium' && <Gem className="w-3 h-3" />}
                        {currentPlan.id === 'scale' && <Flame className="w-3 h-3" />}
                        {currentPlan.id === 'enterprise' && <Crown className="w-3 h-3" />}
                        {currentPlan.id === 'business' && <TrendingUp className="w-3 h-3" />}
                        {currentPlan.id === 'growth' && <Rocket className="w-3 h-3" />}
                        {currentPlan.id === 'starter' && <Sparkles className="w-3 h-3" />}
                        {currentPlan.id === 'free' && <Star className="w-3 h-3" />}
                        <span>{currentPlan.name}</span>
                      </div>
                    </Link>
                  )}
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
              <>
                <Link href="/pricing" className="hidden sm:block">
                  <Button variant="ghost" className="text-gray-600 hover:text-black hover:bg-gray-50">
                    <Zap className="w-4 h-4 mr-2" />
                    Pricing
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  data-auth-trigger
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
