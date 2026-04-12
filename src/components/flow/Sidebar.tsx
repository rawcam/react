// src/components/flow/Sidebar.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Node, Edge } from '@xyflow/react';
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
  });

  const [localNodeColor, setLocalNodeColor] = useState('#2563eb');

  const [localEdgeSettings, setLocalEdgeSettings] = useState({
    labelText: '',
    sourceLabelText: '',
    targetLabelText: '',
    edgeStrokeWidth: 2,
    edgeStrokeColor: '#2563eb',
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

  const resetNodeColor = () => handleNodeColorChange('#2563eb');
  const resetEdgeColor = (key: keyof typeof localEdgeSettings, defaultColor: string) => handleEdgeSettingChange(key, defaultColor);

  const ColorPickerCompact = ({ value, onChange, onReset, defaultColor }: { value: string; onChange: (c: string) => void; onReset: () => void; defaultColor: string }) => {
    const [expanded, setExpanded] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar instanceof HTMLElement) sidebarRef.current = sidebar;
    }, []);

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.left });
      }
    };

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      updatePosition();
      setExpanded(prev => !prev);
    };

    useEffect(() => {
      if (!expanded) return;
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (buttonRef.current?.contains(target)) return;
        if (pickerRef.current?.contains(target)) return;
        setExpanded(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expanded]);

    useEffect(() => {
      if (!expanded || !sidebarRef.current) return;
      const handleScroll = () => updatePosition();
      const sidebar = sidebarRef.current;
      sidebar.addEventListener('scroll', handleScroll);
      return () => sidebar.removeEventListener('scroll', handleScroll);
    }, [expanded]);

    const pickerContent = expanded && (
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
          zIndex: 9999,
          width: '240px',
        }}
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
      </div>
    );

    return (
      <>
        <div ref={buttonRef} onClick={handleToggle} style={{
          width: '32px', height: '32px', background: value, borderRadius: '8px',
          border: '1px solid var(--border-light)', cursor: 'pointer', flexShrink: 0
        }} />
        {pickerContent}
      </>
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
          <div className="section-content">
            <label>Вид сетки</label>
            <select value={gridSettings.variant} onChange={(e) => onUpdateGridVariant(e.target.value)}>
              <option value="dots">Точки</option>
              <option value="lines">Линии</option>
            </select>
            <label>Размер ячейки (px)</label>
            <input type="number" min="5" max="50" value={gridSettings.gap} onChange={(e) => onUpdateGridGap(Number(e.target.value))} />
            <label><input type="checkbox" checked={gridSettings.snapToGrid} onChange={(e) => onUpdateSnapToGrid(e.target.checked)} /> Прилипание</label>
            <label>Цвет сетки</label>
            <input type="color" value={gridSettings.color || '#cbd5e1'} onChange={(e) => onUpdateGridColor(e.target.value)} />
            <label>Прозрачность</label>
            <input type="range" min="0" max="1" step="0.05" value={gridSettings.opacity ?? 0.5} onChange={(e) => onUpdateGridOpacity(Number(e.target.value))} />
            <label><input type="checkbox" checked={gridSettings.visible ?? true} onChange={(e) => onUpdateGridVisible(e.target.checked)} /> Показывать сетку</label>
          </div>
        )}
      </div>

      {selectedNode && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setShowNodeStyle(!showNodeStyle)}>
            <span><i className="fas fa-paint-brush"></i> Свойства устройства</span>
            <i className={`fas fa-chevron-${showNodeStyle ? 'down' : 'right'}`}></i>
          </div>
          {showNodeStyle && (
            <div className="section-content">
              <label>Обводка (px)</label>
              <input type="number" min="0" max="10" step="0.5" value={localNodeSettings.borderWidth} onChange={(e) => handleNodeSettingChange('borderWidth', Number(e.target.value))} />
              <label>Скругление (px)</label>
              <input type="number" min="0" max="20" value={localNodeSettings.borderRadius} onChange={(e) => handleNodeSettingChange('borderRadius', Number(e.target.value))} />
              <label>Размер заголовка (px)</label>
              <input type="number" min="8" max="20" value={localNodeSettings.headerFontSize} onChange={(e) => handleNodeSettingChange('headerFontSize', Number(e.target.value))} />
              <label>Жирность заголовка</label>
              <select value={localNodeSettings.headerFontWeight} onChange={(e) => handleNodeSettingChange('headerFontWeight', e.target.value)}>
                <option value="normal">Обычный</option>
                <option value="bold">Жирный</option>
              </select>
              <label>Размер портов (px)</label>
              <input type="number" min="4" max="12" value={localNodeSettings.portFontSize} onChange={(e) => handleNodeSettingChange('portFontSize', Number(e.target.value))} />
              <label>Цвет обводки</label>
              <ColorPickerCompact value={localNodeColor} onChange={handleNodeColorChange} onReset={resetNodeColor} defaultColor="#2563eb" />
              <button onClick={handleApplyToAll} style={{ marginTop: '12px', padding: '6px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                {applyingAll ? '✓ Применено!' : 'Применить ко всем нодам'}
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
            <div className="section-content">
              <label>Толщина линии (px)</label>
              <input type="number" min="1" max="5" step="0.5" value={localEdgeSettings.edgeStrokeWidth} onChange={(e) => handleEdgeSettingChange('edgeStrokeWidth', Number(e.target.value))} />
              <label>Цвет линии</label>
              <ColorPickerCompact value={localEdgeSettings.edgeStrokeColor} onChange={(c) => handleEdgeSettingChange('edgeStrokeColor', c)} onReset={() => resetEdgeColor('edgeStrokeColor', '#2563eb')} defaultColor="#2563eb" />
              <label>Метка у источника</label>
              <input type="text" value={localEdgeSettings.sourceLabelText} onChange={(e) => handleEdgeSettingChange('sourceLabelText', e.target.value)} placeholder="Начало" />
              <label>Метка у приёмника</label>
              <input type="text" value={localEdgeSettings.targetLabelText} onChange={(e) => handleEdgeSettingChange('targetLabelText', e.target.value)} placeholder="Конец" />
              <label>Общий текст бейджа</label>
              <input type="text" value={localEdgeSettings.labelText} onChange={(e) => handleEdgeSettingChange('labelText', e.target.value)} placeholder="Автоматически" />
              <h4 style={{ fontSize: '12px', margin: '16px 0 8px', color: 'var(--text-secondary)' }}>Основной бейдж</h4>
              <label>Размер шрифта (px)</label>
              <input type="number" min="4" max="20" value={localEdgeSettings.badgeFontSize} onChange={(e) => handleEdgeSettingChange('badgeFontSize', Number(e.target.value))} />
              <label>Цвет текста / заливки</label>
              <ColorPickerCompact value={localEdgeSettings.badgeTextColor} onChange={(c) => handleEdgeSettingChange('badgeTextColor', c)} onReset={() => resetEdgeColor('badgeTextColor', '#2563eb')} defaultColor="#2563eb" />
              <label>Скругление (px)</label>
              <input type="number" min="0" max="30" value={localEdgeSettings.badgeBorderRadius} onChange={(e) => handleEdgeSettingChange('badgeBorderRadius', Number(e.target.value))} />
              <h4 style={{ fontSize: '12px', margin: '16px 0 8px', color: 'var(--text-secondary)' }}>Маркировки</h4>
              <label>Размер шрифта (px)</label>
              <input type="number" min="4" max="20" value={localEdgeSettings.markerFontSize} onChange={(e) => handleEdgeSettingChange('markerFontSize', Number(e.target.value))} />
              <label>Цвет текста</label>
              <ColorPickerCompact value={localEdgeSettings.markerTextColor} onChange={(c) => handleEdgeSettingChange('markerTextColor', c)} onReset={() => resetEdgeColor('markerTextColor', '#2563eb')} defaultColor="#2563eb" />
              <label>Цвет обводки</label>
              <ColorPickerCompact value={localEdgeSettings.markerBorderColor} onChange={(c) => handleEdgeSettingChange('markerBorderColor', c)} onReset={() => resetEdgeColor('markerBorderColor', '#2563eb')} defaultColor="#2563eb" />
              <label>Толщина обводки (px)</label>
              <input type="number" min="0" max="5" value={localEdgeSettings.markerBorderWidth} onChange={(e) => handleEdgeSettingChange('markerBorderWidth', Number(e.target.value))} />
              <label>Скругление (px)</label>
              <input type="number" min="0" max="30" value={localEdgeSettings.markerBorderRadius} onChange={(e) => handleEdgeSettingChange('markerBorderRadius', Number(e.target.value))} />
              <label>Фон</label>
              <ColorPickerCompact value={localEdgeSettings.markerBackgroundColor} onChange={(c) => handleEdgeSettingChange('markerBackgroundColor', c)} onReset={() => resetEdgeColor('markerBackgroundColor', '#ffffff')} defaultColor="#ffffff" />
            </div>
          )}
        </div>
      )}

      {!selectedNode && !selectedEdge && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header"><span><i className="fas fa-sliders-h"></i> Свойства</span></div>
          <div className="section-content"><p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Выберите устройство или кабель</p></div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
