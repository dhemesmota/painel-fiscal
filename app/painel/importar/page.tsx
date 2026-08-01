import { ImportarForm } from '@/components/ImportarForm';

export default function ImportarPage() {
  return (
    <>
      <h1 className="page-title">Importar documento</h1>
      <p className="text-muted">
        Envie o PDF de uma NFS-e, guia do DAS ou Cartão CNPJ e a IA extrai os dados automaticamente.
        Confira antes de salvar.
      </p>
      <ImportarForm />
    </>
  );
}
