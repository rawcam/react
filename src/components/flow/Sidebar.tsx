import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { DeviceNodeData } from '../../types/flowTypes';

interface SidebarProps {
  selectedNode: Node<DeviceNodeData> | null;
  onUpdateNode: (nodeId: string, updates: Partial<DeviceNodeData>) => void;
  schemas: any[];
  currentSchemaId: string | null;
  schemaName: string;
  onSchemaNameChange: (name: string) => void;
  onLoadSchema: (id: string) => void;
  onNewSchema: () => void;
  onSaveSchema: () => void;
  onExportSVG: () => void;
  gridSettings: any;
  onUpdateGridVariant: (variant: any) => void;
  onUpdateGridGap: (gap: number) => void;
  onUpdateSnapToGrid: (snap: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  onUpdateNode,
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
}) => {
  const [localSettings, setLocalSettings] = useState({
    borderWidth: 1,
    borderRadius: 8,
    handleLength: 8,
    handleThickness: 1,
    handleOffset: 27,
    headerFontSize: 10,
    portFontSize: 6,
    headerFontWeight: 'normal' as 'normal' | 'bold',
  });

  const [showGridSettings, setShowGridSettings] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setLocalSettings({
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

  const handleSettingChange = (key: keyof typeof localSettings, value: any) => {
    if (!selectedNode) return;
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdateNode(selectedNode.id, newSettings);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h4>Схема</h4>
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
          <button onClick={onSaveSchema}>💾 Сохранить</button>
          <button onClick={onNewSchema}>📄 Новая</button>
          <button onClick={onExportSVG}>📷 Экспорт SVG</button>
        </div>
      </div>

      <div className="sidebar-section">
        <h4 onClick={() => setShowGridSettings(!showGridSettings)} style={{ cursor: 'pointer' }}>
          Сетка {showGridSettings ? '▼' : '▶'}
        </h4>
        {showGridSettings && (
          <>
            <label>Вид сетки:</label>
            <select value={gridSettings.variant} onChange={(e) => onUpdateGridVariant(e.target.value)}>
              <option value="dots">Точки</option>
              <option value="lines">Линии</option>
            </select>
            <label>Размер ячейки (px):</label>
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
          </>
        )}
      </div>

      {selectedNode && (
        <div className="sidebar-section">
          <h4>Оформление ноды</h4>
          <label>Обводка (px)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={localSettings.borderWidth}
            onChange={(e) => handleSettingChange('borderWidth', Number(e.target.value))}
          />
          <label>Скругление (px)</label>
          <input
            type="number"
            min="0"
            max="20"
            value={localSettings.borderRadius}
            onChange={(e) => handleSettingChange('borderRadius', Number(e.target.value))}
          />
          <label>Длина хендла (px)</label>
          <input
            type="number"
            min="4"
            max="20"
            value={localSettings.handleLength}
            onChange={(e) => handleSettingChange('handleLength', Number(e.target.value))}
          />
          <label>Толщина хендла (px)</label>
          <input
            type="number"
            min="1"
            max="5"
            step="0.5"
            value={localSettings.handleThickness}
            onChange={(e) => handleSettingChange('handleThickness', Number(e.target.value))}
          />
          <label>Выступ хендла (px)</label>
          <input
            type="number"
            min="0"
            max="40"
            value={localSettings.handleOffset}
            onChange={(e) => handleSettingChange('handleOffset', Number(e.target.value))}
          />
          <label>Размер заголовка (px)</label>
          <input
            type="number"
            min="8"
            max="20"
            value={localSettings.headerFontSize}
            onChange={(e) => handleSettingChange('headerFontSize', Number(e.target.value))}
          />
          <label>Жирность заголовка</label>
          <select
            value={localSettings.headerFontWeight}
            onChange={(e) => handleSettingChange('headerFontWeight', e.target.value)}
          >
            <option value="normal">Обычный</option>
            <option value="bold">Жирный</option>
          </select>
          <label>Размер портов (px)</label>
          <input
            type="number"
            min="4"
            max="12"
            value={localSettings.portFontSize}
            onChange={(e) => handleSettingChange('portFontSize', Number(e.target.value))}
          />
        </div>
      )}

      {!selectedNode && (
        <div className="sidebar-section">
          <p>Выберите ноду для настройки</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
