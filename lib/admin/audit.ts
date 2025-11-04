/**
 * Audit Logging Utilities
 * 
 * Functions for creating and retrieving audit logs for admin actions.
 * Audit logs are immutable and capture all admin activities.
 */

import { db } from '@/lib/instant';

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
  | 'admin.revoke'
  | 'subscription.cancel'
  | 'subscription.plan_change'
  | 'subscription.trial_extend'
  | 'usage.reset'
  | 'usage.credit_apply';

export type AuditTargetType = 'user' | 'url' | 'system' | 'admin' | 'subscription';

/**
 * Create an audit log entry
 * This should be called for every admin action
 */
export async function createAuditLog(params: {
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.transact(
      db.tx.auditLogs[crypto.randomUUID()].update({
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: JSON.stringify(params.metadata || {}),
        ipAddress: params.ipAddress || 'unknown',
        userAgent: params.userAgent || 'unknown',
        timestamp: Date.now(),
      })
    );

    console.log('[Audit] Log created:', {
      admin: params.adminEmail,
      action: params.action,
      target: `${params.targetType}:${params.targetId}`,
    });
  } catch (error) {
    // Audit logging should never fail silently, but shouldn't break the main action
    console.error('[Audit] Failed to create audit log:', error);
    console.error('[Audit] Failed action:', params);
  }
}

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs(filters?: {
  adminId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (filters?.adminId) {
      where.adminId = filters.adminId;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.targetType) {
      where.targetType = filters.targetType;
    }
    if (filters?.targetId) {
      where.targetId = filters.targetId;
    }

    const { data } = await db.queryOnce({
      auditLogs: {
        $: {
          where: Object.keys(where).length > 0 ? where : undefined,
          limit: filters?.limit || 100,
        },
      },
    });

    let logs = data?.auditLogs || [];

    // Client-side date filtering (if InstantDB doesn't support range queries)
    if (filters?.startDate) {
      logs = logs.filter((log: any) => log.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter((log: any) => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp descending (most recent first)
    logs.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return logs;
  } catch (error) {
    console.error('[Audit] Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific target (user or URL)
 */
export async function getTargetAuditLogs(targetType: AuditTargetType, targetId: string) {
  return getAuditLogs({ targetType, targetId });
}

/**
 * Get recent admin activity (last 24 hours)
 */
export async function getRecentActivity(limit = 50) {
  const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
  return getAuditLogs({ startDate: last24Hours, limit });
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(startDate: number, endDate: number) {
  const logs = await getAuditLogs({ startDate, endDate, limit: 10000 });

  const stats = {
    total: logs.length,
    byAction: {} as Record<string, number>,
    byAdmin: {} as Record<string, number>,
    byTargetType: {} as Record<string, number>,
  };

  logs.forEach((log: any) => {
    // Count by action
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

    // Count by admin
    stats.byAdmin[log.adminEmail] = (stats.byAdmin[log.adminEmail] || 0) + 1;

    // Count by target type
    stats.byTargetType[log.targetType] = (stats.byTargetType[log.targetType] || 0) + 1;
  });

  return stats;
}

/**
 * Export audit logs to JSON
 */
export function exportAuditLogs(logs: any[]): string {
  return JSON.stringify(
    logs.map((log) => ({
      ...log,
      metadata: JSON.parse(log.metadata || '{}'),
      timestamp: new Date(log.timestamp).toISOString(),
    })),
    null,
    2
  );
}

/**
 * Helper to get IP address from request (for use in API routes)
 */
export function getIpAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIp || 'unknown';
}

/**
 * Helper to get user agent from request (for use in API routes)
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

