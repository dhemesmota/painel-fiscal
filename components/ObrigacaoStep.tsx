'use client';
import { useState, useTransition } from 'react';
import { toggleCheck } from '@/app/painel/actions';

interface Props {
  numero: number;
  titulo: string;
  mes: string;
  field: 'nf' | 'pgdas' | 'pago';
  checked: boolean;
  children: React.ReactNode;
}

export function ObrigacaoStep({ numero, titulo, mes, field, checked: initial, children }: Props) {
  const [checked, setChecked] = useState(initial);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  function toggle() {
    const newVal = !checked;
    const prev = checked;
    setChecked(newVal);
    setError('');
    startTransition(async () => {
      try {
        await toggleCheck(mes, field, newVal);
      } catch (e) {
        setChecked(prev);
        setError(e instanceof Error ? e.message : 'Erro ao salvar.');
      }
    });
  }

  return (
    <div className={`obrigacao-step${checked ? ' done' : ''}`}>
      <div className="obrigacao-step-header">
        <span className="obrigacao-step-num">{checked ? '✓' : numero}</span>
        <strong>{titulo}</strong>
        <label className="obrigacao-step-toggle">
          <input type="checkbox" checked={checked} onChange={toggle} />
          {checked ? 'Feito' : 'Marcar como feito'}
        </label>
      </div>
      <div className="obrigacao-step-body">{children}</div>
      {error && <p className="warn">{error}</p>}
    </div>
  );
}
