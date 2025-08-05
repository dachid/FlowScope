import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requestCounts = new Map<string, { count: number; windowStart: number }>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());
    
    if (!rateLimitConfig) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientId = this.getClientId(request);
    const now = Date.now();

    // Clean up old entries
    this.cleanupOldEntries(now, rateLimitConfig.windowMs);

    const clientData = this.requestCounts.get(clientId);
    
    if (!clientData || now - clientData.windowStart > rateLimitConfig.windowMs) {
      // Start new window
      this.requestCounts.set(clientId, { count: 1, windowStart: now });
      return true;
    }

    if (clientData.count >= rateLimitConfig.maxRequests) {
      throw new HttpException(
        rateLimitConfig.message || 'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    clientData.count++;
    return true;
  }

  private getClientId(request: Request): string {
    // Use user ID if authenticated, otherwise use IP address
    const userId = (request.user as any)?.id;
    return userId || request.ip || 'unknown';
  }

  private cleanupOldEntries(now: number, windowMs: number): void {
    const cutoff = now - windowMs;
    for (const [key, data] of this.requestCounts.entries()) {
      if (data.windowStart < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }
}
