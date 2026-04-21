// src/store/widgetsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WidgetId = 'companyFinance' | 'projectsFinance' | 'service' | 'workload' | 'risks' | 'carousel';
export type DisplayMode = 'normal' | 'compact';

interface WidgetsState {
  visibleWidgets: WidgetId[];
  displayMode: DisplayMode;
}

const initialState: WidgetsState = {
  visibleWidgets: ['companyFinance', 'projectsFinance', 'service', 'workload', 'risks', 'carousel'],
  displayMode: 'normal',
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    setVisibleWidgets: (state, action: PayloadAction<WidgetId[]>) => {
      state.visibleWidgets = action.payload;
    },
    setDisplayMode: (state, action: PayloadAction<DisplayMode>) => {
      state.displayMode = action.payload;
    },
    toggleWidget: (state, action: PayloadAction<WidgetId>) => {
      const index = state.visibleWidgets.indexOf(action.payload);
      if (index === -1) {
        state.visibleWidgets.push(action.payload);
      } else {
        state.visibleWidgets.splice(index, 1);
      }
    },
  },
});

export const { setVisibleWidgets, setDisplayMode, toggleWidget } = widgetsSlice.actions;
export default widgetsSlice.reducer;
