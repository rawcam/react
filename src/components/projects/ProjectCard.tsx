// src/components/projects/ProjectCard.tsx
import React from 'react';
import { Project } from '../../store/projectsSlice';

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'presale': return '#d97a0c';
      case 'design': return '#2c6e9e';
      case 'ready': return '#6aa9d9';
      case 'construction': return '#2a7f49';
      case 'done': return '#6c7e9e';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'presale': return 'пресейл';
      case 'design': return 'проект';
      case 'ready': return 'готов';
      case 'construction': return 'стройка';
      case 'done': return 'завершён';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleClick = () => {
    onClick?.(project);
  };

  return (
    <div 
      className={`carousel-card ${project.priority ? 'priority-card' : ''}`} 
      onClick={handleClick}
    >
      <div className="carousel-card-title">
        <span>
          {project.priority && <i className="fas fa-star" style={{ color: '#f5b042', marginRight: '6px' }}></i>}
          <span className="project-shortid">{project.shortId}</span> {project.name}
        </span>
        <span className="carousel-card-status" style={{ background: getStatusColor(project.status) }}>
          {getStatusLabel(project.status)}
        </span>
      </div>
      <div className="carousel-card-stats">
        <span>{formatCurrency(project.contractAmount)}</span>
        <span>{project.engineer} / {project.projectManager}</span>
      </div>
      <div className="carousel-card-progress">
        <div className="dashboard-progress-bg">
          <div className="dashboard-progress-fill normal" style={{ width: `${project.progress}%` }}></div>
        </div>
        <div className="carousel-card-percent">{project.progress}%</div>
      </div>
    </div>
  );
};
