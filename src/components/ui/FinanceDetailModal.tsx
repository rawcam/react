// src/components/ui/FinanceDetailModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../App';
import { withAuthRetry } from '../../utils/supabaseHelpers';
import './FinanceDetailModal.css';

interface FinanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  title: string;
  dateRange: { start: string; end: string };
}

export const FinanceDetailModal: React.FC<FinanceDetailModalProps> = ({
  isOpen, onClose, category, title, dateRange
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    withAuthRetry<any[]>(async () => {
      const { data, error } = await supabase
        .from('finance_1c')
        .select('*')
        .eq('category', category)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });
      return { data: data as any[] | null, error };
    })
      .then(data => setTransactions(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, category, dateRange]);

  if (!isOpen) return null;

  const formatAmount = (amount: number) => amount.toLocaleString('ru-RU') + ' ₽';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p>Загрузка...</p>
          ) : transactions.length === 0 ? (
            <p>Нет операций за выбранный период.</p>
          ) : (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Описание</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString('ru-RU')}</td>
                    <td>{t.description}</td>
                    <td>{formatAmount(t.amount)}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
