// src/store/projectsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ProjectCategory = 'new' | 'modernization' | 'service' | 'standard' | 'pilot';
export type ProjectStatus = 'presale' | 'design' | 'ready' | 'construction' | 'done';

export interface Meeting {
  date: string;
  subject: string;
}

export interface Purchase {
  name: string;
  status: string;
  date: string;
}

export interface IncomeItem {
  date: string;
  amount: number;
  paid?: boolean;
}

export interface ExpenseItem {
  date: string;
  amount: number;
  type: 'purchase' | 'salary' | 'subcontractor' | 'rent';
  paid?: boolean;
}

export interface ServiceVisit {
  id: string;
  date: string;
  type: string;
  status: 'planned' | 'completed' | 'cancelled';
  responsible: string;
  cost?: number;
  notes?: string;
}

export interface RoadmapItem {
  status: ProjectStatus;
  date: string;
}

export interface Project {
  id: string;
  shortId: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  statusStartDate: string;
  startDate: string;
  endDate?: string;
  progress: number;
  contractAmount: number;
  engineer: string;
  projectManager: string;
  priority: boolean;
  meetings: Meeting[];
  purchases: Purchase[];
  incomeSchedule: IncomeItem[];
  expenseSchedule: ExpenseItem[];
  serviceVisits: ServiceVisit[];
  actualIncome: number;
  actualExpenses: number;
  nextStatus?: ProjectStatus;
  nextStatusDate?: string;
  roadmapPlanned: RoadmapItem[];
  roadmapActual: RoadmapItem[];
}

interface ProjectsState {
  list: Project[];
  selectedProjectId: string | null;
}

// начальное состояние – пустой список, чтобы не было демо-проектов после сбоя
const initialState: ProjectsState = {
  list: [],
  selectedProjectId: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.list = action.payload;
    },
    addProject: (state, action: PayloadAction<Omit<Project, 'id' | 'shortId'>>) => {
      const newId = Date.now().toString();
      const shortId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      state.list.push({ ...action.payload, id: newId, shortId });
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.list.findIndex(p => p.id === action.payload.id);
      if (index !== -1) state.list[index] = action.payload;
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(p => p.id !== action.payload);
    },
    setSelectedProject: (state, action: PayloadAction<string | null>) => {
      state.selectedProjectId = action.payload;
    },
  },
});

export const { setProjects, addProject, updateProject, deleteProject, setSelectedProject } = projectsSlice.actions;
export default projectsSlice.reducer;
