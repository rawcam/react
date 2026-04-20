// src/pages/SpecificationPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setUsdRate, setEurRate } from '../store/currencySlice';
import { useSpecificationsSupabase } from '../hooks/useSpecificationsSupabase';
import Sortable from 'sortablejs';
import * as XLSX from 'xlsx';
import './SpecificationPage.css';

// ... (интерфейсы DataRow, SectionRow, Row остаются без изменений)

export const SpecificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { updateSpecificationInDb } = useSpecificationsSupabase();
  const specifications = useSelector((state: RootState) => state.specifications.list);
  const projects = useSelector((state: RootState) => state.projects.list);
  const usdRate = useSelector((state: RootState) => state.currency.usdRate);
  const eurRate = useSelector((state: RootState) => state.currency.eurRate);

  const currentSpec = id ? specifications.find(s => s.id === id) : null;

  // ... (весь стейт и вспомогательные функции до автосохранения)

  // Автосохранение с защитой от циклов (заменили dispatch на updateSpecificationInDb)
  useEffect(() => {
    if (!currentSpec || rows.length === 0) return;

    const rowsJSON = JSON.stringify(rows);
    if (rowsJSON === prevRowsRef.current) return;

    prevRowsRef.current = rowsJSON;
    updateSpecificationInDb(currentSpec.id, { rows });
  }, [rows, currentSpec, updateSpecificationInDb]);

  useEffect(() => {
    if (currentSpec && tableName !== currentSpec.name) {
      updateSpecificationInDb(currentSpec.id, { name: tableName });
    }
  }, [tableName, currentSpec, updateSpecificationInDb]);

  useEffect(() => {
    if (currentSpec && selectedProjectId !== currentSpec.projectId) {
      updateSpecificationInDb(currentSpec.id, { projectId: selectedProjectId });
    }
  }, [selectedProjectId, currentSpec, updateSpecificationInDb]);

  // ... (остальной код без изменений, включая JSX)
};
