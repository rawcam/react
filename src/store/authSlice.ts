// src/store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  role: 'director' | 'pm' | 'engineer' | 'designer' | 'logist' | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  session: null,
  user: null,
  role: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      // Роль будем загружать отдельно из таблицы user_roles
    },
    setRole: (state, action: PayloadAction<AuthState['role']>) => {
      state.role = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.session = null;
      state.user = null;
      state.role = null;
    },
  },
});

export const { setSession, setRole, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
