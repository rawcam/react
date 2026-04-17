// src/db/index.ts
import Dexie, { Table } from 'dexie';
import { Project } from '../store/projectsSlice';
import { CompanyExpense } from '../store/companyExpensesSlice';
import { ServiceVisit } from '../store/serviceVisitsSlice';

export class SputnikDB extends Dexie {
  projects!: Table<Project>;
  companyExpenses!: Table<CompanyExpense>;
  serviceVisits!: Table<ServiceVisit>;

  constructor() {
    super('SputnikDB');
    this.version(1).stores({
      projects: 'id, shortId, category, status, engineer, projectManager',
      companyExpenses: 'id, date, category',
      serviceVisits: 'id, projectId, date, status',
    });
  }
}

export const db = new SputnikDB();
