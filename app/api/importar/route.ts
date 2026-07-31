import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

// Node runtime: precisamos de Buffer e do SDK da Anthropic (não roda no Edge Runtime).
export const runtime = 'nodejs';

const TOOL_NAME = 'registrar_documento';

const TOOL_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  required: [
    'tipo', 'competencia', 'data_documento', 'numero_documento',
    'tomador_ou_razao_social', 'nome_fantasia', 'valor', 'descricao_ou_atividade',
    'cnpj', 'inscricao_municipal', 'endereco', 'telefone', 'email',
    'data_abertura', 'aliquota_iss',
  ],
  properties: {
    tipo: {
      type: 'string',
      enum: ['nota_fiscal', 'guia_das', 'cartao_cnpj', 'desconhecido'],
      description: 'Tipo de documento identificado.',
    },
    competencia: { type: 'string', description: 'Competência no formato YYYY-MM. Vazio ("") se não se aplicar.' },
    data_documento: { type: 'string', description: 'Data de emissão no formato YYYY-MM-DD. Vazio se não se aplicar.' },
    numero_documento: { type: 'string', description: 'Número da nota ou da guia. Vazio se não se aplicar.' },
    tomador_ou_razao_social: { type: 'string', description: 'Nome do tomador do serviço (NF) ou razão social (Cartão CNPJ). Vazio se não se aplicar.' },
    nome_fantasia: { type: 'string', description: 'Nome fantasia, se houver.' },
    valor: { type: 'number', description: 'Valor do serviço ou da guia. 0 se não se aplicar.' },
    descricao_ou_atividade: { type: 'string', description: 'Descrição do serviço (NF) ou atividade principal com código CNAE (Cartão CNPJ).' },
    cnpj: { type: 'string', description: 'CNPJ, formatado ou não.' },
    inscricao_municipal: { type: 'string', description: 'Inscrição municipal do prestador.' },
    endereco: { type: 'string', description: 'Endereço completo, se presente no documento.' },
    telefone: { type: 'string' },
    email: { type: 'string' },
    data_abertura: { type: 'string', description: 'Data de abertura do CNPJ, formato YYYY-MM-DD. Vazio se não se aplicar.' },
    aliquota_iss: { type: 'number', description: 'Alíquota de ISS em porcentagem (ex: 2 para 2%). 0 se não encontrada.' },
  },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('pdf');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Envie um arquivo PDF' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'O arquivo precisa ser um PDF' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 1024,
    tools: [
      {
        name: TOOL_NAME,
        description: 'Extrai os dados estruturados de um documento fiscal brasileiro: NFS-e (nota fiscal de serviço), guia do DAS/Simples Nacional, ou Cartão CNPJ da Receita Federal.',
        strict: true,
        input_schema: TOOL_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: 'Extraia os dados deste documento fiscal brasileiro usando a tool.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    return NextResponse.json({ error: 'Não foi possível processar este documento.' }, { status: 422 });
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );
  if (!toolUse) {
    return NextResponse.json({ error: 'Não foi possível extrair dados do documento.' }, { status: 422 });
  }

  return NextResponse.json({ extraido: toolUse.input });
}
