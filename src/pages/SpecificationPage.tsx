import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateSpecificationRows, updateSpecification } from '../store/specificationsSlice';
import { setUsdRate, setEurRate } from '../store/currencySlice';
import Sortable from 'sortablejs';
import * as XLSX from 'xlsx';
import './SpecificationPage.css';

export interface DataRow {
  id: number;
  type: 'data';
  vendor: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  currency: string;
  price: number;
  discount: number;
  discountAmount: number;
  priceAfter: number;
  supplier: string;
  status: string;
}

export interface SectionRow {
  id: number;
  type: 'section';
  title: string;
  collapsed: boolean;
}

export type Row = DataRow | SectionRow;

const statuses = ['Замена', 'Получено КП', 'Закуплено'];
const currencies = ['RUB', 'USD', 'EUR'];
const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' };
const currencyColors: Record<string, string> = { RUB: '#3b82f6', USD: '#10b981', EUR: '#f59e0b' };

export const SpecificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const specifications = useSelector((state: RootState) => state.specifications.list);
  const projects = useSelector((state: RootState) => state.projects.list);
  const usdRate = useSelector((state: RootState) => state.currency.usdRate);
  const eurRate = useSelector((state: RootState) => state.currency.eurRate);

  const currentSpec = id ? specifications.find(s => s.id === id) : null;

  const [rows, setRows] = useState<Row[]>([]);
  const [nextId, setNextId] = useState(105);
  const [tableName, setTableName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterVendor, setFilterVendor] = useState('');
  const [filterSku, setFilterSku] = useState('');

  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('spec_column_widths');
    return saved ? JSON.parse(saved) : {
      drag: 40, checkbox: 30, num: 50, vendor: 120, sku: 120, name: 250,
      qty: 90, unit: 80, currency: 90, price: 110, discount: 100,
      discountAmount: 130, priceAfter: 130, totalRub: 130,
      supplier: 140, status: 120, actions: 100,
    };
  });

  // Загрузка спецификации
  useEffect(() => {
    if (currentSpec) {
      setRows(currentSpec.rows);
      setTableName(currentSpec.name);
      setSelectedProjectId(currentSpec.projectId);
      const maxId = currentSpec.rows.reduce((max, row) => Math.max(max, row.id), 0);
      setNextId(maxId + 1);
    } else if (id === undefined) {
      resetDemo();
      setSelectedProjectId(null);
      setTableName('');
    } else {
      navigate('/specifications');
    }
  }, [currentSpec, id]);

  // Автосохранение
  useEffect(() => {
    if (currentSpec && rows.length > 0) {
      dispatch(updateSpecificationRows({ id: currentSpec.id, rows }));
    }
  }, [rows, currentSpec]);

  useEffect(() => {
    if (currentSpec && tableName !== currentSpec.name) {
      dispatch(updateSpecification({ id: currentSpec.id, updates: { name: tableName } }));
    }
  }, [tableName, currentSpec]);

  useEffect(() => {
    if (currentSpec && selectedProjectId !== currentSpec.projectId) {
      dispatch(updateSpecification({ id: currentSpec.id, updates: { projectId: selectedProjectId } }));
    }
  }, [selectedProjectId, currentSpec]);

  useEffect(() => {
    localStorage.setItem('spec_column_widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Drag-and-drop (SortableJS)
  useEffect(() => {
    if (!tableBodyRef.current) return;
    if (sortableRef.current) {
      try { sortableRef.current.destroy(); } catch (e) {}
      sortableRef.current = null;
    }
    const timer = setTimeout(() => {
      if (tableBodyRef.current && typeof Sortable !== 'undefined') {
        try {
          sortableRef.current = new Sortable(tableBodyRef.current, {
            handle: '.spec-data-row .spec-drag-handle',
            animation: 150,
            forceFallback: true,
            onEnd: () => {
              if (!tableBodyRef.current) return;
              const domRows = Array.from(tableBodyRef.current.children);
              const newRowsOrder: Row[] = [];
              for (const dom of domRows) {
                const id = Number(dom.getAttribute('data-id'));
                const found = rows.find(r => r.id === id);
                if (found) newRowsOrder.push(found);
              }
              if (newRowsOrder.length === rows.length) setRows(newRowsOrder);
            },
          });
        } catch (e) {
          console.error('Sortable init error:', e);
        }
      }
    }, 50);
    return () => {
      clearTimeout(timer);
      if (sortableRef.current) {
        try { sortableRef.current.destroy(); } catch (e) {}
        sortableRef.current = null;
      }
    };
  }, [rows]);

  // Глобальный обработчик для отключения изменения значений колёсиком мыши на числовых полях
  const handleWheelPrevent = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input[type="number"]')) {
      e.preventDefault();
    }
  }, []);

  // ========== Вспомогательные функции ==========
  const getRate = (currency: string) => {
    if (currency === 'USD') return usdRate;
    if (currency === 'EUR') return eurRate;
    return 1;
  };
  const getGrossRub = (row: DataRow) => row.price * row.quantity * getRate(row.currency);
  const getTotalRub = (row: DataRow) => (row.priceAfter || 0) * row.quantity * getRate(row.currency);
  const formatNumber = (num: number): string => Math.round(num).toLocaleString('ru-RU');

  const updateCalculations = () => {
    setRows(prev =>
      prev.map(row => {
        if (row.type === 'data') {
          const discountAmount = (row.price * row.discount) / 100;
          const priceAfter = row.price - discountAmount;
          return { ...row, discountAmount, priceAfter };
        }
        return row;
      })
    );
  };
  useEffect(() => {
    updateCalculations();
  }, []);

  const isDataRowVisible = (row: DataRow) => {
    const vendorMatch = filterVendor === '' || row.vendor.toLowerCase().includes(filterVendor.toLowerCase());
    const skuMatch = filterSku === '' || row.sku.toLowerCase().includes(filterSku.toLowerCase());
    return vendorMatch && skuMatch;
  };

  const computeTotals = () => {
    let totalGrossRub = 0, totalRub = 0, totalQty = 0, totalDiscountRub = 0;
    const byCurrency: Record<string, { gross: number; net: number; qty: number }> = {};
    for (const row of rows) {
      if (row.type === 'data' && isDataRowVisible(row)) {
        const gross = getGrossRub(row);
        const net = getTotalRub(row);
        totalGrossRub += gross;
        totalRub += net;
        totalDiscountRub += gross - net;
        totalQty += row.quantity;
        const curr = row.currency;
        if (!byCurrency[curr]) byCurrency[curr] = { gross: 0, net: 0, qty: 0 };
        byCurrency[curr].gross += row.price * row.quantity;
        byCurrency[curr].net += row.priceAfter * row.quantity;
        byCurrency[curr].qty += row.quantity;
      }
    }
    const marginPercent = totalGrossRub === 0 ? 0 : ((totalGrossRub - totalRub) / totalGrossRub) * 100;
    return { totalGrossRub, totalRub, totalDiscountRub, totalQty, marginPercent, byCurrency };
  };

  // Операции с данными
  const addDataRowAfterId = (afterId: number) => {
    const index = rows.findIndex(r => r.id === afterId);
    if (index === -1) return;
    const newId = nextId;
    setNextId(nextId + 1);
    const newRow: DataRow = {
      id: newId, type: 'data', vendor: '', sku: '', name: '', quantity: 0, unit: 'шт', currency: 'RUB',
      price: 0, discount: 0, discountAmount: 0, priceAfter: 0, supplier: '', status: 'Замена'
    };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, newRow);
    setRows(newRows);
    setTimeout(() => updateCalculations(), 0);
  };

  const addSection = () => {
    const newId = nextId;
    setNextId(nextId + 1);
    setRows([...rows, { id: newId, type: 'section', title: 'Новый раздел', collapsed: false }]);
  };

  const duplicateRow = (id: number) => {
    const index = rows.findIndex(r => r.id === id);
    if (index === -1 || rows[index].type !== 'data') return;
    const original = rows[index] as DataRow;
    const newId = nextId;
    setNextId(nextId + 1);
    const clone = { ...original, id: newId, name: original.name + ' (копия)' };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, clone);
    setRows(newRows);
    setTimeout(() => updateCalculations(), 0);
  };

  const deleteRow = (id: number) => {
    setRows(rows.filter(r => r.id !== id));
    setSelectedIds(prev => prev.filter(pid => pid !== id));
  };

  const toggleSection = (id: number) => {
    setRows(prev => prev.map(r => r.type === 'section' && r.id === id ? { ...r, collapsed: !r.collapsed } : r));
  };

  const updateSectionTitle = (id: number, title: string) => {
    setRows(prev => prev.map(r => r.type === 'section' && r.id === id ? { ...r, title } : r));
  };

  const updateDataField = (id: number, field: keyof DataRow, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.type === 'data' && r.id === id) {
        const updated = { ...r, [field]: value };
        if (field === 'price' || field === 'discount') {
          const discountAmount = (updated.price * updated.discount) / 100;
          const priceAfter = updated.price - discountAmount;
          updated.discountAmount = discountAmount;
          updated.priceAfter = priceAfter;
        }
        return updated;
      }
      return r;
    }));
  };

  const expandAll = () => setRows(prev => prev.map(r => r.type === 'section' ? { ...r, collapsed: false } : r));
  const collapseAll = () => setRows(prev => prev.map(r => r.type === 'section' ? { ...r, collapsed: true } : r));

  const resetDemo = () => {
    setRows([
      { id: 100, type: 'data', vendor: 'Siemens', sku: 'ABC-123', name: 'Контактор 3RT2015', quantity: 10, unit: 'шт', currency: 'RUB', price: 2500, discount: 5, discountAmount: 125, priceAfter: 2375, supplier: 'ООО "Электроснаб"', status: 'Закуплено' },
      { id: 101, type: 'data', vendor: 'Schneider', sku: 'GV2ME07', name: 'Автоматический выключатель', quantity: 5, unit: 'шт', currency: 'USD', price: 45, discount: 10, discountAmount: 4.5, priceAfter: 40.5, supplier: 'Schneider Electric', status: 'Получено КП' },
      { id: 102, type: 'section', title: 'Освещение', collapsed: false },
      { id: 103, type: 'data', vendor: 'Philips', sku: 'LED-9W', name: 'Лампа светодиодная 9W 4000K', quantity: 100, unit: 'шт', currency: 'RUB', price: 120, discount: 0, discountAmount: 0, priceAfter: 120, supplier: 'ООО "Световые решения"', status: 'Замена' },
      { id: 104, type: 'data', vendor: 'Legrand', sku: 'Valena', name: 'Розетка двойная', quantity: 20, unit: 'шт', currency: 'EUR', price: 8.5, discount: 15, discountAmount: 1.275, priceAfter: 7.225, supplier: 'Legrand Rus', status: 'Закуплено' },
    ]);
    setNextId(105);
    setTableName('');
    setSelectedProjectId(null);
  };

  const exportToExcel = () => {
    const sheetData: any[][] = [['Вендор', 'Артикул', 'Наименование', 'Кол-во', 'Ед.', 'Валюта', 'Цена за ед.', 'Скидка %', 'Сумма скидки', 'Цена после скидки', 'Общая сумма (руб)', 'Поставщик', 'Статус']];
    for (const row of rows) {
      if (row.type === 'section') {
        sheetData.push([`=== ${row.title} ===`, '', '', '', '', '', '', '', '', '', '', '', '']);
      } else {
        const totalRub = getTotalRub(row);
        const sym = currencySymbols[row.currency];
        sheetData.push([row.vendor, row.sku, row.name, row.quantity, row.unit, row.currency, row.price, row.discount, `${sym} ${formatNumber(row.discountAmount)}`, `${sym} ${formatNumber(row.priceAfter)}`, `${formatNumber(totalRub)} ₽`, row.supplier, row.status]);
      }
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Спецификация');
    XLSX.writeFile(wb, `specification_${Date.now()}.xlsx`);
  };

  const deleteSelected = () => {
    setRows(rows.filter(r => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };

  const startResize = (colKey: string, startX: number, startWidth: number) => {
    const onMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth + (moveEvent.pageX - startX);
      if (newWidth < 40) newWidth = 40;
      setColumnWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Клавиатурная навигация
  const getFocusableElements = useCallback(() => {
    if (!tableBodyRef.current) return [];
    return Array.from(
      tableBodyRef.current.querySelectorAll('.spec-data-row input, .spec-data-row select')
    ) as HTMLElement[];
  }, []);

  const getColumnIndex = (el: HTMLElement): number => {
    const cell = el.closest('td');
    if (!cell) return -1;
    const row = cell.parentElement as HTMLTableRowElement;
    if (!row) return -1;
    return Array.from(row.cells).indexOf(cell);
  };

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.spec-data-row')) return;

      const focusable = getFocusableElements();
      const currentIndex = focusable.indexOf(target);
      if (currentIndex === -1) return;

      const currentCol = getColumnIndex(target);
      if (currentCol === -1) return;

      const getNextInColumn = (direction: 'up' | 'down'): HTMLElement | null => {
        let found = false;
        let next: HTMLElement | null = null;
        for (let i = 0; i < focusable.length; i++) {
          const el = focusable[i];
          const col = getColumnIndex(el);
          if (col === currentCol) {
            if (direction === 'down' && found && !next) next = el;
            if (el === target) found = true;
            if (direction === 'up' && !found && i < currentIndex) next = el;
          }
        }
        return next;
      };

      let nextIndex = currentIndex;
      switch (e.key) {
        case 'ArrowRight':
          nextIndex = currentIndex + 1;
          if (nextIndex >= focusable.length) nextIndex = 0;
          break;
        case 'ArrowLeft':
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = focusable.length - 1;
          break;
        case 'ArrowDown': {
          const next = getNextInColumn('down');
          if (next) {
            e.preventDefault();
            next.focus();
          }
          return;
        }
        case 'ArrowUp': {
          const prev = getNextInColumn('up');
          if (prev) {
            e.preventDefault();
            prev.focus();
          }
          return;
        }
        default:
          return;
      }
      if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < focusable.length) {
        e.preventDefault();
        focusable[nextIndex].focus();
      }
    },
    [getFocusableElements]
  );

  const totals = computeTotals();
  let dataCounter = 0;

  return (
    <div className="spec-page" onKeyDown={handleTableKeyDown} onWheel={handleWheelPrevent}>
      <div className="spec-toolbar">
        <div className="spec-toolbar-row">
          <input
            type="text"
            className="spec-table-name"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            placeholder="Название спецификации"
          />
          <div className="spec-rates">
            <label>USD → RUB <input type="number" value={usdRate} onChange={e => dispatch(setUsdRate(parseFloat(e.target.value) || 0))} step="0.1" /></label>
            <label>EUR → RUB <input type="number" value={eurRate} onChange={e => dispatch(setEurRate(parseFloat(e.target.value) || 0))} step="0.1" /></label>
          </div>
          <div className="spec-date">{new Date().toLocaleString()}</div>
        </div>
        <div className="spec-toolbar-row">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Фильтр по вендору"
                value={filterVendor}
                onChange={e => setFilterVendor(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--spec-border-light)', fontSize: '0.8rem', width: '140px', background: 'var(--spec-bg-solid)', color: 'var(--spec-text-primary)' }}
              />
              <input
                type="text"
                placeholder="Фильтр по артикулу"
                value={filterSku}
                onChange={e => setFilterSku(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--spec-border-light)', fontSize: '0.8rem', width: '140px', background: 'var(--spec-bg-solid)', color: 'var(--spec-text-primary)' }}
              />
            </div>
            <select
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(e.target.value || null)}
              style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--spec-border-light)', fontSize: '0.8rem', background: 'var(--spec-bg-solid)', color: 'var(--spec-text-primary)' }}
            >
              <option value="">— Не привязан —</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.shortId} {project.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="spec-button" onClick={expandAll}><i className="fas fa-plus-square"></i> Развернуть всё</button>
            <button className="spec-button" onClick={collapseAll}><i className="fas fa-minus-square"></i> Свернуть всё</button>
            <button className="spec-button spec-button-primary" onClick={addSection}><i className="fas fa-layer-group"></i> Раздел</button>
            <button className="spec-button" onClick={exportToExcel}><i className="fas fa-file-excel"></i> Excel</button>
            <button className="spec-button spec-button-danger" onClick={resetDemo}><i className="fas fa-undo-alt"></i> Сброс</button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ background: 'var(--spec-accent-glow)', borderRadius: '12px', padding: '8px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Выбрано: {selectedIds.length}</span>
          <button className="spec-button spec-button-danger" onClick={deleteSelected}><i className="fas fa-trash-alt"></i> Удалить выбранные</button>
        </div>
      )}

      <div className="spec-informers">
        <div className="spec-informer" style={{ borderLeftColor: '#10b981' }}>
          <div className="label">Валовая сумма (сумма продажи)</div>
          <div className="value">{formatNumber(totals.totalGrossRub)} ₽</div>
          <div className="sub">Количество, шт: {formatNumber(totals.totalQty)}</div>
        </div>
        <div className="spec-informer" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="label">Сумма закупки (после скидки)</div>
          <div className="value">{formatNumber(totals.totalRub)} ₽</div>
          <div className="sub">Скидка всего: {formatNumber(totals.totalDiscountRub)} ₽</div>
        </div>
        <div className="spec-informer" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="label">Маржинальность</div>
          <div className="value">{totals.marginPercent.toFixed(1)}%</div>
          <div className="sub">от валовой суммы</div>
        </div>
        {Object.entries(totals.byCurrency).map(([curr, data]) => (
          <div key={curr} className="spec-informer" style={{ borderLeftColor: currencyColors[curr] || '#3b82f6' }}>
            <div className="label">{curr}</div>
            <div className="value">{currencySymbols[curr]} {formatNumber(data.net)}</div>
            <div className="sub">Валовая: {currencySymbols[curr]} {formatNumber(data.gross)}</div>
          </div>
        ))}
      </div>

      <div className="spec-table-container">
        <table className="spec-table">
          <thead>
            <tr>
              {['drag', 'checkbox', 'num', 'vendor', 'sku', 'name', 'qty', 'unit', 'currency', 'price', 'discount', 'discountAmount', 'priceAfter', 'totalRub', 'supplier', 'status', 'actions'].map(col => (
                <th key={col} style={{ width: columnWidths[col] }}>
                  {col === 'drag' && <i className="fas fa-grip-vertical spec-drag-handle" style={{ color: '#cbd5e1' }}></i>}
                  {col === 'checkbox' && <input type="checkbox" onChange={(e) => { const checked = e.target.checked; setSelectedIds(checked ? rows.filter(r => r.type === 'data').map(r => r.id) : []); }} />}
                  {col === 'num' && '#'}
                  {col === 'vendor' && 'Вендор'}
                  {col === 'sku' && 'Артикул'}
                  {col === 'name' && 'Наименование (описание)'}
                  {col === 'qty' && 'Количество'}
                  {col === 'unit' && 'Ед. изм.'}
                  {col === 'currency' && 'Валюта'}
                  {col === 'price' && 'Цена за ед.'}
                  {col === 'discount' && 'Скидка (%)'}
                  {col === 'discountAmount' && 'Сумма скидки'}
                  {col === 'priceAfter' && 'Цена за вычетом скидки'}
                  {col === 'totalRub' && 'Общая сумма (руб)'}
                  {col === 'supplier' && 'Поставщик'}
                  {col === 'status' && 'Статус'}
                  {col === 'actions' && 'Действия'}
                  <div className="resize-handle" onMouseDown={(e) => { e.preventDefault(); startResize(col, e.pageX, columnWidths[col]); }}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={tableBodyRef}>
            {rows.map((row, idx, array) => {
              if (row.type === 'section') {
                return (
                  <React.Fragment key={row.id}>
                    <tr className="spec-section-row" data-id={row.id}>
                      <td className="spec-drag-handle"><i className="fas fa-grip-vertical"></i></td>
                      <td className="checkbox-col"></td>
                      <td colSpan={16} style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <span contentEditable suppressContentEditableWarning onBlur={e => updateSectionTitle(row.id, e.currentTarget.innerText)} style={{ fontWeight: 700, fontSize: '1.2rem' }}>{row.title}</span>
                          </div>
                          <div className="spec-section-actions">
                            <button className="btn-collapse" onClick={() => toggleSection(row.id)} title={row.collapsed ? "Развернуть" : "Свернуть"}>
                              <i className={`fas ${row.collapsed ? 'fa-plus-square' : 'fa-minus-square'}`}></i>
                            </button>
                            <button className="btn-add-row" onClick={() => addDataRowAfterId(row.id)} title="Добавить строку">
                              <i className="fas fa-plus-circle"></i>
                            </button>
                            <button className="btn-delete-section" onClick={() => deleteRow(row.id)} title="Удалить раздел">
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              } else if (row.type === 'data') {
                const visible = isDataRowVisible(row);
                if (visible) dataCounter++;
                const totalRub = getTotalRub(row);
                const sym = currencySymbols[row.currency];
                let sectionCollapsed = false;
                for (let i = idx - 1; i >= 0; i--) {
                  if (array[i].type === 'section') {
                    sectionCollapsed = (array[i] as SectionRow).collapsed;
                    break;
                  }
                }
                if (sectionCollapsed) return null;
                return (
                  <tr key={row.id} className={`spec-data-row ${!visible ? 'spec-filtered-out' : ''}`} data-id={row.id}>
                    <td className="spec-drag-handle"><i className="fas fa-grip-vertical"></i></td>
                    <td className="checkbox-col"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, row.id] : prev.filter(id => id !== row.id))} /></td>
                    <td className="spec-text-center">{visible ? dataCounter : ''}</td>
                    <td className="spec-text-center">
                      <input
                        type="text"
                        value={row.vendor}
                        onChange={e => updateDataField(row.id, 'vendor', e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center' }}
                      />
                    </td>
                    <td className="spec-text-center word-break">
                      <input
                        type="text"
                        value={row.sku}
                        onChange={e => updateDataField(row.id, 'sku', e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center' }}
                      />
                    </td>
                    <td className="word-break">
                      <input
                        type="text"
                        value={row.name}
                        onChange={e => updateDataField(row.id, 'name', e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'left' }}
                      />
                    </td>
                    <td className="spec-text-center">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={e => updateDataField(row.id, 'quantity', parseInt(e.target.value) || 0)}
                        onFocus={(e) => {
                          if (row.quantity === 0) {
                            e.target.select();
                          }
                        }}
                        style={{ width: '100%', textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: 'var(--spec-text-primary)' }}
                      />
                    </td>
                    <td className="spec-text-center">
                      <select
                        value={row.unit}
                        onChange={e => updateDataField(row.id, 'unit', e.target.value)}
                        style={{ width: '100%', textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: 'var(--spec-text-primary)' }}
                      >
                        <option>шт</option><option>м</option><option>уп.</option>
                      </select>
                    </td>
                    <td className="spec-text-center">
                      <select
                        value={row.currency}
                        onChange={e => updateDataField(row.id, 'currency', e.target.value)}
                        style={{ width: '100%', textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: 'var(--spec-text-primary)' }}
                      >
                        {currencies.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="spec-text-right">
                      <input
                        type="number"
                        step="any"
                        value={row.price}
                        onChange={e => updateDataField(row.id, 'price', parseFloat(e.target.value) || 0)}
                        onFocus={(e) => {
                          if (row.price === 0) {
                            e.target.select();
                          }
                        }}
                        style={{ width: '100%', textAlign: 'right', background: 'transparent', border: 'none', outline: 'none', color: 'var(--spec-text-primary)' }}
                      />
                    </td>
                    <td className="spec-text-center">
                      <input
                        type="number"
                        step="any"
                        value={row.discount}
                        onChange={e => updateDataField(row.id, 'discount', parseFloat(e.target.value) || 0)}
                        onFocus={(e) => {
                          if (row.discount === 0) {
                            e.target.select();
                          }
                        }}
                        style={{ width: '100%', textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: 'var(--spec-text-primary)' }}
                      />
                    </td>
                    <td className="spec-text-right readonly-cell">{sym} {formatNumber(row.discountAmount)}</td>
                    <td className="spec-text-right readonly-cell">{sym} {formatNumber(row.priceAfter)}</td>
                    <td className="spec-text-right readonly-cell">{formatNumber(totalRub)} ₽</td>
                    <td className="spec-text-center">
                      <input
                        type="text"
                        value={row.supplier}
                        onChange={e => updateDataField(row.id, 'supplier', e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center' }}
                      />
                    </td>
                    <td className="spec-text-center">
                      <select
                        value={row.status}
                        onChange={e => updateDataField(row.id, 'status', e.target.value)}
                        style={{ width: '100%', textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: 'var(--spec-text-primary)' }}
                      >
                        {statuses.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="spec-action-buttons">
                      <button className="btn-add-row" onClick={() => addDataRowAfterId(row.id)} title="Добавить строку ниже"><i className="fas fa-plus-circle"></i></button>
                      <button className="btn-duplicate-row" onClick={() => duplicateRow(row.id)} title="Дублировать строку"><i className="fas fa-copy"></i></button>
                      <button className="btn-delete-row" onClick={() => deleteRow(row.id)} title="Удалить строку"><i className="fas fa-trash-alt"></i></button>
                    </td>
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
