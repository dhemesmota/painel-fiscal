'use client';
import { useRef, useTransition } from 'react';
import { addNota, removeNota } from '@/app/painel/actions';
import { fmt, fmtDateBR } from '@/lib/simplesNacional';
import type { NotaFiscal } from '@/lib/types';

interface Props {
  mes: string;
  notas: NotaFiscal[];
}

export function NotaForm({ mes, notas }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const total = notas.reduce((s, n) => s + Number(n.valor), 0);

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addNota(formData);
      formRef.current?.reset();
    });
  }

  function handleRemove(id: string) {
    startTransition(() => removeNota(id));
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
                className="icon-btn"
                onClick={() => handleRemove(n.id)}
                disabled={pending}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
      <div className="kv-row total">
        <span>Total do mês</span>
        <strong>{fmt(total)}</strong>
      </div>
      {notas.length >= 2 && <p className="warn">Você já tem 2 notas neste mês.</p>}

      <div className="rule" />
      <div className="eyebrow">Lançar nova nota</div>
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
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Lançando…' : 'Lançar nota'}
        </button>
      </form>
    </>
  );
}
