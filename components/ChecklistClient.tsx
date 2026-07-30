'use client';
import { useState, useTransition } from 'react';
import { toggleCheck } from '@/app/painel/actions';
import { fmtDate, daysUntil } from '@/lib/simplesNacional';

interface Props {
  mes: string;
  initial: { nf: boolean; pgdas: boolean; pago: boolean };
  vencDate: string; // ISO string of the vencimento date
}

export function ChecklistClient({ mes, initial, vencDate }: Props) {
  const [state, setState] = useState(initial);
  const [, startTransition] = useTransition();
  const venc = new Date(vencDate);
  const dleft = daysUntil(venc);

  function toggle(field: 'nf' | 'pgdas' | 'pago') {
    const newVal = !state[field];
    setState(prev => ({ ...prev, [field]: newVal }));
    startTransition(() => {
      toggleCheck(mes, field, newVal);
    });
  }

  return (
    <>
      <div className="check-row">
        <input type="checkbox" checked={state.nf} onChange={() => toggle('nf')} />
        <div>
          <strong>Notas fiscais emitidas</strong><br />
          <span className="text-muted">Emita na NFS-e até o fim da competência</span>
        </div>
      </div>
      <div className="check-row">
        <input type="checkbox" checked={state.pgdas} onChange={() => toggle('pgdas')} />
        <div>
          <strong>PGDAS-D enviado (gera o DAS)</strong><br />
          <span className="text-muted">No Portal do Simples Nacional, até o dia 20</span>
        </div>
      </div>
      <div className="check-row">
        <input type="checkbox" checked={state.pago} onChange={() => toggle('pago')} />
        <div>
          <strong>DAS pago</strong><br />
          <span className="text-muted">
            Vencimento {fmtDate(venc)}
            {dleft >= 0 ? ` · faltam ${dleft} dia(s)` : ` · venceu há ${-dleft} dia(s)`}
          </span>
        </div>
      </div>
    </>
  );
}
