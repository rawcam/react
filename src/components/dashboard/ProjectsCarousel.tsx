// src/components/dashboard/ProjectsCarousel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../store/projectsSlice';

interface ProjectsCarouselProps {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
}

export const ProjectsCarousel: React.FC<ProjectsCarouselProps> = ({ projects, onSelectProject }) => {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>(() => {
    const saved = localStorage.getItem('projectsViewMode');
    return saved === 'list' ? 'list' : 'carousel';
  });

  useEffect(() => {
    localStorage.setItem('projectsViewMode', viewMode);
  }, [viewMode]);

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.priority === b.priority) return 0;
    return a.priority ? -1 : 1;
  });

  const handleProjectClick = (project: Project) => {
    if (onSelectProject) onSelectProject(project);
    else navigate(`/projects/${project.id}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 360;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'presale':
        return '#d97a0c';
      case 'design':
        return '#2c6e9e';
      case 'ready':
        return '#6aa9d9';
      case 'construction':
        return '#2a7f49';
      case 'done':
        return '#6c7e9e';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'presale':
        return 'пресейл';
      case 'design':
        return 'проект';
      case 'ready':
        return 'готов';
      case 'construction':
        return 'стройка';
      case 'done':
        return 'завершён';
      default:
        return status;
    }
  };

  if (projects.length === 0) {
    return <div className="dashboard-empty">Нет активных проектов</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Активные проекты</h3>
        <div className="projects-view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'carousel' ? 'active' : ''}`}
            onClick={() => setViewMode('carousel')}
          >
            <i className="fas fa-images"></i> Карусель
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i> Список
          </button>
        </div>
      </div>

      {viewMode === 'carousel' && (
        <div className="carousel-wrapper">
          <button className="carousel-arrow prev" onClick={() => scroll('left')}>
            ‹
          </button>
          <div className="carousel-container" ref={carouselRef}>
            <div className="carousel-track">
              {sortedProjects.map(project => (
                <div
                  key={project.id}
                  className={`carousel-card ${project.priority ? 'priority-card' : ''}`}
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="carousel-card-title">
                    <span>
                      {project.priority && <i className="fas fa-star" style={{ color: '#f5b042', marginRight: '6px' }}></i>}
                      {project.name}
                    </span>
                    <span className="carousel-card-status" style={{ background: getStatusColor(project.status) }}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <div className="carousel-card-stats">
                    <span>{formatCurrency(project.contractAmount)}</span>
                    <span>
                      {project.engineer} / {project.projectManager}
                    </span>
                  </div>
                  <div className="carousel-card-progress">
                    <div className="dashboard-progress-bg">
                      <div className="dashboard-progress-fill normal" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <div className="carousel-card-percent">{project.progress}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="carousel-arrow next" onClick={() => scroll('right')}>
            ›
          </button>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="projects-list">
          {sortedProjects.map(project => (
            <div
              key={project.id}
              className={`project-row ${project.priority ? 'priority-row' : ''}`}
              onClick={() => handleProjectClick(project)}
            >
              <div className="project-row-grid">
                <div className="row-cell row-icon">
                  {project.priority && <i className="fas fa-star" style={{ color: '#f5b042' }}></i>}
                </div>
                <div className="row-cell row-id">
                  <span className="project-shortid">{project.shortId}</span>
                </div>
                <div className="row-cell row-name">{project.name}</div>
                <div className="row-cell row-budget">{formatCurrency(project.contractAmount)}</div>
                <div className="row-cell row-responsible">
                  {project.engineer} / {project.projectManager}
                </div>
                <div className="row-cell row-progress">
                  <div className="row-progress-wrapper">
                    <div className="dashboard-progress-bg">
                      <div className="dashboard-progress-fill normal" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <span className="row-percent">{project.progress}%</span>
                  </div>
                </div>
                <div className="row-cell row-status">
                  <span className="project-row-status" style={{ background: getStatusColor(project.status) }}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
