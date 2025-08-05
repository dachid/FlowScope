/**
 * Pre-wrapped LangChain module replacement
 * Provides identical API to LangChain but with automatic tracing
 *
 * Usage: const { LLMChain } = require('@flowscope/langchain');
 */
declare const sdk: any;
declare const LLMChain_base: any;
/**
 * Wrapped LLMChain with automatic tracing
 */
export declare class LLMChain extends LLMChain_base {
    constructor(...args: any[]);
    call(values: any, callbacks?: any): Promise<any>;
    run(input: any, callbacks?: any): Promise<any>;
}
declare const ConversationChain_base: any;
/**
 * Wrapped ConversationChain with automatic tracing
 */
export declare class ConversationChain extends ConversationChain_base {
    constructor(...args: any[]);
    call(values: any, callbacks?: any): Promise<any>;
}
declare const RetrievalQAChain_base: any;
/**
 * Wrapped RetrievalQAChain with automatic tracing
 */
export declare class RetrievalQAChain extends RetrievalQAChain_base {
    constructor(...args: any[]);
    call(values: any, callbacks?: any): Promise<any>;
}
declare const AgentExecutor_base: any;
/**
 * Wrapped AgentExecutor with automatic tracing
 */
export declare class AgentExecutor extends AgentExecutor_base {
    constructor(...args: any[]);
    call(inputs: any, callbacks?: any): Promise<any>;
}
export { sdk as flowscope };
export declare const OpenAI: any, ChatOpenAI: any, LLM: any, BaseLLM: any, BaseLanguageModel: any;
export declare const BufferMemory: any, ConversationBufferMemory: any, ConversationBufferWindowMemory: any, ConversationSummaryMemory: any;
export declare const PromptTemplate: any, ChatPromptTemplate: any, MessagesPlaceholder: any;
