import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  getRectOfNodes,
  getTransformForBounds,
} from 'reactflow';
import { toPng } from 'html-to-image';
import { Download, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

import 'reactflow/dist/style.css';

// Professional Business Node Types
const DatabaseNode = ({ data, isConnectable }) => {
  return (
    <div className="px-5 py-3 shadow-xl rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 min-w-[160px] hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3 shadow-sm"></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-blue-900 mb-1">{data.label}</div>
          <div className="text-xs text-blue-700 font-medium">{data.type || 'Database Layer'}</div>
          {data.details && (
            <div className="text-xs text-blue-600 mt-1">{data.details}</div>
          )}
        </div>
      </div>
      {data.technologies && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.technologies.map((tech, idx) => (
            <span key={idx} className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const ServiceNode = ({ data, isConnectable }) => {
  return (
    <div className="px-5 py-3 shadow-xl rounded-xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 min-w-[160px] hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mr-3 shadow-sm"></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-green-900 mb-1">{data.label}</div>
          <div className="text-xs text-green-700 font-medium">{data.type || 'Business Service'}</div>
          {data.details && (
            <div className="text-xs text-green-600 mt-1">{data.details}</div>
          )}
        </div>
      </div>
      {data.capabilities && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.capabilities.map((cap, idx) => (
            <span key={idx} className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
              {cap}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const APINode = ({ data, isConnectable }) => {
  return (
    <div className="px-5 py-3 shadow-xl rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-400 min-w-[160px] hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mr-3 shadow-sm"></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-purple-900 mb-1">{data.label}</div>
          <div className="text-xs text-purple-700 font-medium">{data.type || 'API Gateway'}</div>
          {data.details && (
            <div className="text-xs text-purple-600 mt-1">{data.details}</div>
          )}
        </div>
      </div>
      {data.endpoints && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.endpoints.map((endpoint, idx) => (
            <span key={idx} className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-medium">
              {endpoint}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const UserNode = ({ data, isConnectable }) => {
  return (
    <div className="px-5 py-3 shadow-xl rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400 min-w-[160px] hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg mr-3 shadow-sm"></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-orange-900 mb-1">{data.label}</div>
          <div className="text-xs text-orange-700 font-medium">{data.type || 'User Interface'}</div>
          {data.details && (
            <div className="text-xs text-orange-600 mt-1">{data.details}</div>
          )}
        </div>
      </div>
      {data.features && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.features.map((feature, idx) => (
            <span key={idx} className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// New Business-Specific Node Types
const BusinessProcessNode = ({ data, isConnectable }) => {
  return (
    <div className="px-5 py-3 shadow-xl rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-400 min-w-[160px] hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg mr-3 shadow-sm"></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-indigo-900 mb-1">{data.label}</div>
          <div className="text-xs text-indigo-700 font-medium">{data.type || 'Business Process'}</div>
          {data.details && (
            <div className="text-xs text-indigo-600 mt-1">{data.details}</div>
          )}
        </div>
      </div>
      {data.steps && (
        <div className="mt-2 text-xs text-indigo-700">
          <span className="font-medium">{data.steps.length} steps</span>
        </div>
      )}
    </div>
  );
};

const ExternalSystemNode = ({ data, isConnectable }) => {
  return (
    <div className="px-5 py-3 shadow-xl rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-400 min-w-[160px] hover:shadow-2xl transition-all duration-300 border-dashed">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg mr-3 shadow-sm"></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-900 mb-1">{data.label}</div>
          <div className="text-xs text-gray-700 font-medium">{data.type || 'External System'}</div>
          {data.details && (
            <div className="text-xs text-gray-600 mt-1">{data.details}</div>
          )}
        </div>
      </div>
      {data.integration && (
        <div className="mt-2">
          <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full font-medium">
            {data.integration}
          </span>
        </div>
      )}
    </div>
  );
};

const SecurityNode = ({ data, isConnectable }) => {
  return (
    <div className="px-5 py-3 shadow-xl rounded-xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-400 min-w-[160px] hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-lg mr-3 shadow-sm"></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-red-900 mb-1">{data.label}</div>
          <div className="text-xs text-red-700 font-medium">{data.type || 'Security Layer'}</div>
          {data.details && (
            <div className="text-xs text-red-600 mt-1">{data.details}</div>
          )}
        </div>
      </div>
      {data.protocols && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.protocols.map((protocol, idx) => (
            <span key={idx} className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">
              {protocol}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  database: DatabaseNode,
  service: ServiceNode,
  api: APINode,
  user: UserNode,
  businessProcess: BusinessProcessNode,
  externalSystem: ExternalSystemNode,
  security: SecurityNode,
};

// Professional Business Architecture - Default nodes for demonstration
const initialNodes = [
  {
    id: '1',
    type: 'user',
    position: { x: 50, y: 200 },
    data: { 
      label: 'Business Users', 
      type: 'Web Application',
      details: 'Business Analysts & Stakeholders',
      features: ['Dashboard', 'Reports', 'Analytics']
    },
  },
  {
    id: '2',
    type: 'security',
    position: { x: 250, y: 150 },
    data: { 
      label: 'Security Gateway', 
      type: 'Authentication & Authorization',
      details: 'Enterprise Security Layer',
      protocols: ['OAuth 2.0', 'JWT', 'RBAC']
    },
  },
  {
    id: '3',
    type: 'api',
    position: { x: 450, y: 200 },
    data: { 
      label: 'API Management', 
      type: 'Enterprise API Gateway',
      details: 'Rate Limiting, Monitoring, Versioning',
      endpoints: ['REST', 'GraphQL', 'WebSocket']
    },
  },
  {
    id: '4',
    type: 'businessProcess',
    position: { x: 650, y: 100 },
    data: { 
      label: 'Requirements Analysis', 
      type: 'Core Business Process',
      details: 'AI-Powered Document Generation',
      steps: ['Extract', 'Analyze', 'Generate', 'Review']
    },
  },
  {
    id: '5',
    type: 'service',
    position: { x: 650, y: 250 },
    data: { 
      label: 'Document Service', 
      type: 'Business Logic Layer',
      details: 'TRD, HLD, LLD Generation',
      capabilities: ['AI Integration', 'Templates', 'Export']
    },
  },
  {
    id: '6',
    type: 'service',
    position: { x: 650, y: 350 },
    data: { 
      label: 'Workflow Engine', 
      type: 'Process Orchestration',
      details: 'Approval & DevOps Integration',
      capabilities: ['Email', 'Azure DevOps', 'Notifications']
    },
  },
  {
    id: '7',
    type: 'database',
    position: { x: 850, y: 200 },
    data: { 
      label: 'Enterprise Data', 
      type: 'Data Persistence Layer',
      details: 'Documents, Analysis, Metadata',
      technologies: ['PostgreSQL', 'Qdrant Vector DB']
    },
  },
  {
    id: '8',
    type: 'externalSystem',
    position: { x: 850, y: 350 },
    data: { 
      label: 'Azure DevOps', 
      type: 'External Integration',
      details: 'Work Item Management',
      integration: 'REST API'
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#dc2626', strokeWidth: 2 }, label: 'Authentication' },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 }, label: 'Secure Access' },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#4f46e5', strokeWidth: 2 }, label: 'Process Request' },
  { id: 'e3-5', source: '3', target: '5', animated: true, style: { stroke: '#059669', strokeWidth: 2 }, label: 'Document API' },
  { id: 'e3-6', source: '3', target: '6', animated: true, style: { stroke: '#0891b2', strokeWidth: 2 }, label: 'Workflow API' },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#4f46e5', strokeWidth: 2 }, label: 'Analysis Flow' },
  { id: 'e5-7', source: '5', target: '7', animated: true, style: { stroke: '#2563eb', strokeWidth: 2 }, label: 'Data Storage' },
  { id: 'e6-7', source: '6', target: '7', animated: true, style: { stroke: '#2563eb', strokeWidth: 2 }, label: 'Metadata' },
  { id: 'e6-8', source: '6', target: '8', animated: true, style: { stroke: '#6b7280', strokeWidth: 2 }, label: 'Work Items' },
];

const ReactFlowDiagram = ({ diagramData, title = "System Architecture", onExport }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(diagramData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagramData?.edges || initialEdges);
  const { getNodes, fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Export diagram as PNG
  const onDownloadImage = useCallback(() => {
    const nodesBounds = getRectOfNodes(getNodes());
    const transform = getTransformForBounds(nodesBounds, 1024, 768, 0.5, 2);

    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: '#ffffff',
      width: 1024,
      height: 768,
      style: {
        width: '1024px',
        height: '768px',
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.setAttribute('download', `${title.replace(/\s+/g, '_')}_diagram.png`);
      a.setAttribute('href', dataUrl);
      a.click();
      
      if (onExport) {
        onExport(dataUrl);
      }
    });
  }, [getNodes, title, onExport]);

  const onFitView = useCallback(() => {
    fitView({ duration: 800 });
  }, [fitView]);

  const onResetTransform = useCallback(() => {
    setCenter(400, 300, { zoom: 1, duration: 800 });
  }, [setCenter]);

  // Update nodes when diagramData changes
  useEffect(() => {
    if (diagramData?.nodes) {
      setNodes(diagramData.nodes);
    }
    if (diagramData?.edges) {
      setEdges(diagramData.edges);
    }
  }, [diagramData, setNodes, setEdges]);

  return (
    <div className="w-full h-96 border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap 
            nodeStrokeColor={(n) => {
              if (n.type === 'database') return '#3b82f6';
              if (n.type === 'service') return '#10b981';
              if (n.type === 'api') return '#8b5cf6';
              if (n.type === 'user') return '#f59e0b';
              return '#eee';
            }}
            nodeColor={(n) => {
              if (n.type === 'database') return '#dbeafe';
              if (n.type === 'service') return '#d1fae5';
              if (n.type === 'api') return '#e9d5ff';
              if (n.type === 'user') return '#fed7aa';
              return '#fff';
            }}
            nodeBorderRadius={8}
          />
          <Background color="#aaa" gap={16} />
          
          {/* Custom Controls Panel */}
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-2 m-2">
            <div className="flex space-x-2">
              <button
                onClick={onDownloadImage}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Download as PNG"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={zoomIn}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={zoomOut}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={onFitView}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Fit View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onResetTransform}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </Panel>
          
          {/* Title Panel */}
          <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-3 m-2">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600">Interactive System Diagram</p>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
const ReactFlowDiagramWrapper = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowDiagram {...props} />
    </ReactFlowProvider>
  );
};

export default ReactFlowDiagramWrapper;

