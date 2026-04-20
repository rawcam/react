// src/store/specificationsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Полный тип, совместимый с Row из SpecificationPage
export interface SpecRow {
  id: string;
  type: 'data' | 'section';
  name: string;                  // обязательное поле
  vendor?: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  currency?: string;             // ← добавлено
  price?: number;
  discount?: number;
  discountAmount?: number;
  priceAfter?: number;           // ← добавлено
  supplier?: string;
  status?: string;
  // поля секций
  title?: string;
  collapsed?: boolean;
  // устаревшие поля (оставлены для совместимости со старыми данными)
  priceUsd?: number;
  priceRub?: number;
  priceEur?: number;
  level?: number;
}

export interface Specification {
  id: string;
  name: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  rows: SpecRow[];
}

interface SpecificationsState {
  list: Specification[];
}

const initialState: SpecificationsState = {
  list: [],
};

const specificationsSlice = createSlice({
  name: 'specifications',
  initialState,
  reducers: {
    setSpecifications: (state, action: PayloadAction<Specification[]>) => {
      state.list = action.payload;
    },
    addSpecification: (state, action: PayloadAction<Specification>) => {
      state.list.push(action.payload);
    },
    updateSpecification: (state, action: PayloadAction<{ id: string; updates: Partial<Specification> }>) => {
      const index = state.list.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...action.payload.updates, updatedAt: new Date().toISOString() };
      }
    },
    deleteSpecification: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(s => s.id !== action.payload);
    },
    addSpecRow: (state, action: PayloadAction<{ specId: string; row: SpecRow }>) => {
      const spec = state.list.find(s => s.id === action.payload.specId);
      if (spec) {
        spec.rows.push(action.payload.row);
        spec.updatedAt = new Date().toISOString();
      }
    },
    updateSpecRow: (state, action: PayloadAction<{ specId: string; rowId: string; updates: Partial<SpecRow> }>) => {
      const spec = state.list.find(s => s.id === action.payload.specId);
      if (spec) {
        const row = spec.rows.find(r => r.id === action.payload.rowId);
        if (row) {
          Object.assign(row, action.payload.updates);
          spec.updatedAt = new Date().toISOString();
        }
      }
    },
    deleteSpecRow: (state, action: PayloadAction<{ specId: string; rowId: string }>) => {
      const spec = state.list.find(s => s.id === action.payload.specId);
      if (spec) {
        spec.rows = spec.rows.filter(r => r.id !== action.payload.rowId);
        spec.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const {
  setSpecifications,
  addSpecification,
  updateSpecification,
  deleteSpecification,
  addSpecRow,
  updateSpecRow,
  deleteSpecRow,
} = specificationsSlice.actions;
export default specificationsSlice.reducer;
