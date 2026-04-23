// src/components/layout/CalculationsLayout.tsx
import React from 'react';
import { Sidebar } from './Sidebar';

interface CalculationsLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const CalculationsLayout: React.FC<CalculationsLayoutProps> = ({
  children,
}) => {
  return (
    <div className="calculations-layout">
      <Sidebar />
      <div className="calculations-content">
        {children}
      </div>
    </div>
  );
};
