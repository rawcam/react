// src/hooks/useFinance.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Project } from '../store/projectsSlice';
import { CompanyExpense } from '../store/companyExpensesSlice';

export const useFinance = () => {
  const projects = useSelector((state: RootState) => state.projects.list);
  const companyExpenses = useSelector((state: RootState) => state.companyExpenses.list);

  const totalIncome = projects.reduce((sum, p) => sum + p.actualIncome, 0);
  const totalExpenses = projects.reduce((sum, p) => sum + p.actualExpenses, 0) +
    companyExpenses.reduce((sum, e) => sum + (e.paid ? e.amount : 0), 0);
  const totalMargin = totalIncome - totalExpenses;
  const totalProfitability = totalIncome > 0 ? totalMargin / totalIncome : 0;

  const getProjectMetrics = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const plannedIncome = project.incomeSchedule.reduce((sum, i) => sum + i.amount, 0);
    const plannedExpenses = project.expenseSchedule.reduce((sum, e) => sum + e.amount, 0);
    const plannedMargin = plannedIncome - plannedExpenses;
    const plannedProfitability = plannedIncome > 0 ? plannedMargin / plannedIncome : 0;

    const actualIncome = project.actualIncome;
    const actualExpenses = project.actualExpenses;
    const actualMargin = actualIncome - actualExpenses;
    const actualProfitability = actualIncome > 0 ? actualMargin / actualIncome : 0;

    const cashFlow: { date: string; balance: number }[] = [];
    const incomeByDate = new Map<string, number>();
    const expenseByDate = new Map<string, number>();

    project.incomeSchedule.forEach(i => {
      incomeByDate.set(i.date, (incomeByDate.get(i.date) || 0) + i.amount);
    });
    project.expenseSchedule.forEach(e => {
      expenseByDate.set(e.date, (expenseByDate.get(e.date) || 0) + e.amount);
    });

    const allDates = [...new Set([...incomeByDate.keys(), ...expenseByDate.keys()])].sort();
    let balance = 0;
    allDates.forEach(date => {
      balance += (incomeByDate.get(date) || 0) - (expenseByDate.get(date) || 0);
      cashFlow.push({ date, balance });
    });

    return {
      planned: { income: plannedIncome, expenses: plannedExpenses, margin: plannedMargin, profitability: plannedProfitability },
      actual: { income: actualIncome, expenses: actualExpenses, margin: actualMargin, profitability: actualProfitability },
      margins: { plannedMargin, actualMargin, plannedProfitability, actualProfitability },
      cashFlow,
    };
  };

  const nextCompanyGap = (() => {
    const today = new Date().toISOString().slice(0, 10);
    const futureExpenses = companyExpenses.filter(e => e.date >= today && !e.paid).reduce((sum, e) => sum + e.amount, 0);
    if (futureExpenses === 0) return null;
    return { date: 'ближайший месяц', deficit: futureExpenses };
  })();

  return {
    totalIncome,
    totalExpenses,
    totalMargin,
    totalProfitability,
    getProjectMetrics,
    nextCompanyGap,
  };
};
