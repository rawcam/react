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
  endDate?: string;                 // добавлено
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

const demoProjects: Project[] = [
  {
    id: '1',
    shortId: '0001',
    name: 'Офис продаж (демо)',
    category: 'new',
    status: 'design',
    statusStartDate: '2025-01-15',
    startDate: '2025-01-10',
    endDate: '2025-06-30',
    progress: 35,
    contractAmount: 2500000,
    engineer: 'Иванов А.А.',
    projectManager: 'Петров В.С.',
    priority: true,
    meetings: [
      { date: '2025-02-01', subject: 'Обсуждение ТЗ' },
      { date: '2025-02-15', subject: 'Промежуточный отчёт' },
    ],
    purchases: [
      { name: 'Коммутатор Cisco', status: 'paid', date: '2025-01-20' },
      { name: 'Кабель UTP', status: 'delivered', date: '2025-01-25' },
    ],
    incomeSchedule: [
      { date: '2025-02-10', amount: 1000000, paid: true },
      { date: '2025-03-10', amount: 1500000, paid: false },
    ],
    expenseSchedule: [
      { date: '2025-01-20', amount: 500000, type: 'purchase', paid: true },
      { date: '2025-02-20', amount: 300000, type: 'salary', paid: false },
    ],
    serviceVisits: [
      { id: 's1', date: '2025-03-01', type: 'Плановое ТО', status: 'planned', responsible: 'Сидоров М.В.', cost: 15000 },
    ],
    actualIncome: 1000000,
    actualExpenses: 500000,
    nextStatus: 'ready',
    nextStatusDate: '2025-03-01',
    roadmapPlanned: [
      { status: 'presale', date: '2025-01-01' },
      { status: 'design', date: '2025-02-01' },
      { status: 'ready', date: '2025-03-01' },
      { status: 'construction', date: '2025-04-01' },
      { status: 'done', date: '2025-05-01' },
    ],
    roadmapActual: [
      { status: 'presale', date: '2025-01-05' },
      { status: 'design', date: '2025-02-10' },
    ],
  },
];

const initialState: ProjectsState = {
  list: demoProjects,
  selectedProjectId: null,
};

export const seedDemoProjects = (): Project[] => demoProjects;

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
