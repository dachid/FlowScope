"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = require("../core/sdk");
const transports_1 = require("../transports");
const storage_1 = require("../storage");
describe('FlowScope SDK', () => {
    let sdk;
    beforeEach(() => {
        sdk = new sdk_1.FlowScopeSDK({
            projectId: 'test-project',
            debug: false,
        });
    });
    afterEach(async () => {
        if (sdk) {
            await sdk.shutdown();
        }
    });
    it('should initialize without errors', async () => {
        expect(() => sdk).not.toThrow();
        await expect(sdk.init()).resolves.not.toThrow();
    });
    it('should start and end sessions', () => {
        const session = sdk.startSession('test-session');
        expect(session.id).toBe('test-session');
        expect(session.startTime).toBeGreaterThan(0);
        sdk.endSession();
        expect(session.endTime).toBeGreaterThanOrEqual(session.startTime);
    });
    it('should capture manual traces', () => {
        sdk.trace('test-chain', {
            type: 'prompt',
            data: { input: 'test input' },
        });
        const traces = sdk.getTraces();
        expect(traces).toHaveLength(1);
        expect(traces[0].chainId).toBe('test-chain');
        expect(traces[0].type).toBe('prompt');
        expect(traces[0].data).toEqual({ input: 'test input' });
    });
    it('should work with console transport', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const transport = new transports_1.ConsoleTransport();
        sdk.setTransport(transport);
        sdk.trace('test-chain', {
            type: 'prompt',
            data: { input: 'test' },
        });
        await sdk.flush();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
    it('should work with memory storage', async () => {
        const storage = new storage_1.MemoryStorage();
        sdk.setStorage(storage);
        await storage.save('test-key', { value: 'test-data' });
        const data = await storage.load('test-key');
        expect(data).toEqual({ value: 'test-data' });
    });
    it('should clear traces', () => {
        sdk.trace('test-chain-1', { type: 'prompt', data: {} });
        sdk.trace('test-chain-2', { type: 'prompt', data: {} });
        expect(sdk.getTraces()).toHaveLength(2);
        sdk.clearTraces();
        expect(sdk.getTraces()).toHaveLength(0);
    });
});
