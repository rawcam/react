// src/hooks/useProjectsDb.ts
import { useDispatch } from 'react-redux';
import { db } from '../db';
import { Project, setProjects, addProject, updateProject, deleteProject } from '../store/projectsSlice';

export const useProjectsDb = () => {
  const dispatch = useDispatch();

  const loadProjects = async () => {
    const projects = await db.projects.toArray();
    dispatch(setProjects(projects));
  };

  const addProjectToDb = async (project: Omit<Project, 'id'>) => {
    const newId = Date.now().toString();
    const newProject = { ...project, id: newId };
    await db.projects.add(newProject);
    dispatch(addProject(newProject));
    return newProject;
  };

  const updateProjectInDb = async (project: Project) => {
    await db.projects.put(project);
    dispatch(updateProject(project));
  };

  const deleteProjectFromDb = async (id: string) => {
    await db.projects.delete(id);
    dispatch(deleteProject(id));
  };

  return { loadProjects, addProjectToDb, updateProjectInDb, deleteProjectFromDb };
};
