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
} from 'reactflow';
import 'reactflow/dist/style.css';
import DeviceNode from '../components/flow/DeviceNode';
import CableEdge from '../components/flow/CableEdge';
import EditNodeModal from '../components/flow/EditNodeModal';
import Sidebar from '../components/flow/Sidebar';
import { useFlowSchemas } from '../hooks/useFlowSchemas';
import { DeviceNodeData, CableEdgeData, DeviceInterface, SavedSchema } from '../types/flowTypes';
import './FlowEditorPage.css';

const nodeTypes = { deviceNode: DeviceNode };
const edgeTypes = { cableEdge: CableEdge };

const createDemoInterfaces = (): { inputs: DeviceInterface[]; outputs: DeviceInterface[] } => {
  const inputId = (name: string) => `in-${Date.now()}-${name}`;
  const outputId = (name: string) => `out-${Date.now()}-${name}`;
  return {
    inputs: [
      { id: inputId('hdmi1'), name: 'HDMI IN 1', direction: 'input', connector: 'HDMI', protocol: 'HDMI' },
      { id: inputId('dante1'), name: 'Dante IN', direction: 'input', connector: 'RJ45', protocol: 'Dante', poe: false },
    ],
    outputs: [
      { id: outputId('hdmi1'), name: 'HDMI OUT 1', direction: 'output', connector: 'HDMI', protocol: 'HDMI' },
      { id: outputId('dante1'), name: 'Dante OUT', direction: 'output', connector: 'RJ45', protocol: 'Dante' },
    ],
  };
};

const checkCompatibility = (
  source: DeviceInterface,
  target: DeviceInterface
): { compatible: boolean; cableType?: string; adapter?: string } => {
  if (source.connector === target.connector && source.protocol === target.protocol) {
    return { compatible: true, cableType: `${source.connector} Cable` };
  }
  if (source.connector === 'DisplayPort' && target.connector === 'HDMI' && source.protocol === 'DisplayPort' && target.protocol === 'HDMI') {
    return { compatible: true, cableType: 'HDMI Cable', adapter: 'DP → HDMI' };
  }
  if (source.connector === 'DVI' && target.connector === 'HDMI') {
    return { compatible: true, cableType: 'HDMI Cable', adapter: 'DVI → HDMI' };
  }
  if (source.connector === 'RJ45' && target.connector === 'RJ45') {
    if (source.poe && target.poe && source.poePower && target.poePower) {
      if (source.poePower >= target.poePower) {
        return { compatible: true, cableType: 'Cat6 SFTP' };
      } else {
        return { compatible: false };
      }
    }
    if (source.protocol === 'Ethernet' || source.protocol === 'Dante' || source.protocol === 'AES67') {
      return { compatible: true, cableType: 'Cat5e' };
    }
  }
  return { compatible: false };
};

const FlowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<DeviceNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CableEdgeData>([]);
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

  const saveGridSettings = (newSettings: typeof gridSettings) => {
    setGridSettings(newSettings);
    localStorage.setItem('flow_grid_settings', JSON.stringify(newSettings));
  };

  const updateGridVariant = (variant: string) => {
    saveGridSettings({ ...gridSettings, variant: variant as BackgroundVariant });
  };
  const updateGridGap = (gap: number) => saveGridSettings({ ...gridSettings, gap, snapGrid: [gap, gap] });
  const updateSnapToGrid = (snap: boolean) => saveGridSettings({ ...gridSettings, snapToGrid: snap });
  const updateGridColor = (color: string) => saveGridSettings({ ...gridSettings, color });
  const updateGridOpacity = (opacity: number) => saveGridSettings({ ...gridSettings, opacity });
  const updateGridVisible = (visible: boolean) => saveGridSettings({ ...gridSettings, visible });

  useEffect(() => {
    if (schemas.length === 0 && nodes.length === 0) {
      const demoNodes: Node<DeviceNodeData>[] = [
        {
          id: '1',
          type: 'deviceNode',
          position: { x: 100, y: 100 },
          data: {
            label: 'Источник сигнала',
            icon: 'fa-camera',
            ...createDemoInterfaces(),
            color: '#2563eb',
            powerSupply: { voltage: 'AC', power: 50, connector: 'IEC' },
          },
        },
        {
          id: '2',
          type: 'deviceNode',
          position: { x: 400, y: 100 },
          data: {
            label: 'Коммутатор PoE',
            icon: 'fa-network-wired',
            inputs: [
              { id: 'sw-in-1', name: 'Uplink', direction: 'input', connector: 'RJ45', protocol: 'Ethernet' },
            ],
            outputs: [
              { id: 'sw-out-1', name: 'Port 1 PoE', direction: 'output', connector: 'RJ45', protocol: 'Ethernet', poe: true, poePower: 30 },
              { id: 'sw-out-2', name: 'Port 2 PoE', direction: 'output', connector: 'RJ45', protocol: 'Ethernet', poe: true, poePower: 30 },
            ],
            color: '#10b981',
            powerSupply: { voltage: 'AC', power: 150, connector: 'IEC' },
          },
        },
        {
          id: '3',
          type: 'deviceNode',
          position: { x: 700, y: 100 },
          data: {
            label: 'IP-камера',
            icon: 'fa-video',
            inputs: [
              { id: 'cam-in-1', name: 'PoE IN', direction: 'input', connector: 'RJ45', protocol: 'Ethernet', poe: true, poePower: 15 },
            ],
            outputs: [],
            color: '#ef4444',
          },
        },
      ];
      setNodes(demoNodes);
    }
  }, [schemas]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return;

      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      if (!sourceNode || !targetNode) return;

      const sourceInterface = [...sourceNode.data.inputs, ...sourceNode.data.outputs].find(i => i.id === params.sourceHandle);
      const targetInterface = [...targetNode.data.inputs, ...targetNode.data.outputs].find(i => i.id === params.targetHandle);
      if (!sourceInterface || !targetInterface) return;

      if (!(sourceInterface.direction === 'output' || sourceInterface.direction === 'bidirectional')) {
        alert('Источник должен быть выходом или двунаправленным');
        return;
      }
      if (!(targetInterface.direction === 'input' || targetInterface.direction === 'bidirectional')) {
        alert('Приёмник должен быть входом или двунаправленным');
        return;
      }

      const compat = checkCompatibility(sourceInterface, targetInterface);
      if (!compat.compatible) {
        alert(`Несовместимые интерфейсы: ${sourceInterface.connector}/${sourceInterface.protocol} → ${targetInterface.connector}/${targetInterface.protocol}`);
        return;
      }

      if (sourceInterface.poe && targetInterface.poe && sourceInterface.poePower && targetInterface.poePower) {
        if (sourceInterface.poePower < targetInterface.poePower) {
          alert(`Недостаточно мощности PoE: источник ${sourceInterface.poePower} Вт, требуется ${targetInterface.poePower} Вт`);
          return;
        }
      }

      const sourceLabel = `${sourceNode.data.label}: ${sourceInterface.name}`;
      const targetLabel = `${targetNode.data.label}: ${targetInterface.name}`;
      const cableData: CableEdgeData = {
        cableType: compat.cableType || 'Custom Cable',
        sourceLabel,
        targetLabel,
        adapter: compat.adapter,
        badgeFontSize: 10,
        badgeTextColor: '#2563eb',
        badgeBorderColor: '#2563eb',
        badgeBorderWidth: 1,
        badgeBorderRadius: 12,
        badgeBackgroundColor: 'var(--bg-panel)',
      };

      const newEdge: Edge<CableEdgeData> = {
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'cableEdge',
        animated: false,
        style: { stroke: '#2563eb', strokeWidth: 2 },
        data: cableData,
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge<CableEdgeData>, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      // Проверка совместимости будет в хуке, но можно добавить свою логику, если нужно
    },
    [setEdges]
  );

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu.nodeId) return;
    if (action === 'delete') {
      setNodes(nds => nds.filter(n => n.id !== contextMenu.nodeId));
      setEdges(eds => eds.filter(e => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId));
    } else if (action === 'duplicate') {
      const node = nodes.find(n => n.id === contextMenu.nodeId);
      if (node) {
        duplicateNode(node);
      }
    } else if (action === 'edit') {
      const node = nodes.find(n => n.id === contextMenu.nodeId);
      if (node) {
        setEditingNode(node);
        setShowModal(true);
      }
    }
    closeContextMenu();
  };

  const duplicateNode = (node: Node<DeviceNodeData>) => {
    const newId = Date.now().toString();
    const newNode: Node<DeviceNodeData> = {
      ...node,
      id: newId,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: {
        ...node.data,
        inputs: node.data.inputs.map(i => ({ ...i, id: `${i.id}-copy-${newId}` })),
        outputs: node.data.outputs.map(o => ({ ...o, id: `${o.id}-copy-${newId}` })),
      },
    };
    setNodes(nds => nds.concat(newNode));
  };

  // Добавление новой ноды
  const addNewNode = () => {
    const newId = Date.now().toString();
    const newNode: Node<DeviceNodeData> = {
      id: newId,
      type: 'deviceNode',
      position: { x: 200, y: 200 },
      data: {
        label: 'Новое устройство',
        icon: 'fa-microchip',
        inputs: [
          { id: `in-${newId}-1`, name: 'Вход 1', direction: 'input', connector: 'HDMI', protocol: 'HDMI' },
        ],
        outputs: [
          { id: `out-${newId}-1`, name: 'Выход 1', direction: 'output', connector: 'HDMI', protocol: 'HDMI' },
        ],
        color: '#2563eb',
      },
    };
    setNodes(nds => nds.concat(newNode));
  };

  // Копирование / вставка через клавиатуру (с проверкой фокуса)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
      if (isInput) return;

      // Ctrl+C копирование
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedNode) {
          setCopiedNode(selectedNode);
          e.preventDefault();
        }
      }
      // Ctrl+V вставка
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (copiedNode) {
          duplicateNode(copiedNode);
          e.preventDefault();
        }
      }
      // Delete
      if (e.key === 'Delete') {
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, copiedNode, setNodes, setEdges]);

  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  // Применить стили ко всем нодам
  const applyNodeStyleToAll = (styles: Partial<DeviceNodeData>) => {
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: { ...n.data, ...styles },
      }))
    );
  };

  // Работа с файлами
  const saveSchemaToFile = () => {
    const schema: SavedSchema = {
      id: currentSchemaId || Date.now().toString(),
      name: schemaName || 'schema',
      nodes,
      edges,
    };
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSchemaFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const schema = JSON.parse(content) as SavedSchema;
        if (schema.nodes && schema.edges) {
          importSchema(schema);
          setNodes(schema.nodes);
          setEdges(schema.edges);
        } else {
          alert('Неверный формат файла схемы');
        }
      } catch (err) {
        alert('Ошибка чтения файла: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportSVG = async () => {
    const element = document.querySelector('.react-flow');
    if (element) {
      const htmlToImage = (await import('html-to-image')).default;
      try {
        const dataUrl = await htmlToImage.toSvg(element as HTMLElement, { backgroundColor: theme === 'light' ? '#f9fafb' : '#0f172a' });
        const link = document.createElement('a');
        link.download = `flow-${schemaName}.svg`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        alert('Ошибка экспорта: ' + (err as Error).message);
      }
    }
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
            data: { ...e.data, ...updates } as CableEdgeData,
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
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateNode={handleUpdateNode}
        onUpdateEdge={handleUpdateEdge}
        onApplyNodeStyleToAll={applyNodeStyleToAll}
        schemas={schemas}
        currentSchemaId={currentSchemaId}
        schemaName={schemaName}
        onSchemaNameChange={setSchemaName}
        onLoadSchema={handleLoadSchema}
        onNewSchema={handleNewSchema}
        onSaveSchema={handleSaveSchema}
        onExportSVG={exportSVG}
        onSaveToFile={saveSchemaToFile}
        onLoadFromFile={() => fileInputRef.current?.click()}
        onAddNode={addNewNode}
        gridSettings={gridSettings}
        onUpdateGridVariant={updateGridVariant}
        onUpdateGridGap={updateGridGap}
        onUpdateSnapToGrid={updateSnapToGrid}
        onUpdateGridColor={updateGridColor}
        onUpdateGridOpacity={updateGridOpacity}
        onUpdateGridVisible={updateGridVisible}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          edgesReconnectable={true}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeDoubleClick={(_, node) => { setEditingNode(node); setShowModal(true); }}
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
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '4px 0', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div onClick={() => handleContextMenuAction('edit')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)' }}>✏️ Редактировать</div>
          <div onClick={() => handleContextMenuAction('duplicate')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)' }}>📋 Дублировать</div>
          <div onClick={() => handleContextMenuAction('delete')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)' }}>🗑️ Удалить</div>
        </div>
      )}

      <EditNodeModal
        isOpen={showModal}
        node={editingNode}
        onClose={() => setShowModal(false)}
        onSave={(updatedData) => {
          if (editingNode) {
            setNodes(nds => nds.map(n => n.id === editingNode.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
            setShowModal(false);
          }
        }}
      />
    </div>
  );
};

export default FlowEditor;
