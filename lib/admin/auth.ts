/**
 * Admin Authentication Utilities
 * 
 * Functions for checking admin roles, permissions, and managing admin access.
 */

import { db } from '@/lib/instant';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export type Permission =
  | 'user.read'
  | 'user.write'
  | 'user.suspend'
  | 'user.delete'
  | 'url.read'
  | 'url.write'
  | 'url.moderate'
  | 'url.delete'
  | 'analytics.read'
  | 'audit.read'
  | 'config.read'
  | 'config.write'
  | 'admin.manage';

/**
 * Permission sets for each role
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'user.read',
    'user.write',
    'user.suspend',
    'user.delete',
    'url.read',
    'url.write',
    'url.moderate',
    'url.delete',
    'analytics.read',
    'audit.read',
    'config.read',
    'config.write',
    'admin.manage',
  ],
  admin: [
    'user.read',
    'user.write',
    'user.suspend',
    'url.read',
    'url.write',
    'url.moderate',
    'url.delete',
    'analytics.read',
    'audit.read',
  ],
  moderator: [
    'user.read',
    'url.read',
    'url.moderate',
    'analytics.read',
  ],
};

/**
 * Check if a user has admin privileges
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await db.queryOnce({
      adminUsers: {
        $: {
          where: {
            userId,
          },
        },
      },
    });

    return data?.adminUsers && data.adminUsers.length > 0;
  } catch (error) {
    console.error('[Admin Auth] Error checking admin status:', error);
    return false;
  }
}

/**
 * Get admin user data
 */
export async function getAdminUser(userId: string) {
  try {
    const { data } = await db.queryOnce({
      adminUsers: {
        $: {
          where: {
            userId,
          },
        },
      },
    });

    return data?.adminUsers?.[0] || null;
  } catch (error) {
    console.error('[Admin Auth] Error fetching admin user:', error);
    return null;
  }
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(
  adminUser: { role: string; permissions: string },
  permission: Permission
): boolean {
  // Super admin has all permissions
  if (adminUser.role === 'super_admin') {
    return true;
  }

  try {
    const permissions: Permission[] = JSON.parse(adminUser.permissions);
    return permissions.includes(permission);
  } catch {
    return false;
  }
}

/**
 * Check if admin has any of the specified permissions
 */
export function hasAnyPermission(
  adminUser: { role: string; permissions: string },
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((perm) => hasPermission(adminUser, perm));
}

/**
 * Check if admin has all specified permissions
 */
export function hasAllPermissions(
  adminUser: { role: string; permissions: string },
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((perm) => hasPermission(adminUser, perm));
}

/**
 * Grant admin access to a user
 * Only super_admin can call this
 */
export async function grantAdminAccess(params: {
  userId: string;
  role: AdminRole;
  grantedBy: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const permissions = ROLE_PERMISSIONS[params.role];

    await db.transact(
      db.tx.adminUsers[crypto.randomUUID()].update({
        userId: params.userId,
        role: params.role,
        permissions: JSON.stringify(permissions),
        mfaEnabled: false,
        createdAt: Date.now(),
        createdBy: params.grantedBy,
      })
    );

    return { success: true };
  } catch (error) {
    console.error('[Admin Auth] Error granting admin access:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grant admin access',
    };
  }
}

/**
 * Revoke admin access from a user
 * Only super_admin can call this
 */
export async function revokeAdminAccess(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await getAdminUser(userId);
    if (!adminUser) {
      return { success: false, error: 'Admin user not found' };
    }

    await db.transact(db.tx.adminUsers[adminUser.id].delete());

    return { success: true };
  } catch (error) {
    console.error('[Admin Auth] Error revoking admin access:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke admin access',
    };
  }
}

/**
 * Update admin role
 * Only super_admin can call this
 */
export async function updateAdminRole(
  userId: string,
  newRole: AdminRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await getAdminUser(userId);
    if (!adminUser) {
      return { success: false, error: 'Admin user not found' };
    }

    const permissions = ROLE_PERMISSIONS[newRole];

    await db.transact(
      db.tx.adminUsers[adminUser.id].update({
        role: newRole,
        permissions: JSON.stringify(permissions),
      })
    );

    return { success: true };
  } catch (error) {
    console.error('[Admin Auth] Error updating admin role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update admin role',
    };
  }
}

