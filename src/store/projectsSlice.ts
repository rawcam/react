import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Project {
  id: string
  name: string
  status: string
  budget: number
  engineer: string
  projectManager: string
  startDate: string
  progress: number
  priority: boolean
  meetings: { date: string; subject: string }[]
  purchases: { name: string; status: string; date: string }[]
}

interface ProjectsState {
  list: Project[]
}

const initialState: ProjectsState = {
  list: [],
}

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.list = action.payload
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.list.push(action.payload)
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.list.findIndex(p => p.id === action.payload.id)
      if (index !== -1) state.list[index] = action.payload
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(p => p.id !== action.payload)
    },
  },
})

export const { setProjects, addProject, updateProject, deleteProject } = projectsSlice.actions
export default projectsSlice.reducer
