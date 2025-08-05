import { UniversalTraceData, UniversalSession, TraceBatch, ValidationResult, UniversalTraceValidator } from './universal-trace';
export declare class DefaultTraceValidator implements UniversalTraceValidator {
    validate(trace: UniversalTraceData): ValidationResult;
    validateBatch(batch: TraceBatch): ValidationResult;
    validateSession(session: UniversalSession): ValidationResult;
    private isValidISO8601;
}
export declare const traceValidator: DefaultTraceValidator;
