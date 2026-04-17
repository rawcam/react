// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import projectsReducer from './projectsSlice';
import tractsReducer from './tractsSlice';
import videoReducer from './videoSlice';
import networkReducer from './networkSlice';
import soundReducer from './soundSlice';
import ledReducer from './ledSlice';
import vcReducer from './vcSlice';
import ergoReducer from './ergoSlice';
import powerReducer from './powerSlice';
import companyExpensesReducer from './companyExpensesSlice';
import serviceVisitsReducer from './serviceVisitsSlice';
import specificationsReducer from './specificationsSlice';
import widgetsReducer from './widgetsSlice';
import uiReducer from './uiSlice';
import currencyReducer from './currencySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tracts: tractsReducer,
    video: videoReducer,
    network: networkReducer,
    sound: soundReducer,
    led: ledReducer,
    vc: vcReducer,
    ergo: ergoReducer,
    power: powerReducer,
    companyExpenses: companyExpensesReducer,
    serviceVisits: serviceVisitsReducer,
    specifications: specificationsReducer,
    widgets: widgetsReducer,
    ui: uiReducer,
    currency: currencyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
