import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  timestamp: Date;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface SystemMetrics {
  endpoint: string;
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

@Injectable()
export class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS_BUFFER = 10000;

  constructor(private prisma: PrismaService) {
    // Flush metrics to database periodically
    setInterval(() => this.flushMetrics(), 60000); // Every minute
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
    });

    // Prevent memory buildup
    if (this.metrics.length > this.MAX_METRICS_BUFFER) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_BUFFER / 2);
    }
  }

  async getSystemMetrics(timeRange: '1h' | '24h' | '7d' = '1h'): Promise<SystemMetrics[]> {
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
    }

    // In a production environment, you'd query from a metrics database
    // For now, calculate from in-memory metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp >= startTime);
    
    return this.calculateSystemMetrics(recentMetrics);
  }

  async getEndpointMetrics(endpoint: string, timeRange: '1h' | '24h' | '7d' = '1h'): Promise<PerformanceMetric[]> {
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
    }

    return this.metrics.filter(m => 
      m.endpoint === endpoint && m.timestamp >= startTime
    );
  }

  async getHealthMetrics(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      avgResponseTime: number;
      errorRate: number;
      requestsPerMinute: number;
      memoryUsage: number;
      cpuUsage: number;
      databaseConnections: number;
    };
  }> {
    const recentMetrics = this.metrics.filter(m => 
      m.timestamp >= new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    const errorRate = recentMetrics.length > 0
      ? recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length
      : 0;

    const requestsPerMinute = recentMetrics.length;
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();

    // Get database connection count (if available)
    let databaseConnections = 0;
    try {
      // This would need to be implemented based on your database connection pool
      databaseConnections = await this.getDatabaseConnectionCount();
    } catch (error) {
      console.warn('Failed to get database connection count:', error);
    }

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (avgResponseTime > 2000 || errorRate > 0.1 || memoryUsage > 0.9) {
      status = 'degraded';
    }
    if (avgResponseTime > 5000 || errorRate > 0.25 || memoryUsage > 0.95) {
      status = 'unhealthy';
    }

    return {
      status,
      metrics: {
        avgResponseTime,
        errorRate,
        requestsPerMinute,
        memoryUsage,
        cpuUsage,
        databaseConnections,
      },
    };
  }

  private calculateSystemMetrics(metrics: PerformanceMetric[]): SystemMetrics[] {
    if (metrics.length === 0) return [];

    // Group by endpoint
    const groupedMetrics = metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    return Object.entries(groupedMetrics).map(([endpoint, endpointMetrics]) => {
      const responseTimes = endpointMetrics.map(m => m.responseTime).sort((a, b) => a - b);
      const errorCount = endpointMetrics.filter(m => m.statusCode >= 400).length;

      return {
        endpoint,
        avgResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
        requestCount: endpointMetrics.length,
        errorRate: errorCount / endpointMetrics.length,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCpuUsage(),
        timestamp: new Date(),
      };
    });
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      // In a production environment, you'd store these in a time-series database
      // For now, we'll just log aggregated metrics
      const systemMetrics = this.calculateSystemMetrics(this.metrics);
      console.log('System Metrics:', JSON.stringify(systemMetrics, null, 2));
      
      // Clear metrics after flushing
      this.metrics = [];
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return memUsage.heapUsed / memUsage.heapTotal;
  }

  private getCpuUsage(): number {
    // Simple CPU usage estimation
    const cpuUsage = process.cpuUsage();
    return (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  }

  private async getDatabaseConnectionCount(): Promise<number> {
    // This would need to be implemented based on your connection pool
    // For Prisma, you might check the connection pool status
    return 0; // Placeholder
  }
}
