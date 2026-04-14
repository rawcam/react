// src/components/flow/Sidebar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type { Node, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../../types/flowTypes';

const COLOR_PALETTE = [
  '#000000', '#ffffff',
  '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
];

interface SidebarProps {
  selectedNode: Node<DeviceNodeData> | null;
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
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

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
    edgeStrokeWidth: 2,
    edgeStrokeColor: '#2563eb',
    edgeBorderRadius: 8,
    badgeFontSize: 6,
    badgeTextColor: '#2563eb',
    badgeBorderColor: '#2563eb',
    badgeBorderWidth: 1,
    badgeBorderRadius: 12,
    badgeBackgroundColor: '#ffffff',
    markerFontSize: 5,
    markerTextColor: '#2563eb',
    markerBorderColor: '#2563eb',
    markerBorderWidth: 1,
    markerBorderRadius: 8,
    markerBackgroundColor: '#ffffff',
    hideMainBadge: false,
    hideMarkers: false,
  });

  const [applyingAll, setApplyingAll] = useState(false);
  const [showManage, setShowManage] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
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
        edgeStrokeWidth: (d.edgeStrokeWidth as number) ?? 2,
        edgeStrokeColor: (d.edgeStrokeColor as string) ?? '#2563eb',
        edgeBorderRadius: (d.edgeBorderRadius as number) ?? 8,
        badgeFontSize: (d.badgeFontSize as number) ?? 6,
        badgeTextColor: (d.badgeTextColor as string) ?? '#2563eb',
        badgeBorderColor: (d.badgeBorderColor as string) ?? '#2563eb',
        badgeBorderWidth: (d.badgeBorderWidth as number) ?? 1,
        badgeBorderRadius: (d.badgeBorderRadius as number) ?? 12,
        badgeBackgroundColor: (d.badgeBackgroundColor as string) ?? '#ffffff',
        markerFontSize: (d.markerFontSize as number) ?? 5,
        markerTextColor: (d.markerTextColor as string) ?? '#2563eb',
        markerBorderColor: (d.markerBorderColor as string) ?? '#2563eb',
        markerBorderWidth: (d.markerBorderWidth as number) ?? 1,
        markerBorderRadius: (d.markerBorderRadius as number) ?? 8,
        markerBackgroundColor: (d.markerBackgroundColor as string) ?? '#ffffff',
        hideMainBadge: (d.hideMainBadge as boolean) ?? false,
        hideMarkers: (d.hideMarkers as boolean) ?? false,
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

  // Исправленный компонент выбора цвета
  const ColorPickerCompact = ({ value, onChange, onReset, defaultColor }: { value: string; onChange: (c: string) => void; onReset: () => void; defaultColor: string }) => {
    const [expanded, setExpanded] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const sidebar = buttonRef.current?.closest('.sidebar') as HTMLElement;
      if (sidebar) sidebarRef.current = sidebar;
    }, []);

    const updatePosition = useCallback(() => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerWidth = 240;
      const pickerHeight = 320; // примерно

      let top = rect.bottom + 4;
      let left = rect.left;

      if (top + pickerHeight > window.innerHeight) {
        top = rect.top - pickerHeight - 4;
      }
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 10;
      }
      if (left < 10) left = 10;

      setCoords({ top, left });
    }, []);

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      updatePosition();
      setExpanded(prev => !prev);
    };

    useEffect(() => {
      if (!expanded) return;
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (buttonRef.current?.contains(target)) return;
        if (pickerRef.current?.contains(target)) return;
        setExpanded(false);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }, [expanded]);

    useEffect(() => {
      if (!expanded || !sidebarRef.current) return;
      const handleScroll = () => updatePosition();
      const sidebar = sidebarRef.current;
      sidebar.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', updatePosition);
      return () => {
        sidebar.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', updatePosition);
      };
    }, [expanded, updatePosition]);

    const pickerContent = expanded && ReactDOM.createPortal(
      <div
        ref={pickerRef}
        style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 10001,
          width: '240px',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', height: '40px', marginBottom: '8px' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {COLOR_PALETTE.map(c => (
            <div
              key={c}
              style={{
                width: '24px', height: '24px', background: c, borderRadius: '6px', cursor: 'pointer',
                border: value === c ? '2px solid var(--text-primary)' : '1px solid var(--border-light)'
              }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
        <button onClick={onReset} style={{ marginTop: '8px', width: '100%', padding: '4px', cursor: 'pointer' }}>Сбросить</button>
      </div>,
      document.body
    );

    return (
      <div
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          width: '20px',
          height: '20px',
          background: value,
          borderRadius: '5px',
          border: '1px solid var(--border-light)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
    );
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${theme}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Sputnik Studio</h2>}
        <div className="header-actions">
          <button className="theme-switch" onClick={onToggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
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

      <div className="sidebar-section">
        <div className="section-header" onClick={() => setShowManage(!showManage)}>
          <span><i className="fas fa-folder-open"></i> {!collapsed && 'Управление'}</span>
          {!collapsed && <i className={`fas fa-chevron-${showManage ? 'down' : 'right'}`}></i>}
        </div>
        {showManage && !collapsed && (
          <div className="section-content">
            <select value={currentSchemaId || ''} onChange={(e) => onLoadSchema(e.target.value)}>
              <option value="">-- Выберите схему --</option>
              {schemas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="text" value={schemaName} onChange={(e) => onSchemaNameChange(e.target.value)} placeholder="Название схемы" />
            <div className="sidebar-actions">
              <button onClick={onSaveSchema}><i className="fas fa-save"></i> Сохранить</button>
              <button onClick={onNewSchema}><i className="fas fa-file"></i> Новая</button>
              <button onClick={onExportSVG}><i className="fas fa-camera"></i> Экспорт</button>
              <button onClick={onSaveToFile}><i className="fas fa-download"></i> В файл</button>
              <button onClick={onLoadFromFile}><i className="fas fa-upload"></i> Из файла</button>
              <button onClick={onExportDXF}><i className="fas fa-cube"></i> В DXF</button>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="section-header" onClick={() => setShowGrid(!showGrid)}>
          <span><i className="fas fa-th"></i> {!collapsed && 'Сетка'}</span>
          {!collapsed && <i className={`fas fa-chevron-${showGrid ? 'down' : 'right'}`}></i>}
        </div>
        {showGrid && !collapsed && (
          <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              <input type="color" value={gridSettings.color || '#cbd5e1'} onChange={(e) => onUpdateGridColor(e.target.value)} style={{ width: 60, height: 28 }} />
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

      {selectedNode && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setShowNodeStyle(!showNodeStyle)}>
            <span><i className="fas fa-sliders-h"></i> Свойства устройства</span>
            <i className={`fas fa-chevron-${showNodeStyle ? 'down' : 'right'}`}></i>
          </div>
          {showNodeStyle && (
            <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Цвет</label>
                <ColorPickerCompact value={localNodeColor} onChange={handleNodeColorChange} onReset={resetNodeColor} defaultColor="#2563eb" />
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
              <button onClick={handleApplyToAll} style={{ marginTop: 8, padding: '6px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer', width: '100%', fontWeight: 500, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <i className="fas fa-paint-brush"></i> {applyingAll ? '✓ Применено!' : 'Применить ко всем'}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedEdge && !selectedNode && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setShowEdgeStyle(!showEdgeStyle)}>
            <span><i className="fas fa-paint-brush"></i> Свойства кабеля</span>
            <i className={`fas fa-chevron-${showEdgeStyle ? 'down' : 'right'}`}></i>
          </div>
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
                  <ColorPickerCompact value={localEdgeSettings.edgeStrokeColor} onChange={(c) => handleEdgeSettingChange('edgeStrokeColor', c)} onReset={() => resetEdgeColor('edgeStrokeColor', '#2563eb')} defaultColor="#2563eb" />
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
                <ColorPickerCompact value={localEdgeSettings.badgeTextColor} onChange={(c) => handleEdgeSettingChange('badgeTextColor', c)} onReset={() => resetEdgeColor('badgeTextColor', '#2563eb')} defaultColor="#2563eb" />
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
                <ColorPickerCompact value={localEdgeSettings.markerTextColor} onChange={(c) => handleEdgeSettingChange('markerTextColor', c)} onReset={() => resetEdgeColor('markerTextColor', '#2563eb')} defaultColor="#2563eb" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Обводка</label>
                <ColorPickerCompact value={localEdgeSettings.markerBorderColor} onChange={(c) => handleEdgeSettingChange('markerBorderColor', c)} onReset={() => resetEdgeColor('markerBorderColor', '#2563eb')} defaultColor="#2563eb" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12 }}>Фон</label>
                <ColorPickerCompact value={localEdgeSettings.markerBackgroundColor} onChange={(c) => handleEdgeSettingChange('markerBackgroundColor', c)} onReset={() => resetEdgeColor('markerBackgroundColor', '#ffffff')} defaultColor="#ffffff" />
              </div>

              <button onClick={handleApplyEdgeStyleToDevice} style={{ marginTop: 8, padding: '8px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer', width: '100%', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
