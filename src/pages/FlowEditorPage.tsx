import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ConnectionLineType,
  useOnSelectionChange,
  reconnectEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from '../components/flow/DeviceNode';
import CableEdge from '../components/flow/CableEdge';
import EditNodeModal from '../components/flow/EditNodeModal';
import Sidebar from '../components/flow/Sidebar';
import { useFlowSchemas } from '../hooks/useFlowSchemas';
import { DeviceNodeData, CableEdgeData, DeviceInterface, SavedSchema } from '../types/flowTypes';
import './FlowEditorPage.css';

const nodeTypes = { deviceNode: DeviceNode };
const edgeTypes = { cableEdge: CableEdge };

// ... функции createDemoInterfaces и checkCompatibility без изменений ...

const FlowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DeviceNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CableEdgeData>>([]);
  const [editingNode, setEditingNode] = useState<Node<DeviceNodeData> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<DeviceNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge<CableEdgeData> | null>(null);
  const [copiedNode, setCopiedNode] = useState<Node<DeviceNodeData> | null>(null);
  const [gridSettings, setGridSettings] = useState(() => {
    const saved = localStorage.getItem('flow_grid_settings');
    const defaults = {
      variant: BackgroundVariant.Dots,
      gap: 15,
      snapToGrid: true,
      snapGrid: [15, 15],
      color: '#cbd5e1',
      opacity: 0.5,
      visible: true,
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; nodeId: string | null }>({
    visible: false, x: 0, y: 0, nodeId: null,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { schemas, currentSchemaId, schemaName, setSchemaName, saveCurrentSchema, loadSchema, newSchema, importSchema } = useFlowSchemas();

  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes, edges: selectedEdges }) => {
      setSelectedNode(selectedNodes.length === 1 ? (selectedNodes[0] as Node<DeviceNodeData>) : null);
      setSelectedEdge(selectedEdges.length === 1 ? (selectedEdges[0] as Edge<CableEdgeData>) : null);
    },
  });

  // ... функции сетки без изменений ...

  useEffect(() => {
    if (schemas.length === 0 && nodes.length === 0) {
      const demoNodes: Node<DeviceNodeData>[] = [
        // ... демо-ноды без изменений ...
      ];
      setNodes(demoNodes);
    }
  }, [schemas]);

  const onConnect = useCallback(
    (params: Connection) => {
      // ... без изменений ...
    },
    [nodes, setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge<CableEdgeData>, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });

  const handleContextMenuAction = (action: string) => {
    // ... без изменений ...
  };

  const duplicateNode = (node: Node<DeviceNodeData>) => {
    // ... без изменений ...
  };

  const addNewNode = () => {
    // ... без изменений ...
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ... без изменений ...
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, copiedNode, setNodes, setEdges]);

  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  const applyNodeStyleToAll = (styles: Partial<DeviceNodeData>) => {
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: { ...n.data, ...styles },
      }))
    );
  };

  const saveSchemaToFile = () => {
    // ... без изменений ...
  };

  const loadSchemaFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... без изменений ...
  };

  const exportSVG = async () => {
    // ... без изменений ...
  };

  const handleLoadSchema = (id: string) => {
    const schema = loadSchema(id);
    if (schema) {
      setNodes(schema.nodes);
      setEdges(schema.edges);
    }
  };

  const handleNewSchema = () => {
    const { nodes: emptyNodes, edges: emptyEdges } = newSchema();
    setNodes(emptyNodes);
    setEdges(emptyEdges);
  };

  const handleSaveSchema = () => saveCurrentSchema(nodes, edges);

  const handleUpdateNode = (nodeId: string, updates: Partial<DeviceNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
    );
  };

  const handleUpdateEdge = (edgeId: string, updates: Partial<CableEdgeData>) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edgeId) {
          return {
            ...e,
            data: { ...e.data, ...updates },
          } as Edge<CableEdgeData>;
        }
        return e;
      })
    );
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className={`flow-editor ${theme}`} style={{ height: '100vh', display: 'flex', background: 'var(--bg-page)' }}>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={loadSchemaFromFile}
      />
      <Sidebar
        // ... пропсы без изменений ...
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeDoubleClick={(_event, node) => { setEditingNode(node as Node<DeviceNodeData>); setShowModal(true); }}
          onNodeContextMenu={onNodeContextMenu}
          fitView
          snapToGrid={gridSettings.snapToGrid}
          snapGrid={gridSettings.snapGrid}
          connectionLineType={ConnectionLineType.Step}
          defaultEdgeOptions={{ type: 'cableEdge', animated: false }}
        >
          {gridSettings.visible && (
            <div style={{ opacity: gridSettings.opacity ?? 0.5 }}>
              <Background
                variant={gridSettings.variant}
                gap={gridSettings.gap}
                color={gridSettings.color || '#cbd5e1'}
              />
            </div>
          )}
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {contextMenu.visible && (
        // ... контекстное меню ...
      )}

      <EditNodeModal
        // ... модалка ...
      />
    </div>
  );
};

export default FlowEditor;
