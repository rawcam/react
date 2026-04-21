// src/pages/ProjectsPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const ProjectsPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?select=*&user_id=eq.${user.id}`;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      console.log('[ProjectsPage] Fetching:', url);
      try {
        const response = await fetch(url, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('[ProjectsPage] Response status:', response.status);
        const text = await response.text();
        console.log('[ProjectsPage] Response body:', text);
        if (!response.ok) {
          setError(`HTTP ${response.status}: ${text}`);
        } else {
          const data = JSON.parse(text);
          setProjects(data);
        }
      } catch (err: any) {
        console.error('[ProjectsPage] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (loading) {
    return <div>Загрузка проектов...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div>
      <h2>Проекты ({projects.length})</h2>
      {projects.map((p: any) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
};
