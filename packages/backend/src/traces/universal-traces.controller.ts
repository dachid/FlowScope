import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';
import { UniversalTraceService } from './universal-trace.service';
import type { TraceData } from '@flowscope/shared';
import type { UniversalTraceData, TraceBatch } from '@flowscope/shared';

@Controller('traces')
export class UniversalTracesController {
  constructor(
    private readonly websocketService: WebSocketService,
    private readonly universalTraceService: UniversalTraceService
  ) {}

  /**
   * Legacy trace endpoint for backward compatibility
   */
  @Post('legacy')
  @HttpCode(HttpStatus.CREATED)
  async createLegacyTrace(@Body() trace: TraceData) {
    try {
      // Convert legacy trace to universal format
      const universalTrace = await this.universalTraceService.convertLegacyTrace(trace);
      
      // Process the universal trace
      const result = await this.universalTraceService.processTrace(universalTrace);
      
      if (!result.success) {
        throw new BadRequestException(`Trace processing failed: ${result.error}`);
      }

      // Broadcast to WebSocket clients (legacy format for compatibility)
      await this.websocketService.broadcastTrace(trace);

      return {
        success: true,
        message: 'Legacy trace converted and processed',
        traceId: trace.id,
        universalTraceId: result.processedTrace?.id,
        validation: result.validation
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Universal trace endpoint - primary endpoint for new integrations
   */
  @Post('universal')
  @HttpCode(HttpStatus.CREATED)
  async createUniversalTrace(@Body() trace: UniversalTraceData) {
    try {
      const result = await this.universalTraceService.processTrace(trace);
      
      if (!result.success) {
        throw new BadRequestException(`Trace processing failed: ${result.error}`);
      }

      // Broadcast to WebSocket clients (universal format)
      await this.websocketService.broadcastUniversalTrace(result.processedTrace!);

      return {
        success: true,
        message: 'Universal trace processed successfully',
        traceId: trace.id,
        validation: result.validation,
        warnings: result.validation.warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Batch processing endpoint for high-throughput scenarios
   */
  @Post('universal/batch')
  @HttpCode(HttpStatus.CREATED)
  async createUniversalTraceBatch(@Body() batch: TraceBatch) {
    try {
      const result = await this.universalTraceService.processBatch(batch);
      
      // Broadcast successful traces
      if (result.processedCount > 0) {
        // Get successfully processed traces and broadcast them
        const successfulResults = result.results.filter(r => r.success);
        await this.websocketService.broadcastTraceBatchResult({
          batchId: batch.batch_id,
          processedCount: result.processedCount,
          failedCount: result.failedCount,
          successfulTraceIds: successfulResults.map(r => r.traceId)
        });
      }

      return {
        success: result.success,
        message: `Processed ${result.processedCount}/${batch.traces.length} traces`,
        batchId: batch.batch_id,
        processedCount: result.processedCount,
        failedCount: result.failedCount,
        validation: result.validation,
        results: result.results
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Auto-detect and process traces (smart endpoint)
   */
  @Post('auto')
  @HttpCode(HttpStatus.CREATED)
  async createAutoTrace(@Body() trace: any) {
    try {
      // Auto-detect if this is a legacy or universal trace
      const isUniversal = this.isUniversalTraceFormat(trace);
      
      if (isUniversal) {
        return this.createUniversalTrace(trace as UniversalTraceData);
      } else {
        return this.createLegacyTrace(trace as TraceData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Language detection endpoint
   */
  @Post('detect-language')
  @HttpCode(HttpStatus.OK)
  async detectLanguage(@Body() trace: any) {
    try {
      const detection = this.universalTraceService.detectLanguage(trace);
      return {
        success: true,
        detection
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get session traces with multi-language support
   */
  @Get('session/:sessionId')
  async getSessionTraces(
    @Param('sessionId') sessionId: string,
    @Query('format') format: 'legacy' | 'universal' = 'universal'
  ) {
    try {
      const sessionData = await this.universalTraceService.getSessionTraces(sessionId);
      
      if (format === 'legacy') {
        // Convert universal traces back to legacy format if requested
        const legacyTraces = sessionData.traces.map(trace => 
          // Implement conversion logic or use adapter
          trace
        );
        
        return {
          success: true,
          session: sessionData.session,
          traces: legacyTraces,
          stats: {
            languages: sessionData.languageStats,
            frameworks: sessionData.frameworkStats
          }
        };
      }

      return {
        success: true,
        session: sessionData.session,
        traces: sessionData.traces,
        stats: {
          languages: sessionData.languageStats,
          frameworks: sessionData.frameworkStats
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Cross-language trace correlation
   */
  @Post('correlate')
  @HttpCode(HttpStatus.OK)
  async correlateTraces(@Body() body: { traceIds: string[] }) {
    try {
      const { traceIds } = body;
      
      if (!Array.isArray(traceIds) || traceIds.length === 0) {
        throw new BadRequestException('traceIds array is required');
      }

      const correlation = await this.universalTraceService.correlateTraces(traceIds);
      
      return {
        success: true,
        correlation
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Health check for universal trace processing
   */
  @Get('health/universal')
  async getUniversalHealth() {
    return {
      success: true,
      message: 'Universal trace processing is healthy',
      version: '1.0',
      supportedLanguages: ['javascript', 'python', 'go', 'java', 'csharp', 'rust'],
      supportedFrameworks: ['langchain', 'llamaindex', 'custom', 'autogen', 'crewai', 'flowise'],
      timestamp: new Date().toISOString()
    };
  }

  private isUniversalTraceFormat(trace: any): boolean {
    // Check for universal trace format indicators
    return Boolean(
      trace.protocol_version ||
      trace.language ||
      trace.start_time || // ISO format vs timestamp
      trace.session_id !== undefined // vs sessionId
    );
  }
}
