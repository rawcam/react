// src/pages/CalculationsPage.tsx
import React from 'react';
import { CalculationsLayout } from '../components/layout/CalculationsLayout';

export const CalculationsPage: React.FC = () => {
  return (
    <CalculationsLayout sidebarCollapsed={false} onToggleSidebar={() => {}}>
      <div className="empty-calculations">
        <i className="fas fa-calculator"></i>
        <h3>Раздел находится в разработке</h3>
        <p>Мы обновляем инструменты для инженерных расчётов.</p>
        <small>Скоро здесь появится новый функционал.</small>
      </div>
    </CalculationsLayout>
  );
};
