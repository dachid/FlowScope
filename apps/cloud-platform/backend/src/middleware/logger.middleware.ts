import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`🌐 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    
    // Log request body for POST/PUT requests
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
      console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
  }
}
