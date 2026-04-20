// src/pages/ProjectsPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { ProjectList } from '../components/projects/ProjectList';
import { ProjectDetail } from '../features/projects/ProjectDetail';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { useAuth } from '../hooks/useAuth';
import { useProjectsSupabase } from '../hooks/useProjectsSupabase';

export const ProjectsPage = () => {
  const { hasRole } = useAuth();
  const { loadProjects, addProjectToDb } = useProjectsSupabase();
  const projects = useSelector((state: RootState) => state.projects.list);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('projectsViewMode');
    return saved === 'list' ? 'list' : 'grid';
  });

  const [sortBy, setSortBy] = useState<'name' | 'budget' | 'margin' | 'date' | 'progress'>('name');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'priority' | 'normal'>('all');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadProjects();
      setLoading(false);
    };
    init();
  }, [loadProjects]);

  useEffect(() => {
    const projectId = window.location.hash.match(/[?&]id=([^&]+)/)?.[1];
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      setSelectedProject(project || null);
    }
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('projectsViewMode', viewMode);
  }, [viewMode]);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (priorityFilter === 'priority') {
      filtered = filtered.filter(p => p.priority === true);
    } else if (priorityFilter === 'normal') {
      filtered = filtered.filter(p => p.priority === false);
    }

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'budget') {
      filtered.sort((a, b) => b.contractAmount - a.contractAmount);
    } else if (sortBy === 'margin') {
      filtered.sort((a, b) => (b.actualIncome - b.actualExpenses) - (a.actualIncome - a.actualExpenses));
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    } else if (sortBy === 'progress') {
      filtered.sort((a, b) => b.progress - a.progress);
    }

    return filtered;
  }, [projects, sortBy, statusFilter, priorityFilter]);

  const handleSelectProject = (project: any) => {
    navigate(`/projects?id=${project.id}`, { replace: true });
  };

  const handleBack = () => {
    navigate('/projects', { replace: true });
    setSelectedProject(null);
  };

  const handleCreate = async (projectData: any) => {
    await addProjectToDb(projectData);
    setShowCreateModal(false);
  };

  const resetFilters = () => {
    setSortBy('name');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="empty-state">
          <i className="fas fa-spinner fa-pulse" style={{ fontSize: '2rem' }}></i>
          <p>Загрузка проектов...</p>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} onBack={handleBack} />;
  }

  return (
    <div className="projects-page">
      <div className="projects-toolbar">
        <div className="toolbar-left">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <i className="fas fa-th"></i> Сетка
            </button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <i className="fas fa-list"></i> Список
            </button>
          </div>
          <div className="filter-group">
            <label><i className="fas fa-sort"></i> Сортировка</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="name">По названию</option>
              <option value="budget">По бюджету (убыв.)</option>
              <option value="margin">По марже (убыв.)</option>
              <option value="date">По дате начала (новые)</option>
              <option value="progress">По прогрессу</option>
            </select>
          </div>
          <div className="filter-group">
            <label><i className="fas fa-filter"></i> Статус</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="presale">Пресейл</option>
              <option value="design">Проект</option>
              <option value="ready">Готов</option>
              <option value="construction">Стройка</option>
              <option value="done">Завершён</option>
            </select>
          </div>
          <div className="filter-group">
            <label><i className="fas fa-star"></i> Приоритет</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}>
              <option value="all">Все</option>
              <option value="priority">Только срочные</option>
              <option value="normal">Обычные</option>
            </select>
          </div>
          <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
        </div>
        {(hasRole('director') || hasRole('pm')) && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus"></i> Новый проект
          </button>
        )}
      </div>

      <ProjectList
        projects={filteredAndSortedProjects}
        onSelectProject={handleSelectProject}
        viewMode={viewMode}
      />

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};
