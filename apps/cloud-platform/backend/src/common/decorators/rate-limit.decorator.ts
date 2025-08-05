import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata('rateLimit', options);
