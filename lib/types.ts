export interface Empresa {
  id?: string;
  user_id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_municipal: string;
  municipio_incidencia: string;
  aliquota_iss: number;
  atividade: string;
  data_abertura: string;
  endereco: string;
  telefone: string;
  email: string;
}

export interface NotaFiscal {
  id: string;
  user_id?: string;
  mes: string;
  data_emissao: string;
  numero: string;
  tomador: string;
  valor: number;
  descricao: string;
  created_at?: string;
}

export interface FaturamentoHistorico {
  id?: string;
  user_id?: string;
  mes: string;
  valor: number;
  origem: string;
}

export interface ChecklistMensal {
  id?: string;
  user_id?: string;
  mes: string;
  nf: boolean;
  pgdas: boolean;
  pago: boolean;
}
