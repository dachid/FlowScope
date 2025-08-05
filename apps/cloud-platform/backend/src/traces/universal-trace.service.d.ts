import { UniversalTraceData, UniversalSession, TraceBatch, ValidationResult } from '@flowscope/shared';
export declare class UniversalTraceService {
    private readonly validator;
    /**
     * Process a single universal trace
     */
    processTrace(trace: UniversalTraceData): Promise<{
        success: boolean;
        validation: ValidationResult;
        processedTrace?: UniversalTraceData;
        error?: string;
    }>;
    /**
     * Process a batch of traces
     */
    processBatch(batch: TraceBatch): Promise<{
        success: boolean;
        validation: ValidationResult;
        processedCount: number;
        failedCount: number;
        results: Array<{
            traceId: string;
            success: boolean;
            error?: string;
        }>;
    }>;
    /**
     * Process a complete session with multiple traces
     */
    processSession(session: UniversalSession): Promise<Array<{
        success: boolean;
        validation: ValidationResult;
        processedTrace?: UniversalTraceData;
        error?: string;
        traceId: string;
    }>>;
    /**
     * Convert legacy trace to universal format
     */
    convertLegacyTrace(legacyTrace: any): Promise<UniversalTraceData>;
    /**
     * Auto-detect language from trace data
     */
    detectLanguage(trace: any): import("@flowscope/shared").LanguageDetectionResult;
    /**
     * Get traces by session with language correlation
     */
    getSessionTraces(sessionId: string): Promise<{
        session: UniversalSession;
        traces: UniversalTraceData[];
        languageStats: {
            [language: string]: number;
        };
        frameworkStats: {
            [framework: string]: number;
        };
    }>;
    /**
     * Cross-language correlation
     */
    correlateTraces(traceIds: string[]): Promise<{
        correlatedTraces: UniversalTraceData[];
        correlationGraph: {
            [traceId: string]: string[];
        };
        languages: string[];
        frameworks: string[];
    }>;
    private enrichTrace;
    private storeTrace;
    private getTracesForSession;
    private getSession;
    private getTracesByIds;
    private calculateLanguageStats;
    private calculateFrameworkStats;
}
