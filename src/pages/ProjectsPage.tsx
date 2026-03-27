import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { ProjectList } from '../features/projects/ProjectList'
import { ProjectDetail } from '../features/projects/ProjectDetail'
import './ProjectsPage.css'

export const ProjectsPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const projects = useSelector((state: RootState) => state.projects.list)

  const handleSelectProject = (id: string) => setSelectedProjectId(id)
  const handleBack = () => setSelectedProjectId(null)

  if (selectedProjectId) {
    const project = projects.find(p => p.id === selectedProjectId)
    if (!project) return <div>Проект не найден</div>
    return <ProjectDetail project={project} onBack={handleBack} />
  }

  return (
    <div className="projects-page">
      <div className="dashboard-wrapper">
        <div className="projects-header">
          <h2>УПРАВЛЕНИЕ ПРОЕКТАМИ</h2>
          <button className="btn-primary" id="createProjectBtn">
            <i className="fas fa-plus"></i> Новый проект
          </button>
        </div>
        <ProjectList projects={projects} onSelectProject={handleSelectProject} />
      </div>
    </div>
  )
}
