import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDebuggerStore } from '../../store/debugger';
import { PromptNode } from './nodes/PromptNode';
import { ResponseNode } from './nodes/ResponseNode';
import { FunctionCallNode } from './nodes/FunctionCallNode';
import { ErrorNode } from './nodes/ErrorNode';

const nodeTypes = {
  prompt: PromptNode,
  response: ResponseNode,
  function_call: FunctionCallNode,
  tool_use: FunctionCallNode,
  agent_step: ResponseNode,
  error: ErrorNode,
  warning: ErrorNode,
};

interface ChainVisualizationProps {
  onNodeClick?: () => void;
}

const ChainVisualization: React.FC<ChainVisualizationProps> = ({ onNodeClick }) => {
  const { 
    nodes: storeNodes, 
    edges: storeEdges, 
    setSelectedNode,
    selectedNodeId 
  } = useDebuggerStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  // Convert store nodes/edges to React Flow format
  useEffect(() => {
    const reactFlowNodes: Node[] = storeNodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        selected: selectedNodeId === node.id,
      },
      selected: selectedNodeId === node.id,
    }));

    const reactFlowEdges: Edge[] = storeEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      animated: true,
    }));

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [storeNodes, storeEdges, selectedNodeId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      onNodeClick?.(); // Call the prop callback if provided
    },
    [setSelectedNode, onNodeClick]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  if (storeNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
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
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls className="bg-white shadow-lg border border-gray-200" />
        <MiniMap
          className="bg-white border border-gray-200"
          nodeColor={(node) => {
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
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

const ChainVisualizationWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ChainVisualization />
    </ReactFlowProvider>
  );
};

export default ChainVisualizationWrapper;
