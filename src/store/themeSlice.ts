// src/store/themeSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface ThemeState {
  mode: 'light' | 'dark';
}

// При инициализации сразу применяем класс к body
const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
  const initial = saved || 'light';
  if (initial === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  return initial;
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
      if (state.mode === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
      if (state.mode === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
