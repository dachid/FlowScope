import { Injectable } from '@nestjs/common';
import { 
  UniversalTraceData, 
  UniversalSession, 
  TraceBatch,
  ValidationResult,
  UniversalTraceValidator 
} from '@flowscope/shared';
import { traceValidator, languageDetector, legacyTraceAdapter } from '@flowscope/shared';

@Injectable()
export class UniversalTraceService {
  private readonly validator: UniversalTraceValidator = traceValidator;
  
  /**
   * Process a single universal trace
   */
  async processTrace(trace: UniversalTraceData): Promise<{
    success: boolean;
    validation: ValidationResult;
    processedTrace?: UniversalTraceData;
    error?: string;
  }> {
    try {
      // Validate the trace
      const validation = this.validator.validate(trace);
      
      if (!validation.valid) {
        return {
          success: false,
          validation,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Enrich trace with additional metadata
      const enrichedTrace = await this.enrichTrace(trace);
      
      // Store trace (implement persistence layer as needed)
      await this.storeTrace(enrichedTrace);
      
      return {
        success: true,
        validation,
        processedTrace: enrichedTrace
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        validation: { valid: false, errors: [errorMessage], warnings: [] },
        error: errorMessage
      };
    }
  }

  /**
   * Process a batch of traces
   */
  async processBatch(batch: TraceBatch): Promise<{
    success: boolean;
    validation: ValidationResult;
    processedCount: number;
    failedCount: number;
    results: Array<{ traceId: string; success: boolean; error?: string }>;
  }> {
    // Validate the batch
    const validation = this.validator.validateBatch(batch);
    
    if (!validation.valid) {
      return {
        success: false,
        validation,
        processedCount: 0,
        failedCount: batch.traces.length,
        results: batch.traces.map((trace: UniversalTraceData) => ({
          traceId: trace.id,
          success: false,
          error: 'Batch validation failed'
        }))
      };
    }

    // Process each trace in the batch
    const results = await Promise.allSettled(
      batch.traces.map((trace: UniversalTraceData) => this.processTrace(trace))
    );

    const processedResults = results.map((result: PromiseSettledResult<any>, index: number) => {
      const trace = batch.traces[index];
      if (result.status === 'fulfilled') {
        return {
          traceId: trace.id,
          success: result.value.success,
          error: result.value.error
        };
      } else {
        return {
          traceId: trace.id,
          success: false,
          error: result.reason.message
        };
      }
    });

    const successCount = processedResults.filter((r: any) => r.success).length;
    const failedCount = processedResults.filter((r: any) => !r.success).length;

    return {
      success: successCount > 0,
      validation,
      processedCount: successCount,
      failedCount,
      results: processedResults
    };
  }

  /**
   * Process a complete session with multiple traces
   */
  async processSession(session: UniversalSession): Promise<Array<{
    success: boolean;
    validation: ValidationResult;
    processedTrace?: UniversalTraceData;
    error?: string;
    traceId: string;
  }>> {
    try {
      const results: Array<{
        success: boolean;
        validation: ValidationResult;
        processedTrace?: UniversalTraceData;
        error?: string;
        traceId: string;
      }> = [];
      
      // Validate the session first
      const sessionValidation = this.validator.validateSession(session);
      
      // Process each trace in the session
      for (const trace of session.traces) {
        // Ensure trace has session information
        trace.session_id = session.sessionId;
        trace.session_metadata = {
          ...trace.session_metadata,
          ...session.session_metadata
        };
        
        const result = await this.processTrace(trace);
        results.push({
          ...result,
          traceId: trace.id
        });
      }
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session processing failed';
      
      return [{
        success: false,
        error: errorMessage,
        traceId: session.sessionId,
        validation: {
          valid: false,
          errors: [errorMessage],
          warnings: []
        }
      }];
    }
  }

  /**
   * Convert legacy trace to universal format
   */
  async convertLegacyTrace(legacyTrace: any): Promise<UniversalTraceData> {
    return legacyTraceAdapter.fromLegacy(legacyTrace);
  }

  /**
   * Auto-detect language from trace data
   */
  detectLanguage(trace: any) {
    return languageDetector.detectFromTrace(trace);
  }

  /**
   * Get traces by session with language correlation
   */
  async getSessionTraces(sessionId: string): Promise<{
    session: UniversalSession;
    traces: UniversalTraceData[];
    languageStats: { [language: string]: number };
    frameworkStats: { [framework: string]: number };
  }> {
    // Implement session trace retrieval
    const traces = await this.getTracesForSession(sessionId);
    const session = await this.getSession(sessionId);

    // Calculate statistics
    const languageStats = this.calculateLanguageStats(traces);
    const frameworkStats = this.calculateFrameworkStats(traces);

    return {
      session,
      traces,
      languageStats,
      frameworkStats
    };
  }

  /**
   * Cross-language correlation
   */
  async correlateTraces(traceIds: string[]): Promise<{
    correlatedTraces: UniversalTraceData[];
    correlationGraph: { [traceId: string]: string[] };
    languages: string[];
    frameworks: string[];
  }> {
    const traces = await this.getTracesByIds(traceIds);
    
    // Build correlation graph based on parent-child relationships
    const correlationGraph: { [traceId: string]: string[] } = {};
    traces.forEach(trace => {
      if (trace.parent_id) {
        if (!correlationGraph[trace.parent_id]) {
          correlationGraph[trace.parent_id] = [];
        }
        correlationGraph[trace.parent_id].push(trace.id);
      }
    });

    // Extract unique languages and frameworks
    const languages = [...new Set(traces.map(t => t.language))];
    const frameworks = [...new Set(traces.map(t => t.framework))];

    return {
      correlatedTraces: traces,
      correlationGraph,
      languages,
      frameworks
    };
  }

  private async enrichTrace(trace: UniversalTraceData): Promise<UniversalTraceData> {
    const enriched = { ...trace };

    // Add server-side timestamp if missing
    if (!enriched.start_time) {
      enriched.start_time = new Date().toISOString();
    }

    // Calculate duration if end_time is present but duration is missing
    if (enriched.end_time && !enriched.duration_ms) {
      const startTime = new Date(enriched.start_time);
      const endTime = new Date(enriched.end_time);
      enriched.duration_ms = endTime.getTime() - startTime.getTime();
    }

    // Auto-detect language if not provided or confidence is low
    if (!enriched.language) {
      const detection = languageDetector.detectFromTrace(trace);
      enriched.language = detection.language;
      
      // Add detection metadata
      if (!enriched.metadata) {
        enriched.metadata = {};
      }
      enriched.metadata._language_detection = {
        confidence: detection.confidence,
        evidence: detection.evidence
      };
    }

    // Add server metadata
    if (!enriched.metadata) {
      enriched.metadata = {};
    }
    enriched.metadata._server = {
      processed_at: new Date().toISOString(),
      server_version: process.env.npm_package_version || '1.0.0',
      node_version: process.version
    };

    return enriched;
  }

  private async storeTrace(trace: UniversalTraceData): Promise<void> {
    // TODO: Implement database storage
    // For now, this is a placeholder
    console.log(`Storing trace ${trace.id} for session ${trace.session_id}`);
  }

  private async getTracesForSession(sessionId: string): Promise<UniversalTraceData[]> {
    // TODO: Implement database query
    return [];
  }

  private async getSession(sessionId: string): Promise<UniversalSession> {
    // TODO: Implement database query
    return {
      sessionId: sessionId,
      id: sessionId,
      start_time: new Date().toISOString(),
      status: 'active',
      language: 'javascript',
      framework: 'custom',
      traces: [] // Empty for now, would be populated from DB
    };
  }

  private async getTracesByIds(traceIds: string[]): Promise<UniversalTraceData[]> {
    // TODO: Implement database query
    return [];
  }

  private calculateLanguageStats(traces: UniversalTraceData[]): { [language: string]: number } {
    const stats: { [language: string]: number } = {};
    traces.forEach(trace => {
      stats[trace.language] = (stats[trace.language] || 0) + 1;
    });
    return stats;
  }

  private calculateFrameworkStats(traces: UniversalTraceData[]): { [framework: string]: number } {
    const stats: { [framework: string]: number } = {};
    traces.forEach(trace => {
      stats[trace.framework] = (stats[trace.framework] || 0) + 1;
    });
    return stats;
  }
}
