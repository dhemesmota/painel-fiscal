'use client';
import { useTransition, useState } from 'react';
import { saveEmpresa } from '@/app/painel/actions';
import type { Empresa } from '@/lib/types';

interface Props {
  empresa: Partial<Empresa>;
}

type FormState = Omit<Empresa, 'id' | 'user_id'>;

function emptyForm(e: Partial<Empresa>): FormState {
  return {
    razao_social: e.razao_social || '',
    nome_fantasia: e.nome_fantasia || '',
    cnpj: e.cnpj || '',
    inscricao_municipal: e.inscricao_municipal || '',
    municipio_incidencia: e.municipio_incidencia || '',
    aliquota_iss: e.aliquota_iss ?? 0,
    atividade: e.atividade || '',
    data_abertura: e.data_abertura || '',
    endereco: e.endereco || '',
    telefone: e.telefone || '',
    email: e.email || '',
  };
}

// Resposta da BrasilAPI (https://brasilapi.com.br/docs#tag/CNPJ) — só os campos usados aqui.
interface BrasilApiCnpj {
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  data_inicio_atividade?: string;
  descricao_tipo_de_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
  message?: string;
}

export function EmpresaForm({ empresa: e }: Props) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm(e));
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(formData: FormData) {
    setSaved(false);
    setError('');
    startTransition(async () => {
      try {
        await saveEmpresa(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar os dados.');
      }
    });
  }

  async function buscarCnpj() {
    const digits = form.cnpj.replace(/\D/g, '');
    if (digits.length !== 14) {
      setError('Informe um CNPJ válido (14 dígitos) para buscar.');
      return;
    }
    setBuscandoCnpj(true);
    setError('');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      const data: BrasilApiCnpj = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'CNPJ não encontrado na Receita Federal.');
      }
      const endereco = [
        [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' '),
        data.numero,
        data.complemento,
        data.bairro,
        data.municipio && data.uf ? `${data.municipio} - ${data.uf}` : undefined,
        data.cep ? `CEP ${data.cep}` : undefined,
      ]
        .filter(Boolean)
        .join(', ');

      setForm(prev => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
        atividade: data.cnae_fiscal
          ? `${data.cnae_fiscal} - ${data.cnae_fiscal_descricao || ''}`
          : prev.atividade,
        data_abertura: data.data_inicio_atividade || prev.data_abertura,
        endereco: endereco || prev.endereco,
        telefone: data.ddd_telefone_1 || prev.telefone,
        email: data.email || prev.email,
        municipio_incidencia: data.municipio && data.uf ? `${data.municipio} (${data.uf})` : prev.municipio_incidencia,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível consultar o CNPJ agora.');
    } finally {
      setBuscandoCnpj(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="form-grid">
        <label>
          Razão social *
          <input
            name="razao_social"
            value={form.razao_social}
            onChange={ev => setField('razao_social', ev.target.value)}
            required
          />
        </label>
        <label>
          Nome fantasia
          <input
            name="nome_fantasia"
            value={form.nome_fantasia}
            onChange={ev => setField('nome_fantasia', ev.target.value)}
          />
        </label>
        <label>
          CNPJ *
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              name="cnpj"
              value={form.cnpj}
              onChange={ev => setField('cnpj', ev.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button
              type="button"
              className="btn"
              onClick={buscarCnpj}
              disabled={buscandoCnpj}
              style={{ whiteSpace: 'nowrap' }}
            >
              {buscandoCnpj ? 'Buscando…' : 'Buscar CNPJ'}
            </button>
          </div>
        </label>
        <label>
          Inscrição municipal
          <input
            name="inscricao_municipal"
            value={form.inscricao_municipal}
            onChange={ev => setField('inscricao_municipal', ev.target.value)}
          />
        </label>
        <label>
          Município de incidência do ISS
          <input
            name="municipio_incidencia"
            value={form.municipio_incidencia}
            onChange={ev => setField('municipio_incidencia', ev.target.value)}
          />
        </label>
        <label>
          Alíquota ISS local (%)
          <input
            type="number"
            step="0.1"
            name="aliquota_iss"
            value={form.aliquota_iss}
            onChange={ev => setField('aliquota_iss', Number(ev.target.value))}
          />
        </label>
        <label className="full">
          Atividade
          <input
            name="atividade"
            value={form.atividade}
            onChange={ev => setField('atividade', ev.target.value)}
          />
        </label>
        <label>
          Data de abertura do CNPJ
          <input
            type="date"
            name="data_abertura"
            value={form.data_abertura}
            onChange={ev => setField('data_abertura', ev.target.value)}
          />
        </label>
        <label className="full">
          Endereço
          <input
            name="endereco"
            value={form.endereco}
            onChange={ev => setField('endereco', ev.target.value)}
          />
        </label>
        <label>
          Telefone
          <input
            name="telefone"
            value={form.telefone}
            onChange={ev => setField('telefone', ev.target.value)}
          />
        </label>
        <label>
          E-mail
          <input
            name="email"
            value={form.email}
            onChange={ev => setField('email', ev.target.value)}
          />
        </label>
      </div>
      <p className="text-muted small">
        * Campos obrigatórios. A data de abertura ajuda a calcular o RBT12 corretamente nos primeiros
        12 meses de empresa (regra proporcional do Simples Nacional). Use "Buscar CNPJ" para preencher
        os dados automaticamente a partir da Receita Federal (BrasilAPI) — confira antes de salvar.
      </p>
      {error && <p className="warn" role="alert">{error}</p>}
      {saved && <p className="success-text" role="status">Dados salvos com sucesso.</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar dados'}
      </button>
    </form>
  );
}
