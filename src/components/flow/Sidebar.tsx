import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../../types/flowTypes';

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
    handleLength: 8,
    handleThickness: 1,
    handleOffset: 27,
    headerFontSize: 10,
    portFontSize: 6,
    headerFontWeight: 'normal' as 'normal' | 'bold',
  });

  const [localEdgeSettings, setLocalEdgeSettings] = useState({
    labelText: '',
    sourceLabelText: '',
    targetLabelText: '',
    edgeStrokeWidth: 2,
    badgeFontSize: 10,
    badgeTextColor: '#2563eb',
    badgeBorderColor: '#2563eb',
    badgeBorderWidth: 1,
    badgeBorderRadius: 12,
    badgeBackgroundColor: '#ffffff',
  });

  const [showManage, setShowManage] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showNodeStyle, setShowNodeStyle] = useState(true);
  const [showEdgeStyle, setShowEdgeStyle] = useState(true);

  useEffect(() => {
    if (selectedNode) {
      setLocalNodeSettings({
        borderWidth: (selectedNode.data.borderWidth as number) ?? 1,
        borderRadius: (selectedNode.data.borderRadius as number) ?? 8,
        handleLength: (selectedNode.data.handleLength as number) ?? 8,
        handleThickness: (selectedNode.data.handleThickness as number) ?? 1,
        handleOffset: (selectedNode.data.handleOffset as number) ?? 27,
        headerFontSize: (selectedNode.data.headerFontSize as number) ?? 10,
        portFontSize: (selectedNode.data.portFontSize as number) ?? 6,
        headerFontWeight: (selectedNode.data.headerFontWeight as 'normal' | 'bold') ?? 'normal',
      });
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
        badgeFontSize: (d.badgeFontSize as number) ?? 10,
        badgeTextColor: (d.badgeTextColor as string) ?? '#2563eb',
        badgeBorderColor: (d.badgeBorderColor as string) ?? '#2563eb',
        badgeBorderWidth: (d.badgeBorderWidth as number) ?? 1,
        badgeBorderRadius: (d.badgeBorderRadius as number) ?? 12,
        badgeBackgroundColor: (d.badgeBackgroundColor as string) ?? 'var(--bg-panel)',
      });
    }
  }, [selectedEdge]);

  const handleNodeSettingChange = (key: keyof typeof localNodeSettings, value: any) => {
    if (!selectedNode) return;
    const newSettings = { ...localNodeSettings, [key]: value };
    setLocalNodeSettings(newSettings);
    onUpdateNode(selectedNode.id, newSettings);
  };

  const handleEdgeSettingChange = (key: keyof typeof localEdgeSettings, value: any) => {
    if (!selectedEdge) return;
    const newSettings = { ...localEdgeSettings, [key]: value };
    setLocalEdgeSettings(newSettings);
    onUpdateEdge(selectedEdge.id, newSettings);
  };

  const handleApplyToAll = () => {
    if (selectedNode) {
      onApplyNodeStyleToAll(localNodeSettings);
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${theme}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Sputnik Studio</h2>}
        <div className="header-actions">
          <button className="theme-switch" onClick={onToggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="collapse-btn" onClick={onToggleCollapse}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={onAddNode}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
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
              {schemas.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={schemaName}
              onChange={(e) => onSchemaNameChange(e.target.value)}
              placeholder="Название схемы"
            />
            <div className="sidebar-actions">
              <button onClick={onSaveSchema}><i className="fas fa-save"></i> Сохранить</button>
              <button onClick={onNewSchema}><i className="fas fa-file"></i> Новая</button>
              <button onClick={onExportSVG}><i className="fas fa-camera"></i> Экспорт</button>
              <button onClick={onSaveToFile}><i className="fas fa-download"></i> В файл</button>
              <button onClick={onLoadFromFile}><i className="fas fa-upload"></i> Из файла</button>
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
            <input
              type="number"
              min="5"
              max="50"
              value={gridSettings.gap}
              onChange={(e) => onUpdateGridGap(Number(e.target.value))}
            />
            <label>
              <input
                type="checkbox"
                checked={gridSettings.snapToGrid}
                onChange={(e) => onUpdateSnapToGrid(e.target.checked)}
              />
              Прилипание
            </label>
            <label>Цвет сетки</label>
            <input
              type="color"
              value={gridSettings.color || '#cbd5e1'}
              onChange={(e) => onUpdateGridColor(e.target.value)}
            />
            <label>Прозрачность</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={gridSettings.opacity ?? 0.5}
              onChange={(e) => onUpdateGridOpacity(Number(e.target.value))}
            />
            <label>
              <input
                type="checkbox"
                checked={gridSettings.visible ?? true}
                onChange={(e) => onUpdateGridVisible(e.target.checked)}
              />
              Показывать сетку
            </label>
          </div>
        )}
      </div>

      {selectedNode && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setShowNodeStyle(!showNodeStyle)}>
            <span><i className="fas fa-paint-brush"></i> Свойства ноды</span>
            <i className={`fas fa-chevron-${showNodeStyle ? 'down' : 'right'}`}></i>
          </div>
          {showNodeStyle && (
            <div className="section-content">
              <label>Обводка (px)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={localNodeSettings.borderWidth}
                onChange={(e) => handleNodeSettingChange('borderWidth', Number(e.target.value))}
              />
              <label>Скругление (px)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={localNodeSettings.borderRadius}
                onChange={(e) => handleNodeSettingChange('borderRadius', Number(e.target.value))}
              />
              <label>Длина хендла (px)</label>
              <input
                type="number"
                min="4"
                max="20"
                value={localNodeSettings.handleLength}
                onChange={(e) => handleNodeSettingChange('handleLength', Number(e.target.value))}
              />
              <label>Толщина хендла (px)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={localNodeSettings.handleThickness}
                onChange={(e) => handleNodeSettingChange('handleThickness', Number(e.target.value))}
              />
              <label>Выступ хендла (px)</label>
              <input
                type="number"
                min="0"
                max="40"
                value={localNodeSettings.handleOffset}
                onChange={(e) => handleNodeSettingChange('handleOffset', Number(e.target.value))}
              />
              <label>Размер заголовка (px)</label>
              <input
                type="number"
                min="8"
                max="20"
                value={localNodeSettings.headerFontSize}
                onChange={(e) => handleNodeSettingChange('headerFontSize', Number(e.target.value))}
              />
              <label>Жирность заголовка</label>
              <select
                value={localNodeSettings.headerFontWeight}
                onChange={(e) => handleNodeSettingChange('headerFontWeight', e.target.value)}
              >
                <option value="normal">Обычный</option>
                <option value="bold">Жирный</option>
              </select>
              <label>Размер портов (px)</label>
              <input
                type="number"
                min="4"
                max="12"
                value={localNodeSettings.portFontSize}
                onChange={(e) => handleNodeSettingChange('portFontSize', Number(e.target.value))}
              />
              <button
                onClick={handleApplyToAll}
                style={{
                  marginTop: '12px',
                  padding: '6px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Применить ко всем нодам
              </button>
            </div>
          )}
        </div>
      )}

      {selectedEdge && !selectedNode && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setShowEdgeStyle(!showEdgeStyle)}>
            <span><i className="fas fa-paint-brush"></i> Свойства ребра</span>
            <i className={`fas fa-chevron-${showEdgeStyle ? 'down' : 'right'}`}></i>
          </div>
          {showEdgeStyle && (
            <div className="section-content">
              <label>Толщина линии (px)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={localEdgeSettings.edgeStrokeWidth}
                onChange={(e) => handleEdgeSettingChange('edgeStrokeWidth', Number(e.target.value))}
              />
              <label>Метка у источника</label>
              <input
                type="text"
                value={localEdgeSettings.sourceLabelText}
                onChange={(e) => handleEdgeSettingChange('sourceLabelText', e.target.value)}
                placeholder="Начало"
              />
              <label>Метка у приёмника</label>
              <input
                type="text"
                value={localEdgeSettings.targetLabelText}
                onChange={(e) => handleEdgeSettingChange('targetLabelText', e.target.value)}
                placeholder="Конец"
              />
              <label>Общий текст бейджа</label>
              <input
                type="text"
                value={localEdgeSettings.labelText}
                onChange={(e) => handleEdgeSettingChange('labelText', e.target.value)}
                placeholder="Автоматически"
              />
              <label>Размер шрифта (px)</label>
              <input
                type="number"
                min="8"
                max="20"
                value={localEdgeSettings.badgeFontSize}
                onChange={(e) => handleEdgeSettingChange('badgeFontSize', Number(e.target.value))}
              />
              <label>Цвет текста</label>
              <input
                type="color"
                value={localEdgeSettings.badgeTextColor}
                onChange={(e) => handleEdgeSettingChange('badgeTextColor', e.target.value)}
              />
              <label>Цвет обводки</label>
              <input
                type="color"
                value={localEdgeSettings.badgeBorderColor}
                onChange={(e) => handleEdgeSettingChange('badgeBorderColor', e.target.value)}
              />
              <label>Толщина обводки (px)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={localEdgeSettings.badgeBorderWidth}
                onChange={(e) => handleEdgeSettingChange('badgeBorderWidth', Number(e.target.value))}
              />
              <label>Скругление (px)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={localEdgeSettings.badgeBorderRadius}
                onChange={(e) => handleEdgeSettingChange('badgeBorderRadius', Number(e.target.value))}
              />
              <label>Фон</label>
              <input
                type="color"
                value={localEdgeSettings.badgeBackgroundColor}
                onChange={(e) => handleEdgeSettingChange('badgeBackgroundColor', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {!selectedNode && !selectedEdge && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header">
            <span><i className="fas fa-sliders-h"></i> Свойства</span>
          </div>
          <div className="section-content">
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Выберите ноду или ребро для настройки</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
