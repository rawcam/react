// src/pages/DashboardPage.tsx
import React from 'react';
import { CompanyFinanceWidget } from '../components/dashboard/CompanyFinanceWidget';
import { ProjectsFinanceWidget } from '../components/dashboard/ProjectsFinanceWidget';
import { ServiceWidget } from '../components/dashboard/ServiceWidget';
import { WorkloadWidget } from '../components/dashboard/WorkloadWidget';
import { RisksWidget } from '../components/dashboard/RisksWidget';
import { CarouselWidget } from '../components/dashboard/CarouselWidget';
import { useAppSelector } from '../hooks/hooks';
import { WidgetConfigDrawer } from '../components/ui/WidgetConfigDrawer';

export const DashboardPage: React.FC = () => {
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
    <div className="dashboard-page">
      <div className={`dashboard-grid ${displayMode}`}>
        {visibleWidgets.map(id => widgetMap[id])}
      </div>
      <WidgetConfigDrawer />
    </div>
  );
};
