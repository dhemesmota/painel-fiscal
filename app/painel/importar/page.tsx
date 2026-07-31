import { ImportarForm } from '@/components/ImportarForm';

export default function ImportarPage() {
  return (
    <>
      <div className="eyebrow">Importar documento (NFS-e, guia do DAS ou Cartão CNPJ)</div>
      <p className="text-muted">
        Envie o PDF e a IA extrai os dados automaticamente. Confira antes de salvar.
      </p>
      <ImportarForm />
    </>
  );
}
