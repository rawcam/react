// src/components/projects/ProjectList.tsx
import React from 'react';
import { Project } from '../../store/projectsSlice';
import { ProjectCard } from './ProjectCard';
import { ProjectRow } from './ProjectRow';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  viewMode: 'grid' | 'list';
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, viewMode }) => {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-folder-open"></i>
        <h3>Нет проектов</h3>
        <p>Нажмите «Новый проект», чтобы создать первый.</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="projects-grid">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} onClick={onSelectProject} />
        ))}
      </div>
    );
  }

  return (
    <div className="projects-list">
      {projects.map(project => (
        <ProjectRow key={project.id} project={project} onClick={onSelectProject} />
      ))}
    </div>
  );
};
