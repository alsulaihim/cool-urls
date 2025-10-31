'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/instant';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Link2, 
  BarChart3, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/urls', label: 'URLs', icon: Link2 },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

/**
 * Admin Layout Component
 * 
 * Provides the admin panel layout with:
 * - Sidebar navigation
 * - Authentication check
 * - Admin role verification
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = db.useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Query all admin users (we'll filter client-side)
  const { data: adminData, isLoading: adminLoading } = db.useQuery({
    adminUsers: {},
  });

  // Calculate admin status directly from data (no state delays!)
  // CRITICAL: Only grant admin access if we have both user AND adminData loaded
  // If adminData hasn't loaded yet, isAdmin must be false
  const isAdmin = user && adminData?.adminUsers && !adminLoading ?
    adminData.adminUsers.some(admin => admin.userId === user.id) : false;

  const checkingAdmin = authLoading || adminLoading;

  console.log('[Admin Layout] Status:', {
    hasUser: !!user,
    userId: user?.id,
    authLoading,
    adminLoading,
    checkingAdmin,
    isAdmin,
    adminCount: adminData?.adminUsers?.length
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    // Don't redirect if we're already on the login page
    if (pathname === '/admin/login') {
      return;
    }

    console.log('[Admin Layout] Redirect check:', {
      authLoading,
      checkingAdmin,
      hasUser: !!user,
      isAdmin,
      willRedirect: !authLoading && !checkingAdmin && (!user || !isAdmin)
    });

    if (!authLoading && !checkingAdmin && !adminLoading) {
      if (!user) {
        console.log('[Admin Layout] Redirecting to /admin/login - no user');
        router.push('/admin/login');
      } else if (!isAdmin) {
        console.log('[Admin Layout] Redirecting to /admin/login - not admin');
        router.push('/admin/login');
      } else {
        console.log('[Admin Layout] ✅ Access granted - user is admin!');
      }
    }
  }, [authLoading, checkingAdmin, adminLoading, user, isAdmin, router, pathname]);

  // If on login page, render without layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // CRITICAL: Block rendering until we've verified admin status
  // Loading state - show spinner while checking authentication
  if (authLoading || checkingAdmin || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Block access if not authenticated or not admin
  // This prevents any content from rendering for non-admin users
  if (!user || !isAdmin) {
    // Return null to prevent any rendering
    // The useEffect above will handle the redirect
    return null;
  }

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Panel</h1>
                <p className="text-xs text-gray-500">Cool URLs</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${
                          isActive
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info & Sign out */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

