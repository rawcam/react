// src/pages/FlowEditorPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
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
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from '../components/flow/DeviceNode';
import CableEdge from '../components/flow/CableEdge';
import EditNodeModal from '../components/flow/EditNodeModal';
import Sidebar from '../components/flow/Sidebar';
import { useFlowSchemas } from '../hooks/useFlowSchemas';
import { DeviceNodeData, CableEdgeData, DeviceInterface, SavedSchema } from '../types/flowTypes';
import { exportToDxf } from '../utils/exportToDxf';
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
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ visible: boolean; x: number; y: number; edgeId: string | null }>({
    visible: false, x: 0, y: 0, edgeId: null,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { schemas, currentSchemaId, schemaName, setSchemaName, saveCurrentSchema, loadSchema, newSchema, importSchema } = useFlowSchemas();
  const { updateEdge } = useReactFlow();

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
            icon: 'fas fa-camera',
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
            icon: 'fas fa-network-wired',
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
            icon: 'fas fa-video',
            inputs: [
              { id: 'cam-in-1', name: 'PoE IN', direction: 'input', connector: 'RJ45', protocol: 'Ethernet', poe: true, poePower: 15 },
            ],
            outputs: [],
            color: '#ef4444',
            totalPoEConsumption: 15,
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
        badgeFontSize: 6,
        badgeTextColor: '#2563eb',
        badgeBorderColor: '#2563eb',
        badgeBorderWidth: 1,
        badgeBorderRadius: 12,
        badgeBackgroundColor: 'var(--bg-panel)',
        markerFontSize: 5,
        markerTextColor: '#2563eb',
        markerBorderColor: '#2563eb',
        markerBorderWidth: 1,
        markerBorderRadius: 8,
        markerBackgroundColor: '#ffffff',
        hideMainBadge: false,
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
    },
    [setEdges]
  );

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, nodeId: node.id });
    setEdgeContextMenu({ visible: false, x: 0, y: 0, edgeId: null });
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeContextMenu({ visible: true, x: event.clientX, y: event.clientY, edgeId: edge.id });
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, []);

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
    setEdgeContextMenu({ visible: false, x: 0, y: 0, edgeId: null });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu.nodeId) return;
    if (action === 'delete') {
      setNodes(nds => nds.filter(n => n.id !== contextMenu.nodeId));
      setEdges(eds => eds.filter(e => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId));
    } else if (action === 'duplicate') {
      const node = nodes.find(n => n.id === contextMenu.nodeId);
      if (node) duplicateNode(node);
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
    setNodes(nds => [...nds, newNode]);
  };

  const addNewNode = () => {
    const newId = Date.now().toString();
    const newNode: Node<DeviceNodeData> = {
      id: newId,
      type: 'deviceNode',
      position: { x: 200, y: 200 },
      data: {
        label: 'Новое устройство',
        icon: 'fas fa-microchip',
        inputs: [{ id: `in-${newId}-1`, name: 'Вход 1', direction: 'input', connector: 'HDMI', protocol: 'HDMI' }],
        outputs: [{ id: `out-${newId}-1`, name: 'Выход 1', direction: 'output', connector: 'HDMI', protocol: 'HDMI' }],
        color: '#2563eb',
      },
    };
    setNodes(nds => [...nds, newNode]);
  };

  // Применение стиля к рёбрам, подключённым к ноде
  const applyStyleToNodeEdges = (edgeId: string, nodeSide: 'source' | 'target') => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const nodeId = nodeSide === 'source' ? edge.source : edge.target;
    const styleToApply = edge.style;
    const hideMainBadge = edge.data?.hideMainBadge;
    const sourceLabelText = edge.data?.sourceLabelText;
    const targetLabelText = edge.data?.targetLabelText;
    
    setEdges(eds => eds.map(e => {
      if (e.source === nodeId || e.target === nodeId) {
        updateEdge(e.id, { style: styleToApply });
        return {
          ...e,
          style: styleToApply,
          data: {
            ...e.data,
            hideMainBadge,
            sourceLabelText: e.source === nodeId ? sourceLabelText : e.data?.sourceLabelText,
            targetLabelText: e.target === nodeId ? targetLabelText : e.data?.targetLabelText,
          }
        };
      }
      return e;
    }));
  };

  // Применение стиля к рёбрам того же типа
  const applyStyleToEdgesOfSameType = (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const cableType = edge.data?.cableType;
    if (!cableType) return;
    const styleToApply = edge.style;
    const hideMainBadge = edge.data?.hideMainBadge;
    const markerFontSize = edge.data?.markerFontSize;
    const markerTextColor = edge.data?.markerTextColor;
    // ... другие настройки маркировок
    
    setEdges(eds => eds.map(e => {
      if (e.data?.cableType === cableType) {
        updateEdge(e.id, { style: styleToApply });
        return {
          ...e,
          style: styleToApply,
          data: { ...e.data, hideMainBadge, markerFontSize, markerTextColor }
        };
      }
      return e;
    }));
  };

  // Переключение hideMainBadge для текущего ребра
  const toggleHideMainBadge = (edgeId: string) => {
    setEdges(eds => eds.map(e => {
      if (e.id === edgeId) {
        const newHide = !e.data?.hideMainBadge;
        return { ...e, data: { ...e.data, hideMainBadge: newHide } };
      }
      return e;
    }));
  };

  // Переключение видимости маркировок (скрываем, если обе пусты; показываем, если были скрыты)
  const toggleMarkers = (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const hasMarkers = !!(edge.data?.sourceLabelText || edge.data?.targetLabelText);
    // Если маркеры есть, скрываем их (сохраняем в скрытые поля)
    if (hasMarkers) {
      setEdges(eds => eds.map(e => {
        if (e.id === edgeId) {
          return {
            ...e,
            data: {
              ...e.data,
              _hiddenSourceLabel: e.data.sourceLabelText,
              _hiddenTargetLabel: e.data.targetLabelText,
              sourceLabelText: '',
              targetLabelText: '',
            }
          };
        }
        return e;
      }));
    } else {
      // Восстанавливаем из скрытых
      setEdges(eds => eds.map(e => {
        if (e.id === edgeId) {
          return {
            ...e,
            data: {
              ...e.data,
              sourceLabelText: e.data._hiddenSourceLabel || '',
              targetLabelText: e.data._hiddenTargetLabel || '',
            }
          };
        }
        return e;
      }));
    }
  };

  const handleEdgeContextMenuAction = (action: string) => {
    if (!edgeContextMenu.edgeId) return;
    const edge = edges.find(e => e.id === edgeContextMenu.edgeId);
    if (!edge) return;

    if (action === 'toggleMainBadge') {
      toggleHideMainBadge(edge.id);
    } else if (action === 'toggleMarkers') {
      toggleMarkers(edge.id);
    } else if (action === 'applyToNodeSource') {
      applyStyleToNodeEdges(edge.id, 'source');
    } else if (action === 'applyToNodeTarget') {
      applyStyleToNodeEdges(edge.id, 'target');
    } else if (action === 'applyToSameType') {
      applyStyleToEdgesOfSameType(edge.id);
    } else if (action === 'openSidebar') {
      // Выделяем ребро (уже выделено) и раскрываем секцию свойств кабеля
      // Это делается через сайдбар, можно просто установить selectedEdge
      setSelectedEdge(edge);
      // TODO: вызвать раскрытие секции в Sidebar (пропс onToggleSection)
    }
    closeContextMenu();
  };

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
      if (isInput) return;

      // Существующие хоткеи
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedNode) {
          setCopiedNode(selectedNode);
          e.preventDefault();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (copiedNode) {
          duplicateNode(copiedNode);
          e.preventDefault();
        }
      }
      if (e.key === 'Delete') {
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
        e.preventDefault();
      }

      // Новые хоткеи для рёбер (только если выделено ребро и не в поле ввода)
      if (selectedEdge && e.shiftKey) {
        const edge = selectedEdge;
        if (e.key === 'H') {
          e.preventDefault();
          toggleHideMainBadge(edge.id);
        } else if (e.key === 'M') {
          e.preventDefault();
          toggleMarkers(edge.id);
        } else if (e.key === 'N') {
          e.preventDefault();
          applyStyleToNodeEdges(edge.id, 'source'); // или 'target' – можно уточнить
        } else if (e.key === 'T') {
          e.preventDefault();
          applyStyleToEdgesOfSameType(edge.id);
        } else if (e.key === 'E') {
          e.preventDefault();
          setSelectedEdge(edge); // выделение
          // TODO: раскрыть секцию в сайдбаре
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, copiedNode, setNodes, setEdges, selectedEdge]);

  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  const applyNodeStyleToAll = (styles: Partial<DeviceNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, ...styles },
      }))
    );
  };

  const saveSchemaToFile = () => { /* ... */ };
  const loadSchemaFromFile = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const exportSVG = async () => { /* ... */ };
  const exportDXF = () => { exportToDxf(nodes, edges, schemaName || 'scheme'); };

  const handleLoadSchema = (id: string) => { /* ... */ };
  const handleNewSchema = () => { /* ... */ };
  const handleSaveSchema = () => saveCurrentSchema(nodes, edges);

  const handleUpdateNode = (nodeId: string, updates: Partial<DeviceNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
    );
  };

  const handleUpdateEdge = useCallback((edgeId: string, updates: any) => {
    const styleUpdate: React.CSSProperties = {};
    if (updates.edgeStrokeColor) styleUpdate.stroke = updates.edgeStrokeColor;
    if (updates.edgeStrokeWidth) styleUpdate.strokeWidth = updates.edgeStrokeWidth;

    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edgeId) {
          return { ...e, data: { ...e.data, ...updates } };
        }
        return e;
      })
    );

    if (Object.keys(styleUpdate).length > 0) {
      updateEdge(edgeId, { style: styleUpdate });
    }
  }, [updateEdge, setEdges]);

  const handleToggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleToggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <div className={`flow-editor ${theme}`} style={{ height: '100vh', display: 'flex', background: 'var(--bg-page)' }}>
      <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={loadSchemaFromFile} />
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
        onExportDXF={exportDXF}
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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeDoubleClick={(_event: any, node: any) => { setEditingNode(node); setShowModal(true); }}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          fitView
          snapToGrid={gridSettings.snapToGrid}
          snapGrid={gridSettings.snapGrid}
          connectionLineType={ConnectionLineType.Step}
          defaultEdgeOptions={{ type: 'cableEdge', animated: false }}
        >
          {gridSettings.visible && (
            <div style={{ opacity: gridSettings.opacity ?? 0.5 }}>
              <Background variant={gridSettings.variant} gap={gridSettings.gap} color={gridSettings.color || '#cbd5e1'} />
            </div>
          )}
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {contextMenu.visible && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '4px 0', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div onClick={() => handleContextMenuAction('edit')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-edit" style={{ width: 16 }}></i> Редактировать
          </div>
          <div onClick={() => handleContextMenuAction('duplicate')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-copy" style={{ width: 16 }}></i> Дублировать
          </div>
          <div onClick={() => handleContextMenuAction('delete')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-trash" style={{ width: 16 }}></i> Удалить
          </div>
        </div>
      )}

      {edgeContextMenu.visible && (
        <div style={{ position: 'fixed', top: edgeContextMenu.y, left: edgeContextMenu.x, background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '4px 0', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ padding: '6px 16px', fontSize: 11, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)' }}>Действия с кабелем</div>
          <div onClick={() => handleEdgeContextMenuAction('toggleMainBadge')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-eye-slash" style={{ width: 16 }}></i> Скрыть тип кабеля
          </div>
          <div onClick={() => handleEdgeContextMenuAction('toggleMarkers')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-tags" style={{ width: 16 }}></i> Скрыть маркировки
          </div>
          <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }}></div>
          <div style={{ padding: '6px 16px', fontSize: 11, color: 'var(--text-secondary)' }}>Применить стиль:</div>
          <div onClick={() => handleEdgeContextMenuAction('applyToNodeSource')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-arrow-right-to-bracket" style={{ width: 16 }}></i> Ко всем кабелям источника
          </div>
          <div onClick={() => handleEdgeContextMenuAction('applyToNodeTarget')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-arrow-left-to-bracket" style={{ width: 16 }}></i> Ко всем кабелям приёмника
          </div>
          <div onClick={() => handleEdgeContextMenuAction('applyToSameType')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-tag" style={{ width: 16 }}></i> Ко всем кабелям такого же типа
          </div>
          <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }}></div>
          <div onClick={() => handleEdgeContextMenuAction('openSidebar')} style={{ padding: '6px 16px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-sliders-h" style={{ width: 16 }}></i> Настроить в сайдбаре
          </div>
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
