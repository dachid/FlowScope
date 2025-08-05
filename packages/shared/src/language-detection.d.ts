import { UniversalTraceData, TraceDataAdapter } from './universal-trace';
import { TraceData } from './types';
export interface LanguageDetectionResult {
    language: UniversalTraceData['language'];
    confidence: number;
    evidence: string[];
}
export declare class LanguageDetector {
    detectFromTrace(trace: any): LanguageDetectionResult;
    private hasSnakeCaseKeys;
    private hasCamelCaseKeys;
}
export declare class LegacyTraceAdapter implements TraceDataAdapter {
    getVersion(): string;
    fromLegacy(legacyTrace: TraceData): UniversalTraceData;
    toLegacy(universalTrace: UniversalTraceData): TraceData;
    private mapOperation;
    private mapFramework;
    private mapStatus;
    private mapLegacyStatus;
    private mapTraceEventType;
    private extractLanguageMetadata;
    private extractContext;
}
export declare const languageDetector: LanguageDetector;
export declare const legacyTraceAdapter: LegacyTraceAdapter;
