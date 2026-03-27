import React from 'react'
import { Project } from '../../store/projectsSlice'

interface ProjectListProps {
  projects: Project[]
  onSelectProject: (id: string) => void
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject }) => {
  return (
    <div className="projects-list">
      {projects.length === 0 && <div>Нет проектов. Нажмите "Новый проект".</div>}
      {projects.map(project => (
        <div key={project.id} className="project-card" onClick={() => onSelectProject(project.id)}>
          <div className="project-header">
            <div className="project-name">{project.name}</div>
            <div className="project-status">{project.status}</div>
          </div>
          <div className="project-meta">
            <div><i className="fas fa-ruble-sign"></i> {project.budget}</div>
            <div><i className="fas fa-user"></i> {project.engineer}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
