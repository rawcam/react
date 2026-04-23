// src/components/layout/AccordionWrapper.tsx
import React, { useState, useEffect } from 'react';
import { SidebarModule } from '../../config/sidebarModules';

interface AccordionWrapperProps {
  module: SidebarModule;
}

export const AccordionWrapper: React.FC<AccordionWrapperProps> = ({ module }) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(`accordion_${module.id}`);
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(`accordion_${module.id}`, String(collapsed));
  }, [collapsed, module.id]);

  const toggle = () => setCollapsed(prev => !prev);

  const Component = module.component as React.ComponentType<any>; // чтобы можно было передавать пропсы

  return (
    <div className="sidebar-section">
      <div className="section-header" onClick={toggle}>
        <i className={module.icon}></i>
        <span>{module.title}</span>
        <i className={`fas fa-angle-down ${collapsed ? 'collapsed' : ''}`}></i>
      </div>
      {!collapsed && (
        <div className="section-content">
          <Component />
        </div>
      )}
    </div>
  );
};
