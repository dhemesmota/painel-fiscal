'use client';
import { useTransition, useState } from 'react';
import { saveEmpresa } from '@/app/painel/actions';
import type { Empresa } from '@/lib/types';

interface Props {
  empresa: Partial<Empresa>;
}

export function EmpresaForm({ empresa: e }: Props) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await saveEmpresa(formData);
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit}>
      <div className="form-grid">
        <label>
          Razão social
          <input name="razao_social" defaultValue={e.razao_social || ''} />
        </label>
        <label>
          Nome fantasia
          <input name="nome_fantasia" defaultValue={e.nome_fantasia || ''} />
        </label>
        <label>
          CNPJ
          <input name="cnpj" defaultValue={e.cnpj || ''} />
        </label>
        <label>
          Inscrição municipal
          <input name="inscricao_municipal" defaultValue={e.inscricao_municipal || ''} />
        </label>
        <label>
          Município de incidência do ISS
          <input name="municipio_incidencia" defaultValue={e.municipio_incidencia || ''} />
        </label>
        <label>
          Alíquota ISS local (%)
          <input type="number" step="0.1" name="aliquota_iss" defaultValue={e.aliquota_iss ?? 0} />
        </label>
        <label className="full">
          Atividade
          <input name="atividade" defaultValue={e.atividade || ''} />
        </label>
        <label>
          Data de abertura do CNPJ
          <input type="date" name="data_abertura" defaultValue={e.data_abertura || ''} />
        </label>
        <label className="full">
          Endereço
          <input name="endereco" defaultValue={e.endereco || ''} />
        </label>
        <label>
          Telefone
          <input name="telefone" defaultValue={e.telefone || ''} />
        </label>
        <label>
          E-mail
          <input name="email" defaultValue={e.email || ''} />
        </label>
      </div>
      <p className="text-muted small">
        A data de abertura ajuda a calcular o RBT12 corretamente nos primeiros 12 meses de empresa
        (regra proporcional do Simples Nacional).
      </p>
      {saved && (
        <p style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600, margin: '8px 0' }}>
          Dados salvos com sucesso.
        </p>
      )}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar dados'}
      </button>
    </form>
  );
}
