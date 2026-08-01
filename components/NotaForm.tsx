'use client';
import { useRef, useState, useTransition } from 'react';
import { addNota, removeNota } from '@/app/painel/actions';
import { fmt, fmtDateBR } from '@/lib/simplesNacional';
import { TrashIcon } from '@/components/icons';
import type { NotaFiscal } from '@/lib/types';

interface Props {
  mes: string;
  notas: NotaFiscal[];
}

export function NotaForm({ mes, notas }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const total = notas.reduce((s, n) => s + Number(n.valor), 0);

  function handleAdd(formData: FormData) {
    setError('');
    startTransition(async () => {
      try {
        await addNota(formData);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao lançar a nota.');
      }
    });
  }

  function handleRemove(id: string, numero: string | null) {
    const label = numero ? `a nota ${numero}` : 'esta nota';
    if (!window.confirm(`Remover ${label}? Isso não pode ser desfeito.`)) return;
    setError('');
    startTransition(async () => {
      try {
        await removeNota(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao remover a nota.');
      }
    });
  }

  return (
    <>
      {notas.length === 0 ? (
        <p className="text-muted">Nenhuma nota lançada ainda neste mês.</p>
      ) : (
        notas.map(n => (
          <div key={n.id} className="nota-row">
            <div>
              <strong>NF {n.numero || '-'}</strong> · {fmtDateBR(n.data_emissao)}<br />
              <span className="text-muted">{n.tomador}</span>
            </div>
            <div className="nota-valor">
              {fmt(n.valor)}
              <button
                type="button"
                className="icon-btn"
                onClick={() => handleRemove(n.id, n.numero)}
                disabled={pending}
                aria-label={`Remover nota ${n.numero || ''}`}
              >
                <TrashIcon width={14} height={14} />
              </button>
            </div>
          </div>
        ))
      )}
      <div className="kv-row total">
        <span>Total do mês</span>
        <strong>{fmt(total)}</strong>
      </div>
      {notas.length >= 2 && <p className="warn" role="alert">Você já tem 2 notas neste mês.</p>}

      <div className="rule" />
      <h2 className="eyebrow">Lançar nova nota</h2>
      <form ref={formRef} action={handleAdd}>
        <div className="form-grid">
          <label>
            Data
            <input type="date" name="data_emissao" defaultValue={`${mes}-01`} required />
          </label>
          <label>
            Número NF
            <input type="text" name="numero" placeholder="ex: 38" />
          </label>
          <label>
            Tomador
            <input type="text" name="tomador" placeholder="Nome do cliente" />
          </label>
          <label>
            Valor (R$)
            <input type="number" step="0.01" name="valor" placeholder="0,00" required min="0.01" />
          </label>
          <label className="full">
            Descrição do serviço
            <input type="text" name="descricao" placeholder="ex: Manutenção de sistema" />
          </label>
        </div>
        {error && <p className="warn" role="alert">{error}</p>}
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Lançando…' : 'Lançar nota'}
        </button>
      </form>
    </>
  );
}
