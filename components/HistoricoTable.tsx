'use client';
import { useState, useTransition } from 'react';
import { setHistorico } from '@/app/painel/actions';
import { monthLabelShort } from '@/lib/simplesNacional';

interface HistRow {
  mes: string;
  val: number;
  tag: string;
  isCurrent: boolean;
}

interface Props {
  rows: HistRow[];
}

export function HistoricoTable({ rows }: Props) {
  const [, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(mes: string, value: string) {
    const num = parseFloat(value) || 0;
    setErrors(prev => ({ ...prev, [mes]: '' }));
    startTransition(async () => {
      try {
        await setHistorico(mes, num);
      } catch (e) {
        setErrors(prev => ({
          ...prev,
          [mes]: e instanceof Error ? e.message : 'Erro ao salvar.',
        }));
      }
    });
  }

  return (
    <div className="hist-table">
      {rows.map(row => (
        <div key={row.mes} className={`hist-row${row.isCurrent ? ' current' : ''}`}>
          <span className="hist-month">{monthLabelShort(row.mes)}</span>
          <input
            type="number"
            step="0.01"
            defaultValue={row.val.toFixed(2)}
            onBlur={e => handleChange(row.mes, e.target.value)}
          />
          <span className="hist-tag">{row.tag}</span>
          {errors[row.mes] && <span className="warn">{errors[row.mes]}</span>}
        </div>
      ))}
    </div>
  );
}
