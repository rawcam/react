// src/pages/ProjectsPage.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useProjectsDb } from '../hooks/useProjectsDb';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { ProjectDetail } from '../components/projects/ProjectDetail';
import { Project } from '../store/projectsSlice';

export const ProjectsPage: React.FC = () => {
  const projects = useSelector((state: RootState) => state.projects.list);
  const { addProjectToDb } = useProjectsDb();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleCreateProject = async (newProject: Omit<Project, 'id' | 'shortId'>) => {
    await addProjectToDb(newProject);
    setShowCreateModal(false);
  };

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="projects-page" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>Проекты</h1>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '10px 20px', borderRadius: '40px' }}
        >
          <i className="fas fa-plus"></i> Новый проект
        </button>
      </div>

      <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {projects.map(project => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => setSelectedProject(project)}
            style={{
              background: 'var(--bg-panel)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: 'var(--shadow)',
              cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.2s',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{project.shortId}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>{project.name}</h3>
              </div>
              {project.priority && <i className="fas fa-exclamation-circle" style={{ color: 'var(--danger)' }}></i>}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span><i className="fas fa-user"></i> {project.engineer}</span>
              <span><i className="fas fa-chart-line"></i> {project.progress}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', marginBottom: '16px' }}>
              <div style={{ width: `${project.progress}%`, height: '6px', background: 'var(--accent)', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-primary)' }}>Статус: {project.status}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(project.contractAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
};
