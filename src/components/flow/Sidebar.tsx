import React, { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { DeviceNodeData, CableEdgeData } from '../../types/flowTypes';

interface SidebarProps {
  selectedNode: Node<DeviceNodeData> | null;
  selectedEdge: Edge<CableEdgeData> | null;
  onUpdateNode: (nodeId: string, updates: Partial<DeviceNodeData>) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<CableEdgeData>) => void;
  schemas: any[];
  currentSchemaId: string | null;
  schemaName: string;
  onSchemaNameChange: (name: string) => void;
  onLoadSchema: (id: string) => void;
  onNewSchema: () => void;
  onSaveSchema: () => void;
  onExportSVG: () => void;
  gridSettings: any;
  onUpdateGridVariant: (variant: string) => void;
  onUpdateGridGap: (gap: number) => void;
  onUpdateSnapToGrid: (snap: boolean) => void;
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
  schemas,
  currentSchemaId,
  schemaName,
  onSchemaNameChange,
  onLoadSchema,
  onNewSchema,
  onSaveSchema,
  onExportSVG,
  gridSettings,
  onUpdateGridVariant,
  onUpdateGridGap,
  onUpdateSnapToGrid,
  theme,
  onToggleTheme,
  collapsed,
  onToggleCollapse,
}) => {
  // Настройки ноды
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

  // Настройки ребра
  const [localEdgeSettings, setLocalEdgeSettings] = useState({
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

  // Синхронизация с выбранной нодой
  useEffect(() => {
    if (selectedNode) {
      setLocalNodeSettings({
        borderWidth: selectedNode.data.borderWidth ?? 1,
        borderRadius: selectedNode.data.borderRadius ?? 8,
        handleLength: selectedNode.data.handleLength ?? 8,
        handleThickness: selectedNode.data.handleThickness ?? 1,
        handleOffset: selectedNode.data.handleOffset ?? 27,
        headerFontSize: selectedNode.data.headerFontSize ?? 10,
        portFontSize: selectedNode.data.portFontSize ?? 6,
        headerFontWeight: selectedNode.data.headerFontWeight ?? 'normal',
      });
    }
  }, [selectedNode]);

  // Синхронизация с выбранным ребром
  useEffect(() => {
    if (selectedEdge && selectedEdge.data) {
      setLocalEdgeSettings({
        badgeFontSize: selectedEdge.data.badgeFontSize ?? 10,
        badgeTextColor: selectedEdge.data.badgeTextColor ?? '#2563eb',
        badgeBorderColor: selectedEdge.data.badgeBorderColor ?? '#2563eb',
        badgeBorderWidth: selectedEdge.data.badgeBorderWidth ?? 1,
        badgeBorderRadius: selectedEdge.data.badgeBorderRadius ?? 12,
        badgeBackgroundColor: selectedEdge.data.badgeBackgroundColor ?? 'var(--bg-panel)',
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

      {/* Управление схемой */}
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
            </div>
          </div>
        )}
      </div>

      {/* Сетка */}
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
          </div>
        )}
      </div>

      {/* Оформление ноды */}
      {selectedNode && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setShowNodeStyle(!showNodeStyle)}>
            <span><i className="fas fa-paint-brush"></i> Оформление ноды</span>
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
            </div>
          )}
        </div>
      )}

      {/* Оформление ребра */}
      {selectedEdge && !selectedNode && !collapsed && (
        <div className="sidebar-section">
          <div className="section-header" onClick={() => setShowEdgeStyle(!showEdgeStyle)}>
            <span><i className="fas fa-paint-brush"></i> Оформление ребра</span>
            <i className={`fas fa-chevron-${showEdgeStyle ? 'down' : 'right'}`}></i>
          </div>
          {showEdgeStyle && (
            <div className="section-content">
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
          <div className="section-content">
            <p>Выберите ноду или ребро для настройки</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
