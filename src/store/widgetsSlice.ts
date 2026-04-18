// src/store/widgetsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WidgetId = 
  | 'companyFinance'
  | 'projectsFinance'
  | 'service'
  | 'workload'
  | 'risks'
  | 'carousel';

export type DisplayMode = 'normal' | 'compact';

interface WidgetsState {
  visibleWidgets: WidgetId[];
  displayMode: DisplayMode;
}

const defaultVisibleForRole: Record<string, WidgetId[]> = {
  director: ['companyFinance', 'projectsFinance', 'service', 'workload', 'risks', 'carousel'],
  pm: ['projectsFinance', 'service', 'workload', 'risks', 'carousel'],
  engineer: ['service', 'workload', 'carousel'],
  designer: ['carousel'],
  logist: ['carousel'],
};

const getRoleFromStorage = (): string => {
  const role = localStorage.getItem('userRole');
  if (role && ['director', 'pm', 'engineer', 'designer', 'logist'].includes(role)) {
    return role;
  }
  return 'director';
};

const loadInitialState = (): WidgetsState => {
  const savedVisible = localStorage.getItem('visibleWidgets');
  const savedMode = localStorage.getItem('widgetsDisplayMode') as DisplayMode | null;

  let visible: WidgetId[] = [];
  if (savedVisible) {
    try {
      visible = JSON.parse(savedVisible);
    } catch { /* ignore */ }
  }
  
  if (!visible.length) {
    const role = getRoleFromStorage();
    visible = [...(defaultVisibleForRole[role] || defaultVisibleForRole.director)];
  }

  return {
    visibleWidgets: visible,
    displayMode: savedMode === 'compact' ? 'compact' : 'normal',
  };
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState: loadInitialState(),
  reducers: {
    toggleWidget: (state, action: PayloadAction<WidgetId>) => {
      const id = action.payload;
      if (state.visibleWidgets.includes(id)) {
        state.visibleWidgets = state.visibleWidgets.filter(w => w !== id);
      } else {
        state.visibleWidgets.push(id);
      }
      localStorage.setItem('visibleWidgets', JSON.stringify(state.visibleWidgets));
    },
    setVisibleWidgets: (state, action: PayloadAction<WidgetId[]>) => {
      state.visibleWidgets = action.payload;
      localStorage.setItem('visibleWidgets', JSON.stringify(state.visibleWidgets));
    },
    setDisplayMode: (state, action: PayloadAction<DisplayMode>) => {
      state.displayMode = action.payload;
      localStorage.setItem('widgetsDisplayMode', action.payload);
    },
    resetToRolePreset: (state, action: PayloadAction<string>) => {
      const role = action.payload;
      const preset = defaultVisibleForRole[role] || [...defaultVisibleForRole.director];
      state.visibleWidgets = preset;
      localStorage.setItem('visibleWidgets', JSON.stringify(preset));
    },
  },
});

export const { toggleWidget, setVisibleWidgets, setDisplayMode, resetToRolePreset } = widgetsSlice.actions;
export default widgetsSlice.reducer;
