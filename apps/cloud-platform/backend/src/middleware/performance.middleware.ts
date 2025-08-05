import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitoringService } from '../monitoring/performance-monitoring.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(private performanceService: PerformanceMonitoringService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const performanceService = this.performanceService;

    // Capture original end method
    const originalEnd = res.end;

    // Override end method to capture metrics
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      const responseTime = Date.now() - startTime;
      
      // Record performance metric
      performanceService.recordMetric({
        endpoint: req.route?.path || req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userId: (req.user as any)?.id,
        timestamp: new Date(),
      });

      // Call original end method
      return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
  }
}
