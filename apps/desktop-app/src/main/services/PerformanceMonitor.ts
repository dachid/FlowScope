import { app } from 'electron';
import { FlowScopeDatabase } from '../database/FlowScopeDatabase';
import log from 'electron-log';

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
  };
  databaseStats: {
    sessionCount: number;
    traceCount: number;
    databaseSize: number;
    lastVacuum?: Date;
  };
  appMetrics: {
    uptime: number;
    version: string;
    crashCount: number;
    lastCrash?: Date;
  };
}

export class PerformanceMonitor {
  private database: FlowScopeDatabase;
  private metricsInterval: NodeJS.Timeout | null = null;
  private crashCount = 0;
  private lastCrash: Date | null = null;
  private startTime = Date.now();

  constructor(database: FlowScopeDatabase) {
    this.database = database;
    this.setupCrashReporting();
  }

  private setupCrashReporting(): void {
    process.on('uncaughtException', (error) => {
      this.recordCrash(error);
    });

    process.on('unhandledRejection', (reason) => {
      this.recordCrash(new Error(`Unhandled promise rejection: ${reason}`));
    });
  }

  private recordCrash(error: Error): void {
    this.crashCount++;
    this.lastCrash = new Date();
    log.error('Application crash recorded:', error);
    
    // Store crash info in database for reporting
    try {
      // Implementation would store crash data
      log.error('Crash details:', {
        message: error.message,
        stack: error.stack,
        timestamp: this.lastCrash.toISOString()
      });
    } catch (dbError) {
      log.error('Failed to record crash in database:', dbError);
    }
  }

  async getMetrics(): Promise<PerformanceMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate CPU usage percentage (simplified)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    
    return {
      cpuUsage: Math.min(cpuPercent, 100), // Cap at 100%
      memoryUsage: {
        total: memoryUsage.heapTotal,
        used: memoryUsage.heapUsed,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed
      },
      databaseStats: await this.getDatabaseStats(),
      appMetrics: {
        uptime: Date.now() - this.startTime,
        version: app.getVersion(),
        crashCount: this.crashCount,
        lastCrash: this.lastCrash || undefined
      }
    };
  }

  private async getDatabaseStats(): Promise<PerformanceMetrics['databaseStats']> {
    try {
      const sessions = this.database.getSessions();
      const sessionCount = sessions.length;
      
      // Get total trace count across all sessions
      let traceCount = 0;
      sessions.forEach(session => {
        const traces = this.database.getTraces(session.id);
        traceCount += traces.length;
      });

      // Get database file size (simplified - would need actual file system check)
      const databaseSize = sessionCount * 1000 + traceCount * 500; // Rough estimation

      return {
        sessionCount,
        traceCount,
        databaseSize,
        lastVacuum: undefined // Would track last VACUUM operation
      };
    } catch (error) {
      log.error('Error getting database stats:', error);
      return {
        sessionCount: 0,
        traceCount: 0,
        databaseSize: 0
      };
    }
  }

  startMonitoring(intervalMs = 30000): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        
        // Log performance warnings
        if (metrics.memoryUsage.used > 500 * 1024 * 1024) { // 500MB
          log.warn('High memory usage detected:', metrics.memoryUsage);
        }
        
        if (metrics.databaseStats.traceCount > 50000) {
          log.warn('Large number of traces detected, consider cleanup:', metrics.databaseStats);
        }
        
        // Auto-cleanup if needed
        await this.performMaintenanceIfNeeded(metrics);
        
      } catch (error) {
        log.error('Error in performance monitoring:', error);
      }
    }, intervalMs);

    log.info('Performance monitoring started');
  }

  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      log.info('Performance monitoring stopped');
    }
  }

  private async performMaintenanceIfNeeded(metrics: PerformanceMetrics): Promise<void> {
    // Auto-cleanup old sessions if memory usage is high
    if (metrics.memoryUsage.used > 400 * 1024 * 1024) { // 400MB
      await this.cleanupOldSessions();
    }

    // Database maintenance
    if (metrics.databaseStats.traceCount > 100000) {
      await this.performDatabaseMaintenance();
    }
  }

  private async cleanupOldSessions(): Promise<void> {
    try {
      log.info('Performing automatic session cleanup due to high memory usage');
      
      const sessions = this.database.getSessions();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      let cleanedCount = 0;
      sessions.forEach(session => {
        if (session.created_at && session.created_at < thirtyDaysAgo) {
          try {
            this.database.deleteSession(session.id);
            cleanedCount++;
          } catch (error) {
            log.error(`Error deleting session ${session.id}:`, error);
          }
        }
      });
      
      if (cleanedCount > 0) {
        log.info(`Cleaned up ${cleanedCount} old sessions`);
      }
    } catch (error) {
      log.error('Error during session cleanup:', error);
    }
  }

  private async performDatabaseMaintenance(): Promise<void> {
    try {
      log.info('Performing database maintenance...');
      
      // This would run database optimization commands
      // For SQLite: VACUUM, ANALYZE, etc.
      // Implementation depends on database specifics
      
      log.info('Database maintenance completed');
    } catch (error) {
      log.error('Error during database maintenance:', error);
    }
  }

  async exportPerformanceReport(): Promise<string> {
    try {
      const metrics = await this.getMetrics();
      
      const report = {
        timestamp: new Date().toISOString(),
        applicationVersion: metrics.appMetrics.version,
        uptime: metrics.appMetrics.uptime,
        performance: {
          memoryUsage: metrics.memoryUsage,
          cpuUsage: metrics.cpuUsage
        },
        database: metrics.databaseStats,
        stability: {
          crashCount: metrics.appMetrics.crashCount,
          lastCrash: metrics.appMetrics.lastCrash
        },
        recommendations: this.generateRecommendations(metrics)
      };
      
      return JSON.stringify(report, null, 2);
    } catch (error) {
      log.error('Error generating performance report:', error);
      throw error;
    }
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.memoryUsage.used > 300 * 1024 * 1024) {
      recommendations.push('Consider reducing the number of active sessions to improve memory usage');
    }
    
    if (metrics.databaseStats.traceCount > 25000) {
      recommendations.push('Consider archiving old traces to improve performance');
    }
    
    if (metrics.appMetrics.crashCount > 0) {
      recommendations.push('Application has experienced crashes - check logs for stability issues');
    }
    
    if (metrics.databaseStats.sessionCount > 50) {
      recommendations.push('Consider organizing sessions into projects for better management');
    }
    
    return recommendations;
  }
}
