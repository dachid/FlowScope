"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_2 = require("@xyflow/react");
require("@xyflow/react/dist/style.css");
const debugger_1 = require("../../store/debugger");
const PromptNode_1 = require("./nodes/PromptNode");
const ResponseNode_1 = require("./nodes/ResponseNode");
const FunctionCallNode_1 = require("./nodes/FunctionCallNode");
const ErrorNode_1 = require("./nodes/ErrorNode");
const nodeTypes = {
    prompt: PromptNode_1.PromptNode,
    response: ResponseNode_1.ResponseNode,
    function_call: FunctionCallNode_1.FunctionCallNode,
    tool_use: FunctionCallNode_1.FunctionCallNode,
    agent_step: ResponseNode_1.ResponseNode,
    error: ErrorNode_1.ErrorNode,
    warning: ErrorNode_1.ErrorNode,
};
const ChainVisualization = ({ onNodeClick }) => {
    const { nodes: storeNodes, edges: storeEdges, setSelectedNode, selectedNodeId } = (0, debugger_1.useDebuggerStore)();
    const [nodes, setNodes, onNodesChange] = (0, react_2.useNodesState)([]);
    const [edges, setEdges, onEdgesChange] = (0, react_2.useEdgesState)([]);
    // Convert store nodes/edges to React Flow format
    (0, react_1.useEffect)(() => {
        const reactFlowNodes = storeNodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
                ...node.data,
                selected: selectedNodeId === node.id,
            },
            selected: selectedNodeId === node.id,
        }));
        const reactFlowEdges = storeEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type || 'default',
            animated: true,
        }));
        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
    }, [storeNodes, storeEdges, selectedNodeId, setNodes, setEdges]);
    const onConnect = (0, react_1.useCallback)((params) => setEdges((eds) => (0, react_2.addEdge)(params, eds)), [setEdges]);
    const handleNodeClick = (0, react_1.useCallback)((_event, node) => {
        setSelectedNode(node.id);
        onNodeClick?.(); // Call the prop callback if provided
    }, [setSelectedNode, onNodeClick]);
    const onPaneClick = (0, react_1.useCallback)(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);
    if (storeNodes.length === 0) {
        return (<div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Chain Data
          </h3>
          <p className="text-gray-500 max-w-sm">
            Start tracing your LLM chains to see the visualization here.
            Connect your application using the FlowScope SDK.
          </p>
        </div>
      </div>);
    }
    return (<div className="h-full w-full">
      <react_2.ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={handleNodeClick} onPaneClick={onPaneClick} nodeTypes={nodeTypes} fitView className="bg-gray-50" defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
        <react_2.Background color="#e5e7eb" gap={20}/>
        <react_2.Controls className="bg-white shadow-lg border border-gray-200"/>
        <react_2.MiniMap className="bg-white border border-gray-200" nodeColor={(node) => {
            switch (node.type) {
                case 'prompt':
                    return '#3b82f6';
                case 'response':
                    return '#10b981';
                case 'function_call':
                case 'tool_use':
                    return '#f59e0b';
                case 'agent_step':
                    return '#8b5cf6';
                case 'error':
                    return '#ef4444';
                case 'warning':
                    return '#f97316';
                default:
                    return '#6b7280';
            }
        }} maskColor="rgba(0, 0, 0, 0.1)"/>
      </react_2.ReactFlow>
    </div>);
};
const ChainVisualizationWrapper = () => {
    return (<react_2.ReactFlowProvider>
      <ChainVisualization />
    </react_2.ReactFlowProvider>);
};
exports.default = ChainVisualizationWrapper;
