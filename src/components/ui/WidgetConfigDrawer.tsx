// src/components/ui/WidgetConfigDrawer.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { closeWidgetConfig, setActiveModal } from '../../store/uiSlice';
import { toggleWidget, setDisplayMode, resetToRolePreset, WidgetId, DisplayMode } from '../../store/widgetsSlice';
import { useAuth } from '../../hooks/useAuth';

export const WidgetConfigDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const { user, role } = useAuth();
  const isOpen = useSelector((state: RootState) => state.ui.widgetConfigOpen);
  const visibleWidgets = useSelector((state: RootState) => state.widgets.visibleWidgets);
  const displayMode = useSelector((state: RootState) => state.widgets.displayMode);

  const widgetLabels: Record<WidgetId, string> = {
    companyFinance: 'Финансы компании',
    projectsFinance: 'Финансы проектов',
    service: 'Сервис и регламент',
    workload: 'Загрузка инженеров',
    risks: 'Риски (задержки)',
    carousel: 'Карусель проектов',
  };

  const handleClose = () => dispatch(closeWidgetConfig());
  const handleToggle = (id: WidgetId) => dispatch(toggleWidget(id));
  const handleModeChange = (mode: DisplayMode) => dispatch(setDisplayMode(mode));
  const handleReset = () => role && dispatch(resetToRolePreset(role as any));

  if (!isOpen) return null;

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'visible' : ''}`} onClick={handleClose} />
      <div className="widget-drawer">
        <div className="drawer-header">
          <h3><i className="fas fa-sliders-h"></i> Настройка виджетов</h3>
          <button className="drawer-close" onClick={handleClose}>×</button>
        </div>

        <div className="drawer-section">
          <h4>Режим отображения</h4>
          <div className="mode-buttons">
            <button className={`mode-btn ${displayMode === 'normal' ? 'active' : ''}`} onClick={() => handleModeChange('normal')}>
              Обычный
            </button>
            <button className={`mode-btn ${displayMode === 'compact' ? 'active' : ''}`} onClick={() => handleModeChange('compact')}>
              Компактный
            </button>
          </div>
        </div>

        <div className="drawer-section">
          <h4>Видимые виджеты</h4>
          {Object.entries(widgetLabels).map(([id, label]) => (
            <div key={id} className="drawer-toggle-item">
              <span><i className="fas fa-th"></i> {label}</span>
              <label className="switch">
                <input type="checkbox" checked={visibleWidgets.includes(id as WidgetId)} onChange={() => handleToggle(id as WidgetId)} />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        <div className="drawer-section">
          <h4>Предустановки</h4>
          <div className="preset-buttons">
            <button className="preset-btn" onClick={handleReset}>По роли ({role})</button>
            <button className="preset-btn" onClick={() => dispatch(setVisibleWidgets(['companyFinance', 'projectsFinance', 'service', 'workload', 'risks', 'carousel']))}>Все</button>
            <button className="preset-btn" onClick={() => dispatch(setVisibleWidgets(['carousel']))}>Минимум</button>
          </div>
        </div>
      </div>
    </>
  );
};
