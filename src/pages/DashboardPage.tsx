// src/pages/DashboardPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyFinanceWidget } from '../components/dashboard/CompanyFinanceWidget';
import { ProjectsFinanceWidget } from '../components/dashboard/ProjectsFinanceWidget';
import { ServiceWidget } from '../components/dashboard/ServiceWidget';
import { WorkloadWidget } from '../components/dashboard/WorkloadWidget';
import { RisksWidget } from '../components/dashboard/RisksWidget';
import { CarouselWidget } from '../components/dashboard/CarouselWidget';
import { useAppSelector } from '../hooks/hooks';
import { WidgetConfigDrawer } from '../components/ui/WidgetConfigDrawer';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const visibleWidgets = useAppSelector(state => state.widgets.visibleWidgets);
  const displayMode = useAppSelector(state => state.widgets.displayMode);

  const widgetMap: Record<string, React.ReactNode> = {
    companyFinance: <CompanyFinanceWidget key="companyFinance" />,
    projectsFinance: <ProjectsFinanceWidget key="projectsFinance" />,
    service: <ServiceWidget key="service" />,
    workload: <WorkloadWidget key="workload" />,
    risks: <RisksWidget key="risks" />,
    carousel: <CarouselWidget key="carousel" />,
  };

  return (
    <div className="dashboard-page" style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>Дашборд</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/projects')}
            style={{ padding: '10px 20px', borderRadius: '40px' }}
          >
            <i className="fas fa-folder-open"></i> Все проекты
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/flow-editor')}
            style={{ padding: '10px 20px', borderRadius: '40px' }}
          >
            <i className="fas fa-project-diagram"></i> Редактор схем
          </button>
        </div>
      </div>

      <div className={`dashboard-grid ${displayMode}`} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
      }}>
        {visibleWidgets.map(id => widgetMap[id])}
      </div>

      <WidgetConfigDrawer />
    </div>
  );
};
