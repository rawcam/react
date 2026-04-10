import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from 'reactflow';
//import 'reactflow/dist/style.css';
import DeviceNode from '../components/flow/DeviceNode';
import EditNodeModal from '../components/flow/EditNodeModal';
import { useFlowSchemas } from '../hooks/useFlowSchemas';
import { DeviceNodeData, CableEdgeData, DeviceInterface } from '../types/flowTypes';
import './FlowEditorPage.css';

const nodeTypes = { deviceNode: DeviceNode };

const createDemoInterfaces = (): { inputs: DeviceInterface[]; outputs: DeviceInterface[] } => {
  const inputId = (name: string) => `in-${Date.now()}-${name}`;
  const outputId = (name: string) => `out-${Date.now()}-${name}`;
  return {
    inputs: [
      { id: inputId('hdmi1'), name: 'HDMI IN 1', direction: 'input', connector: 'HDMI', protocol: 'HDMI' },
      { id: inputId('dante1'), name: 'Dante IN', direction: 'input', connector: 'RJ45', protocol: 'Dante', poe: false },
      { id: inputId('power'), name: 'Power IN', direction: 'input', connector: 'IEC', protocol: 'Power', power: 100, voltage: 'AC' },
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

const InformerPanel: React.FC<{ nodes: Node<DeviceNodeData>[]; edges: Edge<CableEdgeData>[] }> = ({ nodes, edges }) => {
  const totalPower = nodes.reduce((sum, n) => sum + (n.data.totalPowerConsumption || 0), 0);
  const totalPoE = nodes.reduce((sum, n) => sum + (n.data.totalPoEConsumption || 0), 0);
  const poeSources = nodes.filter(n => n.data.outputs.some(o => o.poe && o.poePower));
  const totalPoeBudget = poeSources.reduce((sum, n) => sum + n.data.outputs.reduce((s, o) => s + (o.poePower || 0), 0), 0);
  const usedPoeBudget = totalPoE;

  return (
    <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', margin: '8px', fontSize: '13px' }}>
      <h4 style={{ margin: '0 0 8px' }}>📊 Статистика</h4>
      <div>🔌 Общая мощность: {totalPower} Вт</div>
      <div>🌐 PoE бюджет: {usedPoeBudget} / {totalPoeBudget} Вт</div>
      <div>🔗 Кабелей: {edges.length}</div>
      <div>🖥️ Устройств: {nodes.length}</div>
    </div>
  );
};

const FlowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<DeviceNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CableEdgeData>([]);
  const [editingNode, setEditingNode] = useState<Node<DeviceNodeData> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gridSettings, setGridSettings] = useState(() => {
    const saved = localStorage.getItem('flow_grid_settings');
    return saved ? JSON.parse(saved) : { variant: BackgroundVariant.Dots, gap: 15, snapToGrid: true, snapGrid: [15, 15] };
  });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; nodeId: string | null }>({
    visible: false, x: 0, y: 0, nodeId: null,
  });

  const { schemas, currentSchemaId, schemaName, setSchemaName, saveCurrentSchema, loadSchema, newSchema } = useFlowSchemas();

  const saveGridSettings = (newSettings: typeof gridSettings) => {
    setGridSettings(newSettings);
    localStorage.setItem('flow_grid_settings', JSON.stringify(newSettings));
  };

  const updateGridVariant = (variant: BackgroundVariant) => saveGridSettings({ ...gridSettings, variant });
  const updateGridGap = (gap: number) => saveGridSettings({ ...gridSettings, gap, snapGrid: [gap, gap] });
  const updateSnapToGrid = (snap: boolean) => saveGridSettings({ ...gridSettings, snapToGrid: snap });

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
      };

      const newEdge: Edge<CableEdgeData> = {
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: compat.adapter ? `${compat.cableType} (${compat.adapter})` : compat.cableType,
        labelStyle: { fill: '#2563eb', fontWeight: 500, fontSize: 10 },
        style: { stroke: '#2563eb', strokeWidth: 2 },
        data: cableData,
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
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
        const newNode = {
          ...node,
          id: Date.now().toString(),
          position: { x: node.position.x + 50, y: node.position.y + 50 },
          data: { ...node.data, inputs: node.data.inputs.map(i => ({ ...i, id: `${i.id}-copy-${Date.now()}` })), outputs: node.data.outputs.map(o => ({ ...o, id: `${o.id}-copy-${Date.now()}` })) }
        };
        setNodes(nds => nds.concat(newNode));
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', closeContextMenu);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', closeContextMenu);
    };
  }, []);

  const exportSVG = async () => {
    const element = document.querySelector('.react-flow');
    if (element) {
      const htmlToImage = (await import('html-to-image')).default;
      try {
        const dataUrl = await htmlToImage.toSvg(element as HTMLElement, { backgroundColor: '#f9fafb' });
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fb' }}>
      <div style={{ padding: '8px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={currentSchemaId || ''} onChange={e => handleLoadSchema(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
            <option value="">-- Выберите схему --</option>
            {schemas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={schemaName} onChange={e => setSchemaName(e.target.value)} placeholder="Название схемы" style={{ padding: '6px 12px', borderRadius: '6px', width: '200px' }} />
          <button onClick={handleSaveSchema} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px' }}>💾 Сохранить</button>
          <button onClick={handleNewSchema} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px' }}>📄 Новая</button>
          <button onClick={exportSVG} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px' }}>📷 Экспорт SVG</button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <button className="add-node-btn" onClick={() => setShowSettings(!showSettings)}>⚙️</button>
            {showSettings && (
              <div className="settings-menu" onClick={e => e.stopPropagation()}>
                <label>Вид сетки:
                  <select value={gridSettings.variant} onChange={e => updateGridVariant(e.target.value as BackgroundVariant)}>
                    <option value={BackgroundVariant.Dots}>Точки</option>
                    <option value={BackgroundVariant.Lines}>Линии</option>
                  </select>
                </label>
                <label>Размер ячейки:
                  <input type="number" min="5" max="50" value={gridSettings.gap} onChange={e => updateGridGap(Number(e.target.value))} />
                </label>
                <label><input type="checkbox" checked={gridSettings.snapToGrid} onChange={e => updateSnapToGrid(e.target.checked)} /> Прилипание</label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeDoubleClick={(_, node) => { setEditingNode(node); setShowModal(true); }}
              onNodeContextMenu={onNodeContextMenu}
              fitView
              snapToGrid={gridSettings.snapToGrid}
              snapGrid={gridSettings.snapGrid}
            >
              <Background variant={gridSettings.variant} gap={gridSettings.gap} color="#cbd5e1" />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        <div style={{ width: '260px', background: 'white', borderLeft: '1px solid #e2e8f0', overflowY: 'auto' }}>
          <InformerPanel nodes={nodes} edges={edges} />
        </div>
      </div>

      {contextMenu.visible && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 0', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div onClick={() => handleContextMenuAction('edit')} style={{ padding: '6px 16px', cursor: 'pointer' }}>✏️ Редактировать</div>
          <div onClick={() => handleContextMenuAction('duplicate')} style={{ padding: '6px 16px', cursor: 'pointer' }}>📋 Дублировать</div>
          <div onClick={() => handleContextMenuAction('delete')} style={{ padding: '6px 16px', cursor: 'pointer' }}>🗑️ Удалить</div>
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
