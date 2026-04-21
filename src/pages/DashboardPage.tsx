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

  // Все виджеты (без фильтрации по роли — каждый виджет сам решит, показываться ли)
  const allWidgets = [
    { id: 'companyFinance', component: <CompanyFinanceWidget key="companyFinance" /> },
    { id: 'projectsFinance', component: <ProjectsFinanceWidget key="projectsFinance" /> },
    { id: 'service', component: <ServiceWidget key="service" /> },
    { id: 'workload', component: <WorkloadWidget key="workload" /> },
    { id: 'risks', component: <RisksWidget key="risks" /> },
  ];

  const topWidgets = allWidgets
    .filter(w => visibleWidgets.includes(w.id as any))
    .map(w => w.component);

  const showCarousel = visibleWidgets.includes('carousel' as any);

  return (
    <div className="dashboard-page">
      <div className={`dashboard-grid ${displayMode}`}>
        {topWidgets}
      </div>
      {showCarousel && <ProjectsCarousel projects={activeProjects} />}
      <WidgetConfigDrawer />
    </div>
  );
};
