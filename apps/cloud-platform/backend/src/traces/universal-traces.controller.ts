import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, BadRequestException, Logger } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';
import { UniversalTraceService } from './universal-trace.service';
import type { UniversalTraceData, TraceBatch, UniversalSession } from '@flowscope/shared';

@Controller('traces')
export class TracesController {
  private readonly logger = new Logger(TracesController.name);

  constructor(
    private readonly websocketService: WebSocketService,
    private readonly universalTraceService: UniversalTraceService
  ) {}

  /**
   * Primary trace endpoint - universal format only
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitTrace(@Body() trace: UniversalTraceData) {
    try {
      this.logger.debug(`Processing trace: ${trace.id}`);
      const result = await this.universalTraceService.processTrace(trace);
      
      if (!result.success) {
        throw new BadRequestException(`Trace processing failed: ${result.error}`);
      }

      // Broadcast to WebSocket clients
      await this.websocketService.broadcastUniversalTrace(result.processedTrace!);

      return {
        success: true,
        message: 'Trace processed successfully',
        traceId: trace.id,
        validation: result.validation,
        warnings: result.validation.warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Trace processing failed: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Batch processing endpoint for high-throughput scenarios
   */
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async submitBatch(@Body() batch: TraceBatch) {
    try {
      this.logger.debug(`Processing trace batch with ${batch.traces.length} traces`);
      const result = await this.universalTraceService.processBatch(batch);
      
      // Broadcast successful traces
      if (result.processedCount > 0) {
        const successfulResults = result.results.filter((r: any) => r.success);
        await this.websocketService.broadcastTraceBatchResult({
          batchId: batch.batch_id,
          processedCount: result.processedCount,
          failedCount: result.failedCount,
          successfulTraceIds: successfulResults.map((r: any) => r.traceId)
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
      this.logger.error(`Batch processing failed: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Session processing endpoint
   */
  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  async submitSession(@Body() session: UniversalSession) {
    try {
      this.logger.debug(`Processing session: ${session.sessionId}`);
      const results = await this.universalTraceService.processSession(session);
      
      const successfulResults = results.filter((r: any) => r.success);
      
      if (successfulResults.length > 0) {
        await this.websocketService.broadcastSessionResult({
          sessionId: session.sessionId,
          processedCount: successfulResults.length,
          failedCount: results.length - successfulResults.length,
          traceIds: successfulResults.map((r: any) => r.traceId)
        });
      }

      return {
        success: successfulResults.length > 0,
        message: `Processed ${successfulResults.length}/${results.length} traces in session`,
        sessionId: session.sessionId,
        processedCount: successfulResults.length,
        failedCount: results.length - successfulResults.length,
        results
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Session processing failed: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get session traces
   */
  @Get('session/:sessionId')
  async getSessionTraces(@Param('sessionId') sessionId: string) {
    try {
      const sessionData = await this.universalTraceService.getSessionTraces(sessionId);
      
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
      this.logger.error(`Session retrieval failed: ${errorMessage}`);
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

      this.logger.debug(`Correlating ${traceIds.length} traces`);
      const correlation = await this.universalTraceService.correlateTraces(traceIds);
      
      return {
        success: true,
        correlation
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Trace correlation failed: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Health check for trace processing
   */
  @Get('health')
  async getHealth() {
    return {
      success: true,
      message: 'Trace processing service is healthy',
      version: '1.0',
      protocol: 'Universal Trace Format v1.0',
      supportedLanguages: ['javascript', 'python', 'go', 'java', 'csharp', 'rust'],
      supportedFrameworks: ['langchain', 'llamaindex', 'custom', 'autogen', 'crewai', 'flowise'],
      timestamp: new Date().toISOString()
    };
  }
}
