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
import { useAuth } from '../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const visibleWidgets = useAppSelector(state => state.widgets.visibleWidgets);
  const displayMode = useAppSelector(state => state.widgets.displayMode);
  const projects = useAppSelector(state => state.projects.list);
  const activeProjects = projects.filter(p => p.status !== 'done');
  const { hasRole } = useAuth();

  // Все возможные виджеты с их идентификаторами и условиями отображения
  const allWidgets = [
    { id: 'companyFinance', component: <CompanyFinanceWidget key="companyFinance" />, roles: ['director', 'pm'] },
    { id: 'projectsFinance', component: <ProjectsFinanceWidget key="projectsFinance" />, roles: ['director', 'pm', 'engineer'] },
    { id: 'service', component: <ServiceWidget key="service" />, roles: ['pm', 'engineer'] },
    { id: 'workload', component: <WorkloadWidget key="workload" />, roles: ['pm', 'engineer'] },
    { id: 'risks', component: <RisksWidget key="risks" />, roles: ['director', 'pm'] },
  ] as const;

  // Фильтруем виджеты по видимости и роли
  const topWidgets = allWidgets
    .filter(w => visibleWidgets.includes(w.id as any) && hasRole(w.roles))
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
