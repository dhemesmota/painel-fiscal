import Link from 'next/link';
import { MonthNav } from '@/components/MonthNav';
import { DEFIS_AVISO_PRORROGACAO } from '@/lib/obrigacoes';
import { todayYM, vencimentoDAS, fmtDate, monthLabel } from '@/lib/simplesNacional';

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayYM();

  const venc = await vencimentoDAS(mes);

  return (
    <>
      <MonthNav />
      <div className="eyebrow">Obrigações de {monthLabel(mes)}</div>
      <ul className="task-list">
        <li>
          <strong>Emitir as notas fiscais</strong> dos serviços prestados no mês, no portal da NFS-e do DF.
        </li>
        <li>
          <strong>Enviar o PGDAS-D</strong> informando a receita do mês — isso gera o DAS.
          Prazo: {fmtDate(venc)}.
        </li>
        <li>
          <strong>Pagar o DAS</strong> até {fmtDate(venc)} (Pix ou boleto).
        </li>
      </ul>
      <Link href={`/painel/guia?mes=${mes}`} className="btn" style={{ display: 'inline-block', marginTop: 12 }}>
        Marcar como feito no Guia
      </Link>

      <div className="rule" />
      <div className="eyebrow">Obrigações anuais</div>
      <ul className="task-list">
        <li>
          <strong>DEFIS</strong> — declaração anual do Simples Nacional, até 31 de março.
          <span className="text-muted small" style={{ display: 'block' }}>{DEFIS_AVISO_PRORROGACAO}</span>
        </li>
        <li>
          <strong>Livro Caixa</strong> — manter o registro de entradas e saídas atualizado (substitui
          a contabilidade completa para ME/EPP do Simples Nacional).
        </li>
        <li>
          <strong>Certidões e pendências</strong> — acompanhar a caixa de mensagens do Domicílio
          Tributário Eletrônico para não perder avisos que possam levar à exclusão do Simples Nacional.
        </li>
      </ul>
    </>
  );
}
