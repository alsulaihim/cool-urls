/**
 * Admin Permissions Helper
 *
 * Utilities for checking admin permissions and roles
 */

import { getAdminUser, hasPermission, hasAllPermissions, Permission } from './auth';

/**
 * Verify admin has required permission
 * Throws error if not authorized
 */
export async function requirePermission(
  userId: string,
  permission: Permission
): Promise<void> {
  const adminUser = await getAdminUser(userId);

  if (!adminUser) {
    throw new Error('Unauthorized: User is not an admin');
  }

  if (!hasPermission(adminUser, permission)) {
    throw new Error(`Unauthorized: Missing permission '${permission}'`);
  }
}

/**
 * Verify admin has all required permissions
 * Throws error if not authorized
 */
export async function requireAllPermissions(
  userId: string,
  permissions: Permission[]
): Promise<void> {
  const adminUser = await getAdminUser(userId);

  if (!adminUser) {
    throw new Error('Unauthorized: User is not an admin');
  }

  if (!hasAllPermissions(adminUser, permissions)) {
    throw new Error(`Unauthorized: Missing required permissions`);
  }
}

/**
 * Check if user is admin (returns boolean)
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const adminUser = await getAdminUser(userId);
  return !!adminUser;
}

/**
 * Verify user is super admin
 */
export async function requireSuperAdmin(userId: string): Promise<void> {
  const adminUser = await getAdminUser(userId);

  if (!adminUser) {
    throw new Error('Unauthorized: User is not an admin');
  }

  if (adminUser.role !== 'super_admin') {
    throw new Error('Unauthorized: Super admin access required');
  }
}

/**
 * Get admin user or throw error
 */
export async function getAdminOrThrow(userId: string) {
  const adminUser = await getAdminUser(userId);

  if (!adminUser) {
    throw new Error('Unauthorized: User is not an admin');
  }

  return adminUser;
}
