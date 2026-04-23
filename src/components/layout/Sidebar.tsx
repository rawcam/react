// src/components/layout/Sidebar.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../store';
import { toggleSidebar } from '../../store/uiSlice';
import { sidebarModules } from '../../config/sidebarModules';
import { AccordionWrapper } from './AccordionWrapper';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const collapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
  const location = useLocation();
  const dispatch = useDispatch();
  const isCalculations = location.pathname.includes('/calculations');

  if (!isCalculations) return null;

  const handleCollapse = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="collapse-btn" onClick={handleCollapse}>
          <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
        </div>
      </div>
      <div id="sidebarSectionsContainer">
        {sidebarModules.map(module => (
          <AccordionWrapper key={module.id} module={module} />
        ))}
      </div>
      <div className="sidebar-footer">Sputnik Studio v8.0<br />React Edition</div>
    </div>
  );
};
