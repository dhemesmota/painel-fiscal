// Fonte única das URLs oficiais e regras de prazo usadas no wizard (GuiaWizard),
// no calendário e no e-mail de lembrete — evita que os três divirjam ao longo do tempo.

export const URLS = {
  nfseDF: 'https://iss.fazenda.df.gov.br/online/',
  simplesPortal: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
  sebrae: 'https://www.sebrae.com.br/',
};

export function guiaPainelUrl(appUrl: string): string {
  return `${appUrl}/painel/guia`;
}

// A data de 31/03 é a regra geral (Resolução CGSN), mas o Comitê Gestor já
// prorrogou esse prazo em anos anteriores — por isso os textos que usam este
// valor devem sempre orientar a conferir a data oficial, nunca afirmá-la como certa.
export const DEFIS_MES = 3; // março (1-indexado)
export const DEFIS_DIA = 31;
export const DEFIS_AVISO_PRORROGACAO =
  'Confirme a data oficial no Portal do Simples Nacional — o Comitê Gestor já prorrogou esse prazo em anos anteriores.';

export function defisDaysLeft(from: Date = new Date()): number {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  let deadline = new Date(year, DEFIS_MES - 1, DEFIS_DIA);
  if (today > deadline) deadline = new Date(year + 1, DEFIS_MES - 1, DEFIS_DIA);
  return Math.round((deadline.getTime() - today.getTime()) / 86400000);
}

export const DAS_LEMBRETE_DIAS = [5, 1, 0];
export const DEFIS_LEMBRETE_DIAS = [30, 15, 5, 1, 0];
