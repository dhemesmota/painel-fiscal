'use client';
import { useState } from 'react';
import { ObrigacaoStep } from '@/components/ObrigacaoStep';
import { fmt, fmtDate, monthLabel, monthLabelTitle } from '@/lib/simplesNacional';

interface Nota {
  numero: string | null;
  tomador: string | null;
  valor: number;
}

interface Props {
  mes: string;
  notasMes: Nota[];
  revenue: number;
  calcErro: boolean;
  calcTotal: number;
  vencIso: string;
  chk: { nf: boolean; pgdas: boolean; pago: boolean };
  inscricaoMunicipal: string | null;
}

type Cenario = 'com_nf' | 'sem_nf';

export function GuiaWizard({
  mes, notasMes, revenue, calcErro, calcTotal, vencIso, chk, inscricaoMunicipal,
}: Props) {
  const [cenario, setCenario] = useState<Cenario>(notasMes.length > 0 ? 'com_nf' : 'sem_nf');
  const venc = new Date(vencIso);

  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Qual é a situação de {monthLabel(mes)}?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn${cenario === 'com_nf' ? '' : ' ghost'}`}
          onClick={() => setCenario('com_nf')}
        >
          Gerei nota fiscal este mês
        </button>
        <button
          type="button"
          className={`btn${cenario === 'sem_nf' ? '' : ' ghost'}`}
          onClick={() => setCenario('sem_nf')}
        >
          Não gerei nota fiscal este mês
        </button>
      </div>

      {cenario === 'com_nf' ? (
        <>
          <ObrigacaoStep numero={1} titulo="Emitir as notas fiscais" mes={mes} field="nf" checked={chk.nf}>
            {notasMes.length > 0 ? (
              <>
                <p>
                  Você já lançou {notasMes.length} nota(s) neste painel para {monthLabel(mes)}, somando{' '}
                  <strong>{fmt(revenue)}</strong>. Confirme que elas foram <strong>de fato emitidas</strong> no
                  portal — lançar aqui só registra pro cálculo, não emite lá:
                </p>
                <ul className="task-list">
                  {notasMes.map((n, i) => (
                    <li key={i}>NF {n.numero || '—'} · {n.tomador || 'sem tomador informado'} · {fmt(Number(n.valor))}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                Ainda não lançou nenhuma nota neste painel para {monthLabel(mes)}. Emita no portal e depois
                lance aqui (aba Notas Fiscais) pra manter o cálculo do DAS atualizado.
              </p>
            )}
            <ol className="steps">
              <li>
                Acesse{' '}
                <a href="https://iss.fazenda.df.gov.br/online/" target="_blank" rel="noreferrer">
                  iss.fazenda.df.gov.br/online
                </a>{' '}
                e entre com certificado digital ou conta gov.br.
              </li>
              <li>Abra uma nova DPS (Declaração de Prestação de Serviços).</li>
              <li>
                Informe o tomador, a descrição do serviço e o valor
                {inscricaoMunicipal ? ` (sua inscrição municipal cadastrada: ${inscricaoMunicipal})` : ''}.
              </li>
              <li>Confirme — o sistema emite a NFS-e automaticamente. Baixe o PDF e envie ao cliente.</li>
            </ol>
          </ObrigacaoStep>

          <ObrigacaoStep numero={2} titulo="Enviar o PGDAS-D" mes={mes} field="pgdas" checked={chk.pgdas}>
            {calcErro ? (
              <p>Receita acumulada acima do limite do Simples Nacional. Procure um contador para orientação antes de declarar.</p>
            ) : (
              <p>
                Para a competência <strong>{monthLabelTitle(mes)}</strong>, informe receita bruta de{' '}
                <strong>{fmt(revenue)}</strong> no campo correspondente do PGDAS-D.
              </p>
            )}
            <ol className="steps">
              <li>
                Acesse o{' '}
                <a href="https://www8.receita.fazenda.gov.br/SimplesNacional/" target="_blank" rel="noreferrer">
                  Portal do Simples Nacional
                </a>{' '}
                e entre em &quot;PGDAS-D e DEFIS&quot;.
              </li>
              <li>
                Selecione o período de apuração: <strong>{monthLabelTitle(mes)}</strong>.
              </li>
              <li>
                No campo de receita bruta do mês, digite exatamente <strong>{fmt(revenue)}</strong>.
              </li>
              <li>Confirme as demais informações e transmita a declaração.</li>
            </ol>
          </ObrigacaoStep>

          <ObrigacaoStep numero={3} titulo="Pagar o DAS" mes={mes} field="pago" checked={chk.pago}>
            {!calcErro && (
              <p>
                DAS estimado para esta competência: <strong>{fmt(calcTotal)}</strong> (o valor oficial é o que
                o PGDAS-D gerar). Vencimento: <strong>{fmtDate(venc)}</strong> — já ajustado para pular fins de
                semana e feriados nacionais.
              </p>
            )}
            <ol className="steps">
              <li>Depois de transmitir o PGDAS-D, o sistema gera o DAS automaticamente.</li>
              <li>Baixe o PDF da guia ou copie o código Pix.</li>
              <li>
                Pague até <strong>{fmtDate(venc)}</strong> (Pix ou boleto).
              </li>
            </ol>
          </ObrigacaoStep>
        </>
      ) : (
        <>
          <ObrigacaoStep numero={1} titulo="Nenhuma nota fiscal para emitir" mes={mes} field="nf" checked={chk.nf}>
            <p>
              Você não prestou serviço (ou optou por não faturar) em {monthLabel(mes)}. Não há nada a emitir
              no portal da NFS-e este mês — mas a obrigação de declarar continua (próxima etapa).
            </p>
          </ObrigacaoStep>

          <ObrigacaoStep numero={2} titulo="Enviar o PGDAS-D com receita zerada" mes={mes} field="pgdas" checked={chk.pgdas}>
            <p>
              Mesmo sem movimento, a competência <strong>{monthLabelTitle(mes)}</strong> precisa ser transmitida
              no PGDAS-D informando receita bruta de <strong>R$ 0,00</strong> — é isso que formaliza a
              &quot;declaração sem movimento&quot; junto ao Simples Nacional.
            </p>
            <ol className="steps">
              <li>
                Acesse o{' '}
                <a href="https://www8.receita.fazenda.gov.br/SimplesNacional/" target="_blank" rel="noreferrer">
                  Portal do Simples Nacional
                </a>{' '}
                e entre em &quot;PGDAS-D e DEFIS&quot;.
              </li>
              <li>
                Selecione o período de apuração: <strong>{monthLabelTitle(mes)}</strong>.
              </li>
              <li>
                No campo de receita bruta do mês, digite <strong>R$ 0,00</strong> (zerado).
              </li>
              <li>Confirme as demais informações e transmita a declaração.</li>
            </ol>
          </ObrigacaoStep>

          <ObrigacaoStep numero={3} titulo="Nada a pagar — só confirme a transmissão" mes={mes} field="pago" checked={chk.pago}>
            <p>
              Com receita zerada, o DAS gerado é <strong>R$ 0,00</strong> — não há pagamento a fazer. Ainda
              assim, confira no Portal do Simples Nacional que a declaração sem movimento de{' '}
              <strong>{monthLabelTitle(mes)}</strong> foi transmitida com sucesso, antes do prazo de{' '}
              <strong>{fmtDate(venc)}</strong>.
            </p>
          </ObrigacaoStep>
        </>
      )}
    </>
  );
}
