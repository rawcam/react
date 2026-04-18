// src/components/dashboard/CarouselWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';

export const CarouselWidget: React.FC = () => {
  const navigate = useNavigate();
  const projects = useSelector((state: RootState) => state.projects.list);
  const { hasRole } = useAuth();
  const displayMode = useSelector((state: RootState) => state.widgets.displayMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel');
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeProjects = projects.filter(p => p.status !== 'done').slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeProjects.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeProjects.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeProjects.length]);

  const handleWidgetClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dashboard-widget-actions')) return;
    navigate('/projects');
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    if (action === 'refresh') alert('Обновление данных (демо)');
    else if (action === 'export') alert('Экспорт CSV (демо)');
    else if (action === 'settings') alert('Настройки виджета (демо)');
    else if (action === 'hide') alert('Используйте панель настроек для скрытия виджета');
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeProjects.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + activeProjects.length) % activeProjects.length);
  };

  if (displayMode === 'compact') {
    return (
      <div className="dashboard-widget compact-widget" onClick={handleWidgetClick}>
        <div className="compact-widget-content">
          <i className="fas fa-rocket"></i>
          <div className="compact-value">{activeProjects.length}</div>
          <div className="compact-label">В работе</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget" onClick={handleWidgetClick}>
      <div className="dashboard-widget-header">
        <div className="dashboard-widget-title">
          <i className="fas fa-rocket"></i> Активные проекты
        </div>
        <div className="dashboard-widget-actions">
          <button
            className="dashboard-icon-btn"
            onClick={(e) => { e.stopPropagation(); setViewMode(prev => prev === 'carousel' ? 'list' : 'carousel'); }}
          >
            <i className={`fas fa-${viewMode === 'carousel' ? 'list' : 'image'}`}></i>
          </button>
          <button ref={buttonRef} className="dashboard-icon-btn" onClick={handleMenuToggle}>
            <i className="fas fa-ellipsis-h"></i>
          </button>
          {menuOpen && (
            <div className="dashboard-widget-menu" ref={menuRef}>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('refresh')}>Обновить</div>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('export')}>Экспорт CSV</div>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('settings')}>Настройки</div>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('hide')}>Скрыть виджет</div>
            </div>
          )}
        </div>
      </div>
      <div className="dashboard-widget-content" style={{ padding: viewMode === 'list' ? '8px' : '0' }}>
        {activeProjects.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>Нет активных проектов</p>
        ) : viewMode === 'carousel' ? (
          <div className="carousel-wrapper">
            <button className="carousel-arrow" onClick={prevSlide}>‹</button>
            <div className="carousel-container">
              <div className="carousel-track">
                {activeProjects.map(project => (
                  <div key={project.id} className={`carousel-card ${project.priority ? 'priority-card' : ''}`} onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="carousel-card-title">
                      <span>{project.shortId}</span>
                      <span className="carousel-card-status" style={{ background: getStatusColor(project.status) }}>{project.status}</span>
                    </div>
                    <h4>{project.name}</h4>
                    <div className="carousel-card-stats">
                      <span>{project.engineer}</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="carousel-card-progress">
                      <div className="dashboard-progress-bg" style={{ flex: 1 }}>
                        <div className="dashboard-progress-fill normal" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="carousel-card-percent">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="carousel-arrow" onClick={nextSlide}>›</button>
          </div>
        ) : (
          <div className="projects-list-vertical">
            {activeProjects.map(project => (
              <div key={project.id} className={`list-row ${project.priority ? 'priority-list-row' : ''}`} onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="list-info">
                  <span className="list-name">[{project.shortId}] {project.name}</span>
                  <div className="list-stats">
                    <span>{project.engineer}</span>
                    <span>{project.status}</span>
                  </div>
                  <div className="list-progress">
                    <div className="dashboard-progress-bg">
                      <div className="dashboard-progress-fill normal" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  <span className="list-percent">{project.progress}%</span>
                </div>
                <button className="list-detail-btn" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    presale: '#f59e0b',
    design: '#3b82f6',
    ready: '#10b981',
    construction: '#8b5cf6',
    done: '#6b7280',
  };
  return colors[status] || '#6b7280';
}
