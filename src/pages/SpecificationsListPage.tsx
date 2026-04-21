// src/pages/SpecificationsListPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useSpecificationsSupabase } from '../hooks/useSpecificationsSupabase';
import { getSpecTotalRub } from '../utils/specificationUtils';

type ViewMode = 'grid' | 'list';

export const SpecificationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { loadSpecifications, addSpecificationToDb, updateSpecificationInDb, deleteSpecificationFromDb } = useSpecificationsSupabase();
  const specifications = useSelector((state: RootState) => state.specifications.list);
  const projects = useSelector((state: RootState) => state.projects.list);
  const { usdRate, eurRate } = useSelector((state: RootState) => state.currency);
  const user = useSelector((state: RootState) => state.auth.user);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);
      await loadSpecifications();
      setLoading(false);
    };
    init();
  }, [user, loadSpecifications]);

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return '— не привязан —';
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.shortId} ${project.name}` : '— не привязан —';
  };

  const specsWithMeta = useMemo(() => {
    return specifications.map(spec => ({
      ...spec,
      totalSum: getSpecTotalRub(spec.rows, usdRate, eurRate),
      itemsCount: spec.rows.filter(r => r.type === 'data').length,
    }));
  }, [specifications, usdRate, eurRate]);

  const filteredSpecs = useMemo(() => {
    let filtered = specsWithMeta;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q));
    }
    if (filterProject !== 'all') {
      if (filterProject === 'null') {
        filtered = filtered.filter(s => s.projectId === null);
      } else {
        filtered = filtered.filter(s => s.projectId === filterProject);
      }
    }
    return filtered;
  }, [specsWithMeta, searchQuery, filterProject]);

  const handleOpen = (id: string) => navigate(`/specification/${id}`);

  const handleDuplicate = async (spec: any) => {
    const newId = await addSpecificationToDb({
      name: `${spec.name} (копия)`,
      projectId: null,
      rows: spec.rows,
    });
    if (newId) navigate(`/specification/${newId}`);
  };

  const handleUnlink = (id: string) => {
    if (confirm('Открепить спецификацию от проекта?')) {
      updateSpecificationInDb(id, { projectId: null });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить спецификацию?')) {
      deleteSpecificationFromDb(id);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert('Введите название спецификации');
      return;
    }
    const newId = await addSpecificationToDb({
      name: newName.trim(),
      projectId: newProjectId || null,
      rows: [],
    });
    setShowModal(false);
    setNewName('');
    setNewProjectId('');
    if (newId) navigate(`/specification/${newId}`);
  };

  if (loading) {
    return (
      <div className="spec-page">
        <div className="empty-state">
          <i className="fas fa-spinner fa-pulse"></i>
          <p>Загрузка спецификаций...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spec-page">
      <div className="specs-toolbar">
        <div className="spec-toolbar-row">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Спецификации</h1>
          <button className="spec-button spec-button-primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus"></i> Новая спецификация
          </button>
        </div>
        <div className="spec-toolbar-row">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="view-toggle">
              <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                <i className="fas fa-th"></i> Сетка
              </button>
              <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                <i className="fas fa-list"></i> Список
              </button>
            </div>
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', fontSize: '0.8rem', width: '200px', background: 'var(--bg-panel-solid)', color: 'var(--text-primary)' }}
            />
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', fontSize: '0.8rem', background: 'var(--bg-panel-solid)', color: 'var(--text-primary)' }}
            >
              <option value="all">Все проекты</option>
              <option value="null">Без проекта</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.shortId} {p.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="specs-grid">
          {filteredSpecs.map(spec => (
            <div key={spec.id} className="spec-card" onClick={() => handleOpen(spec.id)}>
              <i className="fas fa-file-alt"></i>
              <h3>{spec.name}</h3>
              <div className="spec-items">{spec.itemsCount} позиций</div>
              <div className="spec-sum">{Math.round(spec.totalSum).toLocaleString()} ₽</div>
              <div className="spec-card-meta">
                <span>{getProjectName(spec.projectId)}</span>
                <span>{new Date(spec.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="spec-actions" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleOpen(spec.id)} title="Открыть"><i className="fas fa-eye"></i></button>
                <button onClick={() => handleDuplicate(spec)} title="Дублировать"><i className="fas fa-copy"></i></button>
                {spec.projectId && <button onClick={() => handleUnlink(spec.id)} title="Открепить"><i className="fas fa-unlink"></i></button>}
                <button onClick={() => handleDelete(spec.id)} title="Удалить"><i className="fas fa-trash-alt"></i></button>
              </div>
            </div>
          ))}
          {filteredSpecs.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <i className="fas fa-file-alt"></i>
              <h3>Нет спецификаций</h3>
              <p>Создайте первую спецификацию</p>
            </div>
          )}
        </div>
      ) : (
        <table className="specs-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Проект</th>
              <th>Сумма</th>
              <th>Позиций</th>
              <th>Создана</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpecs.map(spec => (
              <tr key={spec.id} onClick={() => handleOpen(spec.id)} style={{ cursor: 'pointer' }}>
                <td>{spec.name}</td>
                <td>{getProjectName(spec.projectId)}</td>
                <td>{Math.round(spec.totalSum).toLocaleString()} ₽</td>
                <td>{spec.itemsCount}</td>
                <td>{new Date(spec.createdAt).toLocaleDateString('ru-RU')}</td>
                <td className="spec-actions" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleOpen(spec.id)} title="Открыть"><i className="fas fa-eye"></i></button>
                  <button onClick={() => handleDuplicate(spec)} title="Дублировать"><i className="fas fa-copy"></i></button>
                  {spec.projectId && <button onClick={() => handleUnlink(spec.id)} title="Открепить"><i className="fas fa-unlink"></i></button>}
                  <button onClick={() => handleDelete(spec.id)} title="Удалить"><i className="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            ))}
            {filteredSpecs.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Нет спецификаций</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Новая спецификация</h3>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Название"
              autoFocus
            />
            <select value={newProjectId} onChange={e => setNewProjectId(e.target.value)}>
              <option value="">— Не привязывать —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.shortId} {p.name}</option>)}
            </select>
            <div className="modal-buttons">
              <button className="spec-button" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="spec-button spec-button-primary" onClick={handleCreate}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
