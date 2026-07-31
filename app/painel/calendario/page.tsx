import { createClient } from '@/lib/supabase/server';
import { MonthNav } from '@/components/MonthNav';
import { ChecklistClient } from '@/components/ChecklistClient';
import { todayYM, vencimentoDAS, fmtDate, monthLabel } from '@/lib/simplesNacional';

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayYM();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: chkData } = await supabase
    .from('checklist_mensal')
    .select('nf, pgdas, pago')
    .eq('user_id', user!.id)
    .eq('mes', mes)
    .maybeSingle();

  const chk = chkData || { nf: false, pgdas: false, pago: false };
  const venc = await vencimentoDAS(mes);

  return (
    <>
      <MonthNav />
      <div className="eyebrow">Obrigações de {monthLabel(mes)}</div>
      <ChecklistClient mes={mes} initial={chk} vencDate={venc.toISOString()} />

      <div style={{ marginTop: 20 }}>
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
      </div>

      <div className="rule" />
      <div className="eyebrow">Obrigações anuais</div>
      <ul className="task-list">
        <li>
          <strong>DEFIS</strong> — declaração anual do Simples Nacional, até 31 de março.
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
