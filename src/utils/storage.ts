// src/utils/storage.ts
import { db } from '../db';
import { store } from '../store';
import { setProjects } from '../store/projectsSlice';
import { setTracts } from '../store/tractsSlice';
import { setCompanyExpenses } from '../store/companyExpensesSlice';
import { setServiceVisits } from '../store/serviceVisitsSlice';

function generateShortId(category: string, existingIds: string[]): string {
  let rangeStart: number;
  switch (category) {
    case 'new': rangeStart = 0; break;
    case 'modernization': rangeStart = 2000; break;
    case 'service': rangeStart = 4000; break;
    case 'standard': rangeStart = 6000; break;
    case 'pilot': rangeStart = 8000; break;
  }
  const rangeEnd = rangeStart + 1999;
  const taken = new Set(existingIds.map(id => parseInt(id, 10)));
  let candidate = Math.floor(Math.random() * 2000) + rangeStart;
  let attempts = 0;
  while (taken.has(candidate) && attempts < 2000) {
    candidate = Math.floor(Math.random() * 2000) + rangeStart;
    attempts++;
  }
  for (let i = rangeStart; i <= rangeEnd; i++) {
    if (!taken.has(i)) {
      candidate = i;
      break;
    }
  }
  return candidate.toString().padStart(4, '0');
}

export const exportToJson = async () => {
  const projects = await db.projects.toArray();
  const tracts = store.getState().tracts.tracts;
  const companyExpenses = await db.companyExpenses.toArray();
  const serviceVisits = await db.serviceVisits.toArray();
  const data = { projects, tracts, companyExpenses, serviceVisits, version: '8.0' };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sputnik-backup-${new Date().toISOString().slice(0,19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFromJson = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);
  if (data.projects) {
    await db.projects.clear();
    await db.projects.bulkAdd(data.projects);
    store.dispatch(setProjects(data.projects));
  }
  if (data.tracts) store.dispatch(setTracts(data.tracts));
  if (data.companyExpenses) {
    await db.companyExpenses.clear();
    await db.companyExpenses.bulkAdd(data.companyExpenses);
    store.dispatch(setCompanyExpenses(data.companyExpenses));
  }
  if (data.serviceVisits) {
    await db.serviceVisits.clear();
    await db.serviceVisits.bulkAdd(data.serviceVisits);
    store.dispatch(setServiceVisits(data.serviceVisits));
  }
  alert('Импорт выполнен');
};

export const saveToLocalStorage = async () => {
  const projects = await db.projects.toArray();
  const tracts = store.getState().tracts.tracts;
  const companyExpenses = await db.companyExpenses.toArray();
  const serviceVisits = await db.serviceVisits.toArray();
  const data = { projects, tracts, companyExpenses, serviceVisits };
  localStorage.setItem('sputnik_backup', JSON.stringify(data));
  alert('Сохранено в браузере');
};

export const loadFromLocalStorage = async () => {
  const raw = localStorage.getItem('sputnik_backup');
  if (!raw) {
    alert('Нет сохранённых данных');
    return;
  }
  const data = JSON.parse(raw);
  if (data.projects) {
    await db.projects.clear();
    await db.projects.bulkAdd(data.projects);
    store.dispatch(setProjects(data.projects));
  }
  if (data.tracts) store.dispatch(setTracts(data.tracts));
  if (data.companyExpenses) {
    await db.companyExpenses.clear();
    await db.companyExpenses.bulkAdd(data.companyExpenses);
    store.dispatch(setCompanyExpenses(data.companyExpenses));
  }
  if (data.serviceVisits) {
    await db.serviceVisits.clear();
    await db.serviceVisits.bulkAdd(data.serviceVisits);
    store.dispatch(setServiceVisits(data.serviceVisits));
  }
  alert('Данные восстановлены');
};

export const resetProject = async () => {
  if (!confirm('Сбросить проект? Все данные будут удалены.')) return;
  await db.projects.clear();
  await db.companyExpenses.clear();
  await db.serviceVisits.clear();
  localStorage.removeItem('sputnik_backup');
  store.dispatch(setProjects([]));
  store.dispatch(setTracts([]));
  store.dispatch(setCompanyExpenses([]));
  store.dispatch(setServiceVisits([]));
  alert('Проект сброшен, данные очищены.');
};
