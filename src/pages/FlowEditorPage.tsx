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
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as XLSX from 'xlsx';
import DeviceNode from '../components/flow/DeviceNode';
import CableEdge from '../components/flow/CableEdge';
import EditNodeModal from '../components/flow/EditNodeModal';
import Sidebar from '../components/flow/Sidebar';
import { useFlowSchemas } from '../hooks/useFlowSchemas';
import { DeviceNodeData, CableEdgeData, DeviceInterface, SavedSchema } from '../types/flowTypes';
import { exportToDxf } from '../utils/exportToDxf';
import './FlowEditorPage.css';
import { NodeTypes, EdgeTypes } from '@xyflow/react';

const nodeTypes: NodeTypes = { deviceNode: DeviceNode };
const edgeTypes: EdgeTypes = { cableEdge: CableEdge };

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

// Цвета по типам сигналов
const CABLE_TYPE_COLORS: Record<string, string> = {
  'HDMI Cable': '#7F1F00',
  'DisplayPort Cable': '#8b5cf6',
  'DVI Cable': '#f59e0b',
  'VGA Cable': '#94a3b8',
  'Cat5e': '#10b981',
  'Cat6': '#059669',
  'Cat6 SFTP': '#ef4444',
  'AES67': '#06b6d4',
  'Dante': '#d946ef',
  'Custom Cable': '#6b7280',
  'Видеосигнал HDMI/DVI': '#7F1F00',
  'Оптические линии': '#FF00FF',
  'Кодированный сигнал': '#FF7F00',
  'RS-232/RS-485': '#3FFF00',
  'Управление': '#007F1F',
  'Аудио сигнал': '#007FFF',
  'Акустический сигнал': '#00BFFF',
  'USB': '#000000',
  'Конференц-связь': '#6B8E23',
};
const DEFAULT_CABLE_COLOR = '#2563eb';

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
  const [printSettings, setPrintSettings] = useState(() => {
    const saved = localStorage.getItem('flow_print_settings');
    const defaults = {
      format: 'a4',
      orientation: 'landscape',
      visible: false,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [handleHoverEnabled, setHandleHoverEnabled] = useState(() => {
    const saved = localStorage.getItem('handle_hover_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const autoSaveEnabled = true;
  const autoSaveTimer = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { schemas, currentSchemaId, schemaName, setSchemaName, saveCurrentSchema, loadSchema, newSchema, importSchema } = useFlowSchemas();
  const { updateEdge } = useReactFlow();
  const viewport = useViewport();

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

  const updateGridVariant = (variant: string) => saveGridSettings({ ...gridSettings, variant: variant as BackgroundVariant });
  const updateGridGap = (gap: number) => saveGridSettings({ ...gridSettings, gap, snapGrid: [gap, gap] });
  const updateSnapToGrid = (snap: boolean) => saveGridSettings({ ...gridSettings, snapToGrid: snap });
  const updateGridColor = (color: string) => saveGridSettings({ ...gridSettings, color });
  const updateGridOpacity = (opacity: number) => saveGridSettings({ ...gridSettings, opacity });
  const updateGridVisible = (visible: boolean) => saveGridSettings({ ...gridSettings, visible });

  const updatePrintSettings = (newSettings: Partial<typeof printSettings>) => {
    const updated = { ...printSettings, ...newSettings };
    setPrintSettings(updated);
    localStorage.setItem('flow_print_settings', JSON.stringify(updated));
  };

  useEffect(() => {
    // Пустой холст при запуске
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

      const cableType = compat.cableType || 'Custom Cable';
      const edgeColor = CABLE_TYPE_COLORS[cableType] || DEFAULT_CABLE_COLOR;

      const sourceLabel = `${sourceNode.data.label}: ${sourceInterface.name}`;
      const targetLabel = `${targetNode.data.label}: ${targetInterface.name}`;

      const cableData: CableEdgeData = {
        cableType,
        sourceLabel,
        targetLabel,
        adapter: compat.adapter,
        edgeStrokeColor: edgeColor,
        edgeStrokeWidth: 1,
        edgeBorderRadius: 2,
        badgeFontSize: 6,
        badgeTextColor: '#2563eb',
        badgeBorderColor: '#2563eb',
        badgeBorderWidth: 1,
        badgeBorderRadius: 12,
        badgeBackgroundColor: '#ffffff',
        markerFontSize: 5,
        markerTextColor: '#000000',
        markerBorderColor: '#2563eb',
        markerBorderWidth: 1,
        markerBorderRadius: 2,
        markerBackgroundColor: '#ffffff',
        hideMainBadge: false,
        hideMarkers: false,
      };

      const newEdge: Edge<CableEdgeData> = {
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'cableEdge',
        animated: false,
        style: { stroke: edgeColor, strokeWidth: 1 },
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
        color: '#000000',
        borderRadius: 2,
        borderWidth: 1,
        showHandleHover: handleHoverEnabled,
      },
    };
    setNodes(nds => [...nds, newNode]);
  };

  const applyEdgeStyleToDevice = useCallback((edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const deviceNodeId = edge.source;
    const styleToApply = edge.style;
    const dataToApply = {
      hideMainBadge: edge.data?.hideMainBadge,
      hideMarkers: edge.data?.hideMarkers,
      markerFontSize: edge.data?.markerFontSize,
      markerTextColor: edge.data?.markerTextColor,
      markerBorderColor: edge.data?.markerBorderColor,
      markerBorderWidth: edge.data?.markerBorderWidth,
      markerBorderRadius: edge.data?.markerBorderRadius,
      markerBackgroundColor: edge.data?.markerBackgroundColor,
    };

    setEdges(eds => eds.map(e => {
      if (e.source === deviceNodeId || e.target === deviceNodeId) {
        updateEdge(e.id, { style: styleToApply });
        return {
          ...e,
          style: styleToApply,
          data: { ...e.data, ...dataToApply },
        } as Edge<CableEdgeData>;
      }
      return e;
    }));
  }, [edges, updateEdge, setEdges]);

  const applyStyleToNodeEdges = (edgeId: string, nodeSide: 'source' | 'target') => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const nodeId = nodeSide === 'source' ? edge.source : edge.target;
    const styleToApply = edge.style;
    const hideMainBadge = edge.data?.hideMainBadge;
    const hideMarkers = edge.data?.hideMarkers;
    const markerFontSize = edge.data?.markerFontSize;
    const markerTextColor = edge.data?.markerTextColor;
    const markerBorderColor = edge.data?.markerBorderColor;
    const markerBorderWidth = edge.data?.markerBorderWidth;
    const markerBorderRadius = edge.data?.markerBorderRadius;
    const markerBackgroundColor = edge.data?.markerBackgroundColor;

    setEdges(eds => eds.map(e => {
      if (e.source === nodeId || e.target === nodeId) {
        const updatedData = {
          ...e.data,
          hideMainBadge,
          hideMarkers,
          markerFontSize,
          markerTextColor,
          markerBorderColor,
          markerBorderWidth,
          markerBorderRadius,
          markerBackgroundColor,
        };
        updateEdge(e.id, { style: styleToApply });
        return { ...e, style: styleToApply, data: updatedData } as Edge<CableEdgeData>;
      }
      return e;
    }));
  };

  const applyStyleToEdgesOfSameType = (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge || !edge.data) return;
    const cableType = edge.data.cableType;
    if (!cableType) return;
    const styleToApply = edge.style;
    const hideMainBadge = edge.data.hideMainBadge;
    const hideMarkers = edge.data.hideMarkers;
    const markerFontSize = edge.data.markerFontSize;
    const markerTextColor = edge.data.markerTextColor;
    const markerBorderColor = edge.data.markerBorderColor;
    const markerBorderWidth = edge.data.markerBorderWidth;
    const markerBorderRadius = edge.data.markerBorderRadius;
    const markerBackgroundColor = edge.data.markerBackgroundColor;

    setEdges(eds => eds.map(e => {
      if (e.data?.cableType === cableType) {
        const updatedData = {
          ...e.data,
          hideMainBadge,
          hideMarkers,
          markerFontSize,
          markerTextColor,
          markerBorderColor,
          markerBorderWidth,
          markerBorderRadius,
          markerBackgroundColor,
        };
        updateEdge(e.id, { style: styleToApply });
        return { ...e, style: styleToApply, data: updatedData } as Edge<CableEdgeData>;
      }
      return e;
    }));
  };

  const toggleHideMainBadge = (edgeId: string) => {
    setEdges(eds => eds.map(e => {
      if (e.id === edgeId && e.data) {
        const newHide = !e.data.hideMainBadge;
        return { ...e, data: { ...e.data, hideMainBadge: newHide } } as Edge<CableEdgeData>;
      }
      return e;
    }));
  };

  const toggleMarkers = (edgeId: string) => {
    setEdges(eds => eds.map(e => {
      if (e.id === edgeId && e.data) {
        const newHide = !e.data.hideMarkers;
        return { ...e, data: { ...e.data, hideMarkers: newHide } } as Edge<CableEdgeData>;
      }
      return e;
    }));
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
      setSelectedEdge(edge);
    }
    closeContextMenu();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
      if (isInput) return;

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

      // Горячие клавиши экспорта
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === 'S') {
          e.preventDefault();
          exportSVG();
        } else if (e.key === 'E') {
          e.preventDefault();
          exportToExcel();
        } else if (e.key === 'D') {
          e.preventDefault();
          exportDXF();
        }
      }

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
          applyStyleToNodeEdges(edge.id, 'source');
        } else if (e.key === 'T') {
          e.preventDefault();
          applyStyleToEdgesOfSameType(edge.id);
        } else if (e.key === 'E') {
          e.preventDefault();
          setSelectedEdge(edge);
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

  // Автосохранение
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const save = () => {
      const schema = { id: currentSchemaId || Date.now().toString(), name: schemaName, nodes, edges };
      localStorage.setItem('flow_autosave', JSON.stringify(schema));
    };
    autoSaveTimer.current = window.setInterval(save, 30000);
    return () => clearInterval(autoSaveTimer.current);
  }, [nodes, edges, schemaName, currentSchemaId]);

  // Предупреждение при закрытии
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (nodes.length > 0 || edges.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes, edges]);

  const applyNodeStyleToAll = (styles: Partial<DeviceNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, ...styles },
      }))
    );
  };

  const toggleHandleHover = (enabled: boolean) => {
    setHandleHoverEnabled(enabled);
    localStorage.setItem('handle_hover_enabled', JSON.stringify(enabled));
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, showHandleHover: enabled } })));
  };

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

  const calculateStatistics = () => {
    const totalPower = nodes.reduce((sum, n) => sum + (n.data.powerSupply?.power || 0), 0);
    const poeProvided = nodes.reduce((sum, n) => {
      return sum + (n.data.outputs?.filter(o => o.poe).reduce((s, o) => s + (o.poePower || 0), 0) || 0);
    }, 0);
    const poeConsumed = nodes.reduce((sum, n) => sum + (n.data.totalPoEConsumption || 0), 0);
    return { devices: nodes.length, edges: edges.length, totalPower, poeProvided, poeConsumed };
  };

  const exportToExcel = () => {
    const rows = edges.map((edge, index) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const cableType = edge.data?.cableType || '';
      return [
        index + 1,
        edge.data?.sourceLabelText || edge.data?.sourceLabel?.split(':')[1]?.trim() || '',
        edge.data?.targetLabelText || edge.data?.targetLabel?.split(':')[1]?.trim() || '',
        sourceNode?.data.label || '',
        edge.sourceHandle || '',
        sourceNode?.data.place || '',
        '',
        targetNode?.data.label || '',
        edge.targetHandle || '',
        targetNode?.data.place || '',
        '',
        cableType,
        edge.data?.cableLength || '',
        edge.data?.cableMark || '',
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['№ п/п', 'Маркировка кабеля', '', 'Начало', '', '', '', 'Конец', '', '', '', 'Проложен', '', ''],
      ['', 'Начало', 'Конец', 'Обозначение прибора', 'Разъем на приборе', 'Место размещения', 'Разъем на кабеле', 'Обозначение прибора', 'Разъем на приборе', 'Место размещения', 'Разъем на кабеле', 'Тип сигнала', 'Длина, м', 'Марка'],
      ...rows,
    ]);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } },
      { s: { r: 0, c: 3 }, e: { r: 0, c: 6 } },
      { s: { r: 0, c: 7 }, e: { r: 0, c: 10 } },
      { s: { r: 0, c: 11 }, e: { r: 0, c: 13 } },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Кабельный журнал');
    XLSX.writeFile(wb, `${schemaName || 'scheme'}_cable_journal.xlsx`);
  };

  const clearCanvas = () => {
    if (window.confirm('Очистить холст? Все несохранённые изменения будут потеряны.')) {
      setNodes([]);
      setEdges([]);
    }
  };

  const exportSVG = async () => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) {
      alert('Не удалось найти область схемы');
      return;
    }

    const minimap = document.querySelector('.react-flow__minimap') as HTMLElement;
    const controls = document.querySelector('.react-flow__controls') as HTMLElement;
    const background = document.querySelector('.react-flow__background') as HTMLElement;
    const attribution = document.querySelector('.react-flow__attribution') as HTMLElement;
    const sidebar = document.querySelector('.sidebar') as HTMLElement;

    const minimapDisplay = minimap?.style.display;
    const controlsDisplay = controls?.style.display;
    const backgroundDisplay = background?.style.display;
    const attributionDisplay = attribution?.style.display;
    const sidebarDisplay = sidebar?.style.display;

    try {
      if (minimap) minimap.style.display = 'none';
      if (controls) controls.style.display = 'none';
      if (background) background.style.display = 'none';
      if (attribution) attribution.style.display = 'none';
      if (sidebar) sidebar.style.display = 'none';

      await new Promise(resolve => setTimeout(resolve, 50));

      const domtoimage = await import('dom-to-image-more');
      const dataUrl = await domtoimage.toSvg(flowElement, {
        bgcolor: theme === 'light' ? '#f9fafb' : '#0f172a',
        copyDefaultStyles: true,
      });

      const link = document.createElement('a');
      link.download = `flow-${schemaName || 'scheme'}.svg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Ошибка экспорта SVG:', err);
      alert('Ошибка экспорта: ' + (err as Error).message);
    } finally {
      if (minimap) minimap.style.display = minimapDisplay || '';
      if (controls) controls.style.display = controlsDisplay || '';
      if (background) background.style.display = backgroundDisplay || '';
      if (attribution) attribution.style.display = attributionDisplay || '';
      if (sidebar) sidebar.style.display = sidebarDisplay || '';
    }
  };

  const exportDXF = () => {
    exportToDxf(nodes, edges, schemaName || 'scheme');
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

  const handleUpdateEdge = useCallback((edgeId: string, updates: any) => {
    const styleUpdate: React.CSSProperties = {};
    if (updates.edgeStrokeColor) styleUpdate.stroke = updates.edgeStrokeColor;
    if (updates.edgeStrokeWidth) styleUpdate.strokeWidth = updates.edgeStrokeWidth;

    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edgeId) {
          return { ...e, data: { ...e.data, ...updates } } as Edge<CableEdgeData>;
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

  // Рамка печати
  const mmToPx = (mm: number) => (mm / 25.4) * 96;
  const formatSizes: Record<string, { width: number; height: number }> = {
    a4: { width: 210, height: 297 },
    a3: { width: 297, height: 420 },
    a2: { width: 420, height: 594 },
  };
  const getFrameSize = () => {
    const size = formatSizes[printSettings.format];
    let width = mmToPx(size.width);
    let height = mmToPx(size.height);
    if (printSettings.orientation === 'landscape') {
      [width, height] = [height, width];
    }
    return { width, height };
  };
  const frameSize = getFrameSize();

  return (
    <div className={`flow-editor ${theme}`} style={{ height: '100vh', display: 'flex', background: 'var(--bg-page)' }}>
      <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={loadSchemaFromFile} />
      <Sidebar
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateNode={handleUpdateNode}
        onUpdateEdge={handleUpdateEdge}
        onApplyNodeStyleToAll={applyNodeStyleToAll}
        onApplyEdgeStyleToDevice={applyEdgeStyleToDevice}
        schemas={schemas}
        currentSchemaId={currentSchemaId}
        schemaName={schemaName}
        onSchemaNameChange={setSchemaName}
        onLoadSchema={handleLoadSchema}
        onNewSchema={handleNewSchema}
        onSaveSchema={handleSaveSchema}
        onExportSVG={exportSVG}
        onExportDXF={exportDXF}
        onExportExcel={exportToExcel}
        onClearCanvas={clearCanvas}
        onShowStatistics={() => setShowStatsModal(true)}
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
        printSettings={printSettings}
        onUpdatePrintSettings={updatePrintSettings}
        handleHoverEnabled={handleHoverEnabled}
        onToggleHandleHover={toggleHandleHover}
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

          {printSettings.visible && (
            <div
              style={{
                position: 'absolute',
                left: -frameSize.width / 2,
                top: -frameSize.height / 2,
                width: frameSize.width,
                height: frameSize.height,
                border: '2px dashed #ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 8,
                  fontSize: 12,
                  color: '#ef4444',
                  background: 'var(--bg-panel)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  opacity: 0.8,
                }}
              >
                {printSettings.format.toUpperCase()} {printSettings.orientation === 'landscape' ? '🏞️' : '📄'}
              </div>
            </div>
          )}
        </ReactFlow>

        {/* Строка состояния */}
        <div className="flow-statusbar">
          <div className="status-left">
            <span><i className="fas fa-microchip"></i> {nodes.length} устр.</span>
            <span><i className="fas fa-plug"></i> {edges.length} каб.</span>
            <span>⚡ {calculateStatistics().totalPower} Вт</span>
          </div>
          <div className="status-center">
            <span>📏 Масштаб: {Math.round((viewport?.zoom || 1) * 100)}%</span>
          </div>
          <div className="status-right">
            <span>🔌 PoE: {calculateStatistics().poeConsumed} / {calculateStatistics().poeProvided} Вт</span>
          </div>
        </div>
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

      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-panel)', padding: 20, borderRadius: 16, width: 350, color: 'var(--text-primary)' }}>
            <h3>Статистика схемы</h3>
            <div style={{ marginTop: 16 }}>
              <p>Устройств: {nodes.length}</p>
              <p>Кабелей: {edges.length}</p>
              <p>Общая мощность: {calculateStatistics().totalPower} Вт</p>
              <p>PoE предоставлено: {calculateStatistics().poeProvided} Вт</p>
              <p>PoE потреблено: {calculateStatistics().poeConsumed} Вт</p>
            </div>
            <button onClick={() => setShowStatsModal(false)} style={{ marginTop: 16, padding: '6px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowEditor;
