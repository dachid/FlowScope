import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  teamId?: string;
  projectId?: string;
  timestamp?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async logActivity(entry: AuditLogEntry): Promise<void> {
    try {
      // Store in database - we'll need to add an audit_logs table
      // For now, log to console and store in memory/file
      const logEntry = {
        ...entry,
        timestamp: entry.timestamp || new Date(),
      };

      console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);

      // In production, you'd store this in a dedicated audit table
      // await this.prisma.auditLog.create({ data: logEntry });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      teamId?: string;
      projectId?: string;
    }
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      resource,
      resourceId,
      details,
      severity: this.getSeverityForAction(action),
      ...context,
    });
  }

  async logSystemEvent(
    action: string,
    resource: string,
    details?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    await this.logActivity({
      action,
      resource,
      details,
      severity,
    });
  }

  async logSecurityEvent(
    action: string,
    userId?: string,
    details?: Record<string, any>,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      resource: 'security',
      details,
      severity: 'high',
      ...context,
    });
  }

  async getAuditLogs(filters: {
    userId?: string;
    teamId?: string;
    projectId?: string;
    action?: string;
    resource?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    // In production, query from audit_logs table
    // For now, return empty array
    return [];
  }

  async getSecurityAlerts(
    timeRange: '1h' | '24h' | '7d' = '24h'
  ): Promise<AuditLogEntry[]> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
    }

    return this.getAuditLogs({
      severity: 'high',
      startDate,
      endDate,
      limit: 100,
    });
  }

  private getSeverityForAction(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskActions = [
      'delete_project',
      'delete_team',
      'remove_team_member',
      'change_permissions',
      'export_data',
      'share_sensitive_data',
    ];

    const mediumRiskActions = [
      'create_project',
      'invite_user',
      'update_settings',
      'create_share_link',
    ];

    if (highRiskActions.includes(action)) {
      return 'high';
    }
    if (mediumRiskActions.includes(action)) {
      return 'medium';
    }
    return 'low';
  }
}
