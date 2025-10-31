/**
 * Admin Panel Type Definitions
 * 
 * Core types for admin panel functionality including
 * roles, permissions, audit logs, and system metrics.
 */

// ============================================================================
// Admin Roles & Permissions
// ============================================================================

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

export interface AdminUser {
  id: string;
  userId: string; // Reference to main user account
  role: AdminRole;
  permissions: Permission[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: number;
  createdBy: string; // Admin who granted access
  lastActiveAt?: number;
}

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

// ============================================================================
// Audit Logging
// ============================================================================

export type AuditAction =
  | 'user.suspend'
  | 'user.unsuspend'
  | 'user.ban'
  | 'user.delete'
  | 'user.impersonate'
  | 'url.disable'
  | 'url.enable'
  | 'url.delete'
  | 'config.update'
  | 'admin.grant'
  | 'admin.revoke';

export type AuditTargetType = 'user' | 'url' | 'system' | 'admin';

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string; // Denormalized for quick display
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata: Record<string, any>; // Action-specific details
  ipAddress: string;
  userAgent: string;
  timestamp: number;
}

// ============================================================================
// User Management
// ============================================================================

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface UserStatusRecord {
  userId: string;
  status: UserStatus;
  reason?: string;
  notes?: string;
  modifiedBy: string; // Admin ID
  modifiedAt: number;
}

export interface ManagedUser {
  id: string;
  email: string;
  name?: string;
  status: UserStatus;
  createdAt: number;
  lastActiveAt?: number;
  urlCount: number;
  totalClicks: number;
}

export interface UserActivity {
  timestamp: number;
  type: 'url.created' | 'url.deleted' | 'login' | 'logout';
  metadata: Record<string, any>;
}

// ============================================================================
// Analytics
// ============================================================================

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number; // Active in last 30 days
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalUrls: number;
  activeUrls: number;
  totalClicks: number;
  clicksToday: number;
  avgClicksPerUrl: number;
}

export interface UserGrowthData {
  date: string; // YYYY-MM-DD
  newUsers: number;
  totalUsers: number;
}

export interface UrlTrendData {
  date: string;
  created: number;
  deleted: number;
  active: number;
}

export interface TopUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  owner: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: number;
}

export interface PowerUser {
  id: string;
  email: string;
  name?: string;
  urlCount: number;
  totalClicks: number;
  avgClicksPerUrl: number;
}

// ============================================================================
// System Configuration
// ============================================================================

export interface SystemConfig {
  rateLimit: {
    perUser: {
      urlCreation: number; // URLs per hour
      clicks: number; // Clicks per minute
    };
    perIp: {
      urlCreation: number;
      clicks: number;
    };
  };
  features: {
    userRegistration: boolean;
    publicUrlCreation: boolean;
    customDomains: boolean;
    analytics: boolean;
  };
  maintenance: {
    enabled: boolean;
    message?: string;
    allowedUsers?: string[]; // User IDs who can still access
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export interface UserFilters {
  status?: UserStatus;
  search?: string; // Search by email or name
  dateFrom?: string;
  dateTo?: string;
  minUrls?: number;
  maxUrls?: number;
}

export interface UrlFilters {
  status?: 'active' | 'disabled';
  search?: string; // Search by short code or original URL
  owner?: string; // User ID
  dateFrom?: string;
  dateTo?: string;
  minClicks?: number;
  maxClicks?: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

