'use client';
import { useRef, useState, useTransition } from 'react';
import { setHistorico } from '@/app/painel/actions';
import { fmt, monthLabelShort } from '@/lib/simplesNacional';

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
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function handleBlur(row: HistRow, value: string) {
    const num = parseFloat(value) || 0;
    if (num === row.val) return; // nada mudou, não precisa confirmar nem salvar

    const ok = window.confirm(
      `Alterar o faturamento de ${monthLabelShort(row.mes)} de ${fmt(row.val)} para ${fmt(num)}? ` +
      'Isso muda o cálculo do RBT12 e a estimativa de imposto para esse e outros meses.'
    );
    if (!ok) {
      const el = inputRefs.current[row.mes];
      if (el) el.value = row.val.toFixed(2);
      return;
    }

    setErrors(prev => ({ ...prev, [row.mes]: '' }));
    startTransition(async () => {
      try {
        await setHistorico(row.mes, num);
      } catch (e) {
        setErrors(prev => ({
          ...prev,
          [row.mes]: e instanceof Error ? e.message : 'Erro ao salvar.',
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
            ref={el => { inputRefs.current[row.mes] = el; }}
            type="number"
            step="0.01"
            defaultValue={row.val.toFixed(2)}
            onBlur={e => handleBlur(row, e.target.value)}
            aria-label={`Faturamento de ${monthLabelShort(row.mes)}`}
          />
          <span className="hist-tag">{row.tag}</span>
          {errors[row.mes] && <span className="warn" role="alert">{errors[row.mes]}</span>}
        </div>
      ))}
    </div>
  );
}
