// src/components/layout/CalculationsLayout.tsx
import React from 'react';
import { AccordionWrapper } from '../ui/AccordionWrapper';
import { sidebarModules } from '../../config/sidebarModules';

interface CalculationsLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const CalculationsLayout: React.FC<CalculationsLayoutProps> = ({
  children,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  return (
    <div className="calculations-layout">
      <div className={`calculations-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h3>Расчёты</h3>
          {onToggleSidebar && (
            <button className="collapse-btn" onClick={onToggleSidebar}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          )}
        </div>
        <div className="sidebar-modules">
          {sidebarModules.map(module => (
            <AccordionWrapper key={module.id} module={module} />
          ))}
        </div>
      </div>
      <div className="calculations-content">
        {children}
      </div>
    </div>
  );
};
