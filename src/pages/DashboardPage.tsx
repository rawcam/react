// src/pages/DashboardPage.tsx
import React from 'react';
import { useAppSelector } from '../hooks/hooks';
import { CompanyFinanceWidget } from '../components/dashboard/CompanyFinanceWidget';
import { ProjectsFinanceWidget } from '../components/dashboard/ProjectsFinanceWidget';
import { ServiceWidget } from '../components/dashboard/ServiceWidget';
import { WorkloadWidget } from '../components/dashboard/WorkloadWidget';
import { RisksWidget } from '../components/dashboard/RisksWidget';
import { ProjectsCarousel } from '../components/dashboard/ProjectsCarousel';
import { WidgetConfigDrawer } from '../components/ui/WidgetConfigDrawer';

export const DashboardPage: React.FC = () => {
  const visibleWidgets = useAppSelector(state => state.widgets.visibleWidgets);
  const displayMode = useAppSelector(state => state.widgets.displayMode);
  const projects = useAppSelector(state => state.projects.list);
  const activeProjects = projects.filter(p => p.status !== 'done');

  const widgetMap: Record<string, React.ReactNode> = {
    companyFinance: <CompanyFinanceWidget key="companyFinance" />,
    projectsFinance: <ProjectsFinanceWidget key="projectsFinance" />,
    service: <ServiceWidget key="service" />,
    workload: <WorkloadWidget key="workload" />,
    risks: <RisksWidget key="risks" />,
  };

  const showCarousel = visibleWidgets.includes('carousel');
  const topWidgets = visibleWidgets.filter(id => id !== 'carousel');

  return (
    <div className="dashboard-page">
      <div className={`dashboard-grid ${displayMode}`}>
        {topWidgets.map(id => widgetMap[id])}
      </div>
      {showCarousel && <ProjectsCarousel projects={activeProjects} />}
      <WidgetConfigDrawer />
    </div>
  );
};
