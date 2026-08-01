'use client';
import { useRef, useState, useTransition } from 'react';
import { addNota, toggleCheck, saveEmpresa } from '@/app/painel/actions';

interface Extraido {
  tipo: 'nota_fiscal' | 'guia_das' | 'cartao_cnpj' | 'desconhecido';
  competencia: string;
  data_documento: string;
  numero_documento: string;
  tomador_ou_razao_social: string;
  nome_fantasia: string;
  valor: number;
  descricao_ou_atividade: string;
  cnpj: string;
  inscricao_municipal: string;
  endereco: string;
  telefone: string;
  email: string;
  data_abertura: string;
  aliquota_iss: number;
}

const TIPO_LABEL: Record<Extraido['tipo'], string> = {
  nota_fiscal: 'Nota fiscal (NFS-e)',
  guia_das: 'Guia do DAS',
  cartao_cnpj: 'Cartão CNPJ',
  desconhecido: 'Documento não identificado',
};

export function ImportarForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Extraido | null>(null);
  const [saved, setSaved] = useState('');
  const [, startTransition] = useTransition();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSaved('');
    setData(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch('/api/importar', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao processar o documento.');
      setData(json.extraido as Extraido);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o documento.');
    } finally {
      setUploading(false);
    }
  }

  function setField<K extends keyof Extraido>(field: K, value: Extraido[K]) {
    setData(prev => (prev ? { ...prev, [field]: value } : prev));
  }

  function lancarNota() {
    if (!data) return;
    const fd = new FormData();
    fd.set('data_emissao', data.data_documento);
    fd.set('numero', data.numero_documento);
    fd.set('tomador', data.tomador_ou_razao_social);
    fd.set('valor', String(data.valor));
    fd.set('descricao', data.descricao_ou_atividade);
    startTransition(async () => {
      try {
        await addNota(fd);
        setSaved('Nota lançada com sucesso.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao lançar a nota.');
      }
    });
  }

  function marcarChecklist(field: 'pgdas' | 'pago') {
    if (!data || !data.competencia) return;
    startTransition(async () => {
      try {
        await toggleCheck(data.competencia, field, true);
        setSaved(`Checklist de ${data.competencia} atualizado.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar o checklist.');
      }
    });
  }

  function salvarEmpresa() {
    if (!data) return;
    const fd = new FormData();
    fd.set('razao_social', data.tomador_ou_razao_social);
    fd.set('nome_fantasia', data.nome_fantasia);
    fd.set('cnpj', data.cnpj);
    fd.set('inscricao_municipal', data.inscricao_municipal);
    fd.set('municipio_incidencia', '');
    fd.set('aliquota_iss', String(data.aliquota_iss));
    fd.set('atividade', data.descricao_ou_atividade);
    fd.set('data_abertura', data.data_abertura);
    fd.set('endereco', data.endereco);
    fd.set('telefone', data.telefone);
    fd.set('email', data.email);
    startTransition(async () => {
      try {
        await saveEmpresa(fd);
        setSaved('Dados da empresa salvos.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar os dados da empresa.');
      }
    });
  }

  return (
    <>
      <form onSubmit={handleUpload}>
        <div className="form-grid">
          <label className="full">
            Arquivo PDF (NFS-e, guia do DAS ou Cartão CNPJ)
            <input ref={inputRef} type="file" accept="application/pdf" required />
          </label>
        </div>
        <button type="submit" className="btn" disabled={uploading}>
          {uploading ? 'Analisando…' : 'Extrair dados'}
        </button>
      </form>

      {error && <p className="warn" role="alert">{error}</p>}
      {saved && <p className="success-text" role="status">{saved}</p>}

      {data && (
        <>
          <div className="rule" />
          <h2 className="eyebrow">{TIPO_LABEL[data.tipo]} — confira antes de salvar</h2>

          {data.tipo === 'nota_fiscal' && (
            <div className="form-grid">
              <label>
                Data de emissão
                <input type="date" value={data.data_documento} onChange={e => setField('data_documento', e.target.value)} />
              </label>
              <label>
                Número NF
                <input value={data.numero_documento} onChange={e => setField('numero_documento', e.target.value)} />
              </label>
              <label>
                Tomador
                <input value={data.tomador_ou_razao_social} onChange={e => setField('tomador_ou_razao_social', e.target.value)} />
              </label>
              <label>
                Valor (R$)
                <input type="number" step="0.01" value={data.valor} onChange={e => setField('valor', Number(e.target.value))} />
              </label>
              <label className="full">
                Descrição
                <input value={data.descricao_ou_atividade} onChange={e => setField('descricao_ou_atividade', e.target.value)} />
              </label>
            </div>
          )}

          {data.tipo === 'guia_das' && (
            <div className="form-grid">
              <label>
                Competência (YYYY-MM)
                <input value={data.competencia} onChange={e => setField('competencia', e.target.value)} />
              </label>
              <label>
                Valor do DAS (R$)
                <input type="number" step="0.01" value={data.valor} onChange={e => setField('valor', Number(e.target.value))} />
              </label>
            </div>
          )}

          {data.tipo === 'cartao_cnpj' && (
            <div className="form-grid">
              <label>
                Razão social
                <input value={data.tomador_ou_razao_social} onChange={e => setField('tomador_ou_razao_social', e.target.value)} />
              </label>
              <label>
                Nome fantasia
                <input value={data.nome_fantasia} onChange={e => setField('nome_fantasia', e.target.value)} />
              </label>
              <label>
                CNPJ
                <input value={data.cnpj} onChange={e => setField('cnpj', e.target.value)} />
              </label>
              <label>
                Inscrição municipal
                <input value={data.inscricao_municipal} onChange={e => setField('inscricao_municipal', e.target.value)} />
              </label>
              <label className="full">
                Atividade
                <input value={data.descricao_ou_atividade} onChange={e => setField('descricao_ou_atividade', e.target.value)} />
              </label>
              <label>
                Data de abertura
                <input type="date" value={data.data_abertura} onChange={e => setField('data_abertura', e.target.value)} />
              </label>
              <label className="full">
                Endereço
                <input value={data.endereco} onChange={e => setField('endereco', e.target.value)} />
              </label>
              <label>
                Telefone
                <input value={data.telefone} onChange={e => setField('telefone', e.target.value)} />
              </label>
              <label>
                E-mail
                <input value={data.email} onChange={e => setField('email', e.target.value)} />
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {data.tipo === 'nota_fiscal' && (
              <button type="button" className="btn" onClick={lancarNota}>Lançar nota</button>
            )}
            {data.tipo === 'guia_das' && (
              <>
                <button type="button" className="btn" onClick={() => marcarChecklist('pgdas')}>Marcar PGDAS-D enviado</button>
                <button type="button" className="btn" onClick={() => marcarChecklist('pago')}>Marcar DAS pago</button>
              </>
            )}
            {data.tipo === 'cartao_cnpj' && (
              <button type="button" className="btn" onClick={salvarEmpresa}>Salvar dados da empresa</button>
            )}
            {data.tipo === 'desconhecido' && (
              <p className="text-muted">Não consegui identificar o tipo de documento. Confira manualmente nas outras abas.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
