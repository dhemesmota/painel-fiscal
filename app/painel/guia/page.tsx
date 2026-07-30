export default function GuiaPage() {
  return (
    <>
      <div className="eyebrow">Passo a passo · Emitir a nota fiscal (NFS-e Brasília/DF)</div>
      <ol className="steps">
        <li>
          Acesse{' '}
          <a href="https://iss.fazenda.df.gov.br/online/" target="_blank" rel="noreferrer">
            iss.fazenda.df.gov.br/online
          </a>{' '}
          e entre com certificado digital ou conta gov.br.
        </li>
        <li>Abra uma nova DPS (Declaração de Prestação de Serviços).</li>
        <li>Informe o tomador, a descrição do serviço e o valor.</li>
        <li>Confirme — o sistema emite a NFS-e automaticamente. Baixe o PDF e envie ao cliente.</li>
      </ol>

      <div className="rule" />
      <div className="eyebrow">Passo a passo · Gerar e pagar o DAS</div>
      <ol className="steps">
        <li>
          Acesse o{' '}
          <a href="https://www8.receita.fazenda.gov.br/SimplesNacional/" target="_blank" rel="noreferrer">
            Portal do Simples Nacional
          </a>{' '}
          e entre em "PGDAS-D e DEFIS".
        </li>
        <li>Selecione o período de apuração (o mês que você está declarando).</li>
        <li>Informe a receita bruta do mês — use o total da aba Notas Fiscais deste painel.</li>
        <li>Confirme as demais informações e transmita a declaração.</li>
        <li>
          O sistema gera o DAS. Pague até o dia 20 (ou o próximo dia útil, se cair em fim de semana
          ou feriado).
        </li>
      </ol>

      <div className="rule" />
      <div className="eyebrow">Manter o CNPJ regular</div>
      <ul className="task-list">
        <li>Mantenha e-mail e endereço atualizados na Receita Federal e na Junta Comercial.</li>
        <li>
          Não deixe o DAS atrasar — débitos acumulados podem levar à exclusão do Simples Nacional.
        </li>
        <li>Guarde notas e comprovantes de pagamento por pelo menos 5 anos.</li>
        <li>
          Para decisões fora do dia a dia (contratar funcionário, distribuir lucros, mudar de
          atividade), vale consultar um contador ou o{' '}
          <a href="https://www.sebrae.com.br/" target="_blank" rel="noreferrer">
            Sebrae
          </a>
          , que orienta pequenas empresas gratuitamente.
        </li>
      </ul>
    </>
  );
}
