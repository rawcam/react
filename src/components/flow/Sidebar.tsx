// src/components/flow/Sidebar.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { Node as FlowNode, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../../types/flowTypes';

const COLOR_PALETTE = [
  '#000000', '#ffffff',
  '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
];

// Цвета по типам сигналов (легенда)
const CABLE_TYPE_COLORS: Record<string, string> = {
  'HDMI/DVI': '#7F1F00',
  'Оптические линии': '#FF00FF',
  'Кодированный сигнал': '#FF7F00',
  'RS-232/RS-485': '#3FFF00',
  'Управление': '#007F1F',
  'Аудио': '#007FFF',
  'Акустический сигнал': '#00BFFF',
  'USB': '#000000',
  'Конференц-связь': '#6B8E23',
  'Custom Cable': '#6b7280',
};

interface SidebarProps {
  selectedNode: FlowNode<DeviceNodeData> | null;
  selectedEdge: Edge<CableEdgeData> | null;
  onUpdateNode: (nodeId: string, updates: Partial<DeviceNodeData>) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<CableEdgeData>) => void;
  onApplyNodeStyleToAll: (styles: Partial<DeviceNodeData>) => void;
  onApplyEdgeStyleToDevice: (edgeId: string) => void;
  schemas: any[];
  currentSchemaId: string | null;
  schemaName: string;
  onSchemaNameChange: (name: string) => void;
  onLoadSchema: (id: string) => void;
  onNewSchema: () => void;
  onSaveSchema: () => void;
  onExportSVG: () => void;
  onExportDXF: () => void;
  onExportExcel: () => void;
  onClearCanvas: () => void;
  onShowStatistics: () => void;
  onSaveToFile: () => void;
  onLoadFromFile: () => void;
  onAddNode: () => void;
  gridSettings: any;
  onUpdateGridVariant: (variant: string) => void;
  onUpdateGridGap: (gap: number) => void;
  onUpdateSnapToGrid: (snap: boolean) => void;
  onUpdateGridColor: (color: string) => void;
  onUpdateGridOpacity: (opacity: number) => void;
  onUpdateGridVisible: (visible: boolean) => void;
  printSettings: any;
  onUpdatePrintSettings: (settings: any) => void;
  handleHoverEnabled: boolean;
  onToggleHandleHover: (enabled: boolean) => void;
  onAlignNodes?: (type: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NativeColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
}> = ({ value, onChange }) => {
  return (
    <div
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '5px',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          top: '-5px',
          left: '-5px',
          width: '30px',
          height: '30px',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          opacity: 0,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          background: value,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: 8,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-light)',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 11,
            whiteSpace: 'nowrap',
            zIndex: 1001,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            color: 'var(--text-primary)',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onApplyNodeStyleToAll,
  onApplyEdgeStyleToDevice,
  schemas,
  currentSchemaId,
  schemaName,
  onSchemaNameChange,
  onLoadSchema,
  onNewSchema,
  onSaveSchema,
  onExportSVG,
  onExportDXF,
  onExportExcel,
  onClearCanvas,
  onShowStatistics,
  onSaveToFile,
  onLoadFromFile,
  onAddNode,
  gridSettings,
  onUpdateGridVariant,
  onUpdateGridGap,
  onUpdateSnapToGrid,
  onUpdateGridColor,
  onUpdateGridOpacity,
  onUpdateGridVisible,
  printSettings,
  onUpdatePrintSettings,
  handleHoverEnabled,
  onToggleHandleHover,
  onAlignNodes,
  theme,
  onToggleTheme,
  collapsed,
  onToggleCollapse,
}) => {
  const [localNodeSettings, setLocalNodeSettings] = useState({
    borderWidth: 1,
    borderRadius: 8,
    headerFontSize: 10,
    portFontSize: 6,
    headerFontWeight: 'normal' as 'normal' | 'bold',
    rowHeight: 22,
  });
  const [localNodeColor, setLocalNodeColor] = useState('#2563eb');
  const [localEdgeSettings, setLocalEdgeSettings] = useState({
    labelText: '',
    sourceLabelText: '',
    targetLabelText: '',
    edgeStrokeWidth: 1,
    edgeStrokeColor: '#2563eb',
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
    cableLength: 0,
    cableMark: '',
  });

  const [applyingAll, setApplyingAll] = useState(false);
  const [showManage, setShowManage] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showAlign, setShowAlign] = useState(false);
  const [showNodeStyle, setShowNodeStyle] = useState(true);
  const [showEdgeStyle, setShowEdgeStyle] = useState(true);

  useEffect(() => {
    if (selectedNode) {
      setLocalNodeSettings({
        borderWidth: (selectedNode.data.borderWidth as number) ?? 1,
        borderRadius: (selectedNode.data.borderRadius as number) ?? 8,
        headerFontSize: (selectedNode.data.headerFontSize as number) ?? 10,
        portFontSize: (selectedNode.data.portFontSize as number) ?? 6,
        headerFontWeight: (selectedNode.data.headerFontWeight as 'normal' | 'bold') ?? 'normal',
        rowHeight: (selectedNode.data.rowHeight as number) ?? 22,
      });
      setLocalNodeColor((selectedNode.data.color as string) || '#2563eb');
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge && selectedEdge.data) {
      const d = selectedEdge.data;
      setLocalEdgeSettings({
        labelText: (d.labelText as string) || '',
        sourceLabelText: (d.sourceLabelText as string) || '',
        targetLabelText: (d.targetLabelText as string) || '',
        edgeStrokeWidth: (d.edgeStrokeWidth as number) ?? 1,
        edgeStrokeColor: (d.edgeStrokeColor as string) ?? '#2563eb',
        edgeBorderRadius: (d.edgeBorderRadius as number) ?? 2,
        badgeFontSize: (d.badgeFontSize as number) ?? 6,
        badgeTextColor: (d.badgeTextColor as string) ?? '#2563eb',
        badgeBorderColor: (d.badgeBorderColor as string) ?? '#2563eb',
        badgeBorderWidth: (d.badgeBorderWidth as number) ?? 1,
        badgeBorderRadius: (d.badgeBorderRadius as number) ?? 12,
        badgeBackgroundColor: (d.badgeBackgroundColor as string) ?? '#ffffff',
        markerFontSize: (d.markerFontSize as number) ?? 5,
        markerTextColor: (d.markerTextColor as string) ?? '#000000',
        markerBorderColor: (d.markerBorderColor as string) ?? '#2563eb',
        markerBorderWidth: (d.markerBorderWidth as number) ?? 1,
        markerBorderRadius: (d.markerBorderRadius as number) ?? 2,
        markerBackgroundColor: (d.markerBackgroundColor as string) ?? '#ffffff',
        hideMainBadge: (d.hideMainBadge as boolean) ?? false,
        hideMarkers: (d.hideMarkers as boolean) ?? false,
        cableLength: d.cableLength ?? 0,
        cableMark: d.cableMark || '',
      });
    }
  }, [selectedEdge]);

  const handleNodeSettingChange = (key: keyof typeof localNodeSettings, value: any) => {
    if (!selectedNode) return;
    const newSettings = { ...localNodeSettings, [key]: value };
    setLocalNodeSettings(newSettings);
    onUpdateNode(selectedNode.id, newSettings);
  };

  const handleNodeColorChange = (color: string) => {
    if (!selectedNode) return;
    setLocalNodeColor(color);
    onUpdateNode(selectedNode.id, { color });
  };

  const handleEdgeSettingChange = (key: keyof typeof localEdgeSettings, value: any) => {
    if (!selectedEdge) return;
    const newSettings = { ...localEdgeSettings, [key]: value };
    setLocalEdgeSettings(newSettings);
    onUpdateEdge(selectedEdge.id, newSettings);
  };

  const handleApplyToAll = () => {
    if (selectedNode) {
      onApplyNodeStyleToAll({
        ...localNodeSettings,
        color: localNodeColor,
      });
      setApplyingAll(true);
      setTimeout(() => setApplyingAll(false), 1000);
    }
  };

  const handleApplyEdgeStyleToDevice = () => {
    if (selectedEdge) {
      onApplyEdgeStyleToDevice(selectedEdge.id);
    }
  };

  const resetNodeColor = () => handleNodeColorChange('#2563eb');
  const resetEdgeColor = (key: keyof typeof localEdgeSettings, defaultColor: string) => handleEdgeSettingChange(key, defaultColor);

  const formatSizes: Record<string, { width: number; height: number }> = {
    a4: { width: 210, height: 297 },
    a3: { width: 297, height: 420 },
    a2: { width: 420, height: 594 },
  };

  const SectionHeader: React.FC<{
    icon: string;
    title: string;
    expanded: boolean;
    onToggle: () => void;
  }> = ({ icon, title, expanded, onToggle }) => {
    if (collapsed) {
      return (
        <Tooltip text={title}>
          <div
            className="section-header"
            onClick={onToggle}
            style={{ justifyContent: 'center', padding: '10px 0' }}
          >
            <i className={icon} style={{ fontSize: '1.2rem', color: 'var(--accent)' }} />
          </div>
        </Tooltip>
      );
    }
    return (
      <div className="section-header" onClick={onToggle}>
        <span>
          <i className={icon}></i> {title}
        </span>
        <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`}></i>
      </div>
    );
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${theme}`}>
      <div className="sidebar-header">
        {!collapsed && <h2></h2>} {/* Убрали "Sputnik Studio" */}
        <div className="header-actions">
          <button className="theme-switch" onClick={onToggleTheme}>
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button className="collapse-btn" onClick={onToggleCollapse}>{collapsed ? '→' : '←'}</button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '12px 16px' }}>
          <button onClick={onAddNode} style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <i className="fas fa-plus"></i> Добавить устройство
          </button>
        </div>
      )}

      {/* Управление */}
      <div className="sidebar-section">
        <SectionHeader
          icon="fas fa-folder-open"
          title="Управление"
          expanded={showManage}
          onToggle={() => setShowManage(!showManage)}
        />
        {showManage && !collapsed && (
          <div className="section-content">
            <select value={currentSchemaId || ''} onChange={(e) => onLoadSchema(e.target.value)}>
              <option value="">-- Выберите схему --</option>
              {schemas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="text" value={schemaName} onChange={(e) => onSchemaNameChange(e.target.value)} placeholder="Название схемы" />
            <div className="sidebar-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
              <button className="btn-sidebar-secondary" onClick={onSaveSchema}><i className="fas fa-save"></i> Сохранить</button>
              <button className="btn-sidebar-secondary" onClick={onNewSchema}><i className="fas fa-file"></i> Новая</button>
              <button className="btn-sidebar-secondary" onClick={onExportSVG}><i className="fas fa-camera"></i> SVG</button>
              <button className="btn-sidebar-secondary" onClick={onExportDXF}><i className="fas fa-cube"></i> DXF</button>
              <button className="btn-sidebar-secondary" onClick={onExportExcel}><i className="fas fa-file-excel"></i> Excel</button>
              <button className="btn-sidebar-secondary" onClick={onSaveToFile}><i className="fas fa-download"></i> JSON</button>
              <button className="btn-sidebar-secondary" onClick={onLoadFromFile}><i className="fas fa-upload"></i> Загрузить</button>
              <button className="btn-sidebar-secondary" onClick={onShowStatistics}><i className="fas fa-chart-pie"></i> Статистика</button>
              <button className="btn-sidebar-secondary" onClick={onClearCanvas} style={{ color: 'var(--danger)' }}><i className="fas fa-trash-alt"></i> Очистить</button>
            </div>
          </div>
        )}
      </div>

      {/* Сетка */}
      <div className="sidebar-section">
        <SectionHeader
          icon="fas fa-th"
          title="Сетка"
          expanded={showGrid}
          onToggle={() => setShowGrid(!showGrid)}
        />
        {showGrid && !collapsed && (
          <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Вид</label>
              <select value={gridSettings.variant} onChange={(e) => onUpdateGridVariant(e.target.value)} style={{ width: 100, padding: '4px 6px', fontSize: 12 }}>
                <option value="dots">Точки</option>
                <option value="lines">Линии</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Ячейка (px)</label>
              <input type="number" min="5" max="50" value={gridSettings.gap} onChange={(e) => onUpdateGridGap(Number(e.target.value))} style={{ width: 60, padding: '4px 6px', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Прилипание</label>
              <input type="checkbox" checked={gridSettings.snapToGrid} onChange={(e) => onUpdateSnapToGrid(e.target.checked)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Цвет</label>
              <NativeColorPicker value={gridSettings.color || '#cbd5e1'} onChange={onUpdateGridColor} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Прозрачность</label>
              <input type="range" min="0" max="1" step="0.05" value={gridSettings.opacity ?? 0.5} onChange={(e) => onUpdateGridOpacity(Number(e.target.value))} style={{ width: 80 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Показывать</label>
              <input type="checkbox" checked={gridSettings.visible ?? true} onChange={(e) => onUpdateGridVisible(e.target.checked)} />
            </div>
          </div>
        )}
      </div>

      {/* Печать */}
      <div className="sidebar-section">
        <SectionHeader
          icon="fas fa-print"
          title="Печать"
          expanded={showPrint}
          onToggle={() => setShowPrint(!showPrint)}
        />
        {showPrint && !collapsed && (
          <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Формат</label>
              <select value={printSettings.format} onChange={(e) => onUpdatePrintSettings({ format: e.target.value })} style={{ width: 100, padding: '4px 6px', fontSize: 12 }}>
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="a2">A2</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Ориентация</label>
              <select value={printSettings.orientation} onChange={(e) => onUpdatePrintSettings({ orientation: e.target.value })} style={{ width: 100, padding: '4px 6px', fontSize: 12 }}>
                <option value="portrait">Книжная</option>
                <option value="landscape">Альбомная</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Показать рамку</label>
              <input type="checkbox" checked={printSettings.visible} onChange={(e) => onUpdatePrintSettings({ visible: e.target.checked })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12 }}>Перетаскивать рамку</label>
              <input type="checkbox" checked={printSettings.draggable || false} onChange={(e) => onUpdatePrintSettings({ draggable: e.target.checked })} />
            </div>
          </div>
        )}
      </div>

      {/* Легенда */}
      <div className="sidebar-section">
        <SectionHeader
          icon="fas fa-palette"
          title="Легенда"
          expanded={showLegend}
          onToggle={() => setShowLegend(!showLegend)}
        />
        {showLegend && !collapsed && (
          <div className="section-content" style={{ fontSize: 11 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(CABLE_TYPE_COLORS).map(([type, color]) => (
                  <tr key={type} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '4px 0' }}>{type}</td>
                    <td style={{ width: 40, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 16, height: 16, background: color, borderRadius: 4 }} />
                        <span style={{ fontFamily: 'monospace' }}>{color}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Выравнивание */}
      {!collapsed && (
        <div className="sidebar-section">
          <SectionHeader
            icon="fas fa-arrows-alt"
            title="Выравнивание"
            expanded={showAlign}
            onToggle={() => setShowAlign(!showAlign)}
          />
          {showAlign && (
            <div className="section-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button className="btn-sidebar-secondary" onClick={() => onAlignNodes?.('left')}>← Влево</button>
                <button className="btn-sidebar-secondary" onClick={() => onAlignNodes?.('right')}>Вправо →</button>
                <button className="btn-sidebar-secondary" onClick={() => onAlignNodes?.('top')}>↑ Вверх</button>
                <button className="btn-sidebar-secondary" onClick={() => onAlignNodes?.('bottom')}>↓ Вниз</button>
                <button className="btn-sidebar-secondary" onClick={() => onAlignNodes?.('horizontal')} style={{ gridColumn: 'span 2' }}>Распределить по горизонтали</button>
                <button className="btn-sidebar-secondary" onClick={() => onAlignNodes?.('vertical')} style={{ gridColumn: 'span 2' }}>Распределить по вертикали</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вид */}
      <div className="sidebar-section">
        <SectionHeader
          icon="fas fa-eye"
          title="Вид"
          expanded={showView}
          onToggle={() => setShowView(!showView)}
        />
        {showView && !collapsed && (
          <div className="section-content">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <input type="checkbox" checked={handleHoverEnabled} onChange={(e) => onToggleHandleHover(e.target.checked)} />
              Подсветка области захвата портов
            </label>
          </div>
        )}
      </div>

      {/* Свойства устройства */}
      {selectedNode && !collapsed && (
        <div className="sidebar-section">
          <SectionHeader
            icon="fas fa-sliders-h"
            title="Свойства устройства"
            expanded={showNodeStyle}
            onToggle={() => setShowNodeStyle(!showNodeStyle)}
          />
          {showNodeStyle && (
            <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Цвет</label>
                <NativeColorPicker value={localNodeColor} onChange={handleNodeColorChange} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Обводка (px)</label>
                <input type="number" min="0" max="10" step="0.5" value={localNodeSettings.borderWidth} onChange={(e) => handleNodeSettingChange('borderWidth', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Скругление (px)</label>
                <input type="number" min="0" max="20" value={localNodeSettings.borderRadius} onChange={(e) => handleNodeSettingChange('borderRadius', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Заголовок (px)</label>
                <input type="number" min="8" max="20" value={localNodeSettings.headerFontSize} onChange={(e) => handleNodeSettingChange('headerFontSize', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Стиль шрифта</label>
                <select value={localNodeSettings.headerFontWeight} onChange={(e) => handleNodeSettingChange('headerFontWeight', e.target.value)} style={{ width: 90, padding: '4px 6px', fontSize: 12 }}>
                  <option value="normal">Обычный</option>
                  <option value="bold">Полужирный</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Порты (px)</label>
                <input type="number" min="4" max="12" value={localNodeSettings.portFontSize} onChange={(e) => handleNodeSettingChange('portFontSize', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Высота строки (px)</label>
                <input type="number" min="12" max="30" step="1" value={localNodeSettings.rowHeight} onChange={(e) => handleNodeSettingChange('rowHeight', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
              </div>
              <button className="btn-sidebar" onClick={handleApplyToAll}>
                <i className="fas fa-paint-brush"></i> {applyingAll ? '✓ Применено!' : 'Применить ко всем'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Свойства кабеля */}
      {selectedEdge && !selectedNode && !collapsed && (
        <div className="sidebar-section">
          <SectionHeader
            icon="fas fa-paint-brush"
            title="Свойства кабеля"
            expanded={showEdgeStyle}
            onToggle={() => setShowEdgeStyle(!showEdgeStyle)}
          />
          {showEdgeStyle && (
            <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Линия</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Толщина (px)</label>
                  <input type="number" min="1" max="5" step="0.5" value={localEdgeSettings.edgeStrokeWidth} onChange={(e) => handleEdgeSettingChange('edgeStrokeWidth', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Скругление</label>
                  <input type="number" min="0" max="20" value={localEdgeSettings.edgeBorderRadius} onChange={(e) => handleEdgeSettingChange('edgeBorderRadius', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Цвет линии</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <NativeColorPicker value={localEdgeSettings.edgeStrokeColor} onChange={(c) => handleEdgeSettingChange('edgeStrokeColor', c)} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <input type="checkbox" checked={localEdgeSettings.hideMainBadge} onChange={(e) => handleEdgeSettingChange('hideMainBadge', e.target.checked)} />
                      Скрыть тип
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <input type="checkbox" checked={localEdgeSettings.hideMarkers} onChange={(e) => handleEdgeSettingChange('hideMarkers', e.target.checked)} />
                      Скрыть марк.
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Метка начала</label>
                <input type="text" value={localEdgeSettings.sourceLabelText} onChange={(e) => handleEdgeSettingChange('sourceLabelText', e.target.value)} placeholder="Источник" style={{ width: 130, padding: '4px 8px', fontSize: 12, border: '1px solid var(--border-light)', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Метка конца</label>
                <input type="text" value={localEdgeSettings.targetLabelText} onChange={(e) => handleEdgeSettingChange('targetLabelText', e.target.value)} placeholder="Приёмник" style={{ width: 130, padding: '4px 8px', fontSize: 12, border: '1px solid var(--border-light)', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Текст бейджа</label>
                <input type="text" value={localEdgeSettings.labelText} onChange={(e) => handleEdgeSettingChange('labelText', e.target.value)} placeholder="Авто" style={{ width: 130, padding: '4px 8px', fontSize: 12, border: '1px solid var(--border-light)', borderRadius: 6 }} />
              </div>
              <div style={{ borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Параметры кабеля</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Длина (м)</label>
                <input type="number" min="0" step="0.1" value={localEdgeSettings.cableLength} onChange={(e) => handleEdgeSettingChange('cableLength', parseFloat(e.target.value) || 0)} style={{ width: 80, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Марка</label>
                <input type="text" value={localEdgeSettings.cableMark} onChange={(e) => handleEdgeSettingChange('cableMark', e.target.value)} style={{ width: 130, padding: '4px 8px', fontSize: 12, border: '1px solid var(--border-light)', borderRadius: 6 }} />
              </div>
              <div style={{ borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Основной бейдж</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Размер (px)</label>
                  <input type="number" min="4" max="20" value={localEdgeSettings.badgeFontSize} onChange={(e) => handleEdgeSettingChange('badgeFontSize', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Скругление</label>
                  <input type="number" min="0" max="30" value={localEdgeSettings.badgeBorderRadius} onChange={(e) => handleEdgeSettingChange('badgeBorderRadius', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Цвет</label>
                <NativeColorPicker value={localEdgeSettings.badgeTextColor} onChange={(c) => handleEdgeSettingChange('badgeTextColor', c)} />
              </div>
              <div style={{ borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Маркировки</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Размер</label>
                  <input type="number" min="4" max="20" value={localEdgeSettings.markerFontSize} onChange={(e) => handleEdgeSettingChange('markerFontSize', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Скругление</label>
                  <input type="number" min="0" max="30" value={localEdgeSettings.markerBorderRadius} onChange={(e) => handleEdgeSettingChange('markerBorderRadius', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Толщина</label>
                  <input type="number" min="0" max="5" value={localEdgeSettings.markerBorderWidth} onChange={(e) => handleEdgeSettingChange('markerBorderWidth', Number(e.target.value))} style={{ width: 48, padding: '4px 6px', fontSize: 12, textAlign: 'right' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Текст</label>
                <NativeColorPicker value={localEdgeSettings.markerTextColor} onChange={(c) => handleEdgeSettingChange('markerTextColor', c)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Обводка</label>
                <NativeColorPicker value={localEdgeSettings.markerBorderColor} onChange={(c) => handleEdgeSettingChange('markerBorderColor', c)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Фон</label>
                <NativeColorPicker value={localEdgeSettings.markerBackgroundColor} onChange={(c) => handleEdgeSettingChange('markerBackgroundColor', c)} />
              </div>
              <button className="btn-sidebar" onClick={handleApplyEdgeStyleToDevice}>
                <i className="fas fa-check"></i> Применить ко всем кабелям устройства
              </button>
            </div>
          )}
        </div>
      )}

      {!selectedNode && !selectedEdge && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header"><span><i className="fas fa-sliders-h"></i> Свойства</span></div>
          <div className="section-content"><p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 12 }}>Выберите устройство или кабель</p></div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
