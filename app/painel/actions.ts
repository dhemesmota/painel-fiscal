'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');
  return { supabase, user };
}

// ─── Notas fiscais ───────────────────────────────────────────────────────────

const notaSchema = z.object({
  mes:         z.string().regex(/^\d{4}-\d{2}$/),
  data_emissao:z.string(),
  numero:      z.string().optional(),
  tomador:     z.string().optional(),
  valor:       z.coerce.number().positive(),
  descricao:   z.string().optional(),
});

export async function addNota(formData: FormData) {
  const { supabase, user } = await getUser();
  const parsed = notaSchema.parse({
    mes:          (formData.get('data_emissao') as string).slice(0, 7),
    data_emissao: formData.get('data_emissao'),
    numero:       formData.get('numero'),
    tomador:      formData.get('tomador'),
    valor:        formData.get('valor'),
    descricao:    formData.get('descricao'),
  });
  const { error } = await supabase.from('notas_fiscais').insert({ ...parsed, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath('/painel', 'layout');
}

export async function removeNota(id: string) {
  const { supabase, user } = await getUser();
  const { error } = await supabase.from('notas_fiscais').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  revalidatePath('/painel', 'layout');
}

// ─── Checklist ───────────────────────────────────────────────────────────────

export async function toggleCheck(mes: string, field: 'nf' | 'pgdas' | 'pago', value: boolean) {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from('checklist_mensal')
    .upsert({ user_id: user.id, mes, [field]: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,mes' });
  if (error) throw new Error(error.message);
  revalidatePath('/painel', 'layout');
}

// ─── Histórico ───────────────────────────────────────────────────────────────

export async function setHistorico(mes: string, valor: number) {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from('faturamento_historico')
    .upsert({ user_id: user.id, mes, valor, origem: 'manual', updated_at: new Date().toISOString() }, { onConflict: 'user_id,mes' });
  if (error) throw new Error(error.message);
  revalidatePath('/painel', 'layout');
}

// ─── Empresa ─────────────────────────────────────────────────────────────────

const empresaSchema = z.object({
  razao_social:        z.string().trim().min(1, 'Informe a razão social.'),
  nome_fantasia:       z.string(),
  cnpj:                z.string().refine(v => v.replace(/\D/g, '').length === 14, 'Informe um CNPJ válido (14 dígitos).'),
  inscricao_municipal: z.string(),
  municipio_incidencia:z.string(),
  aliquota_iss:        z.coerce.number(),
  atividade:           z.string(),
  data_abertura:       z.string().optional(),
  endereco:            z.string(),
  telefone:            z.string(),
  email:               z.string(),
});

export async function saveEmpresa(formData: FormData) {
  const { supabase, user } = await getUser();
  let parsed;
  try {
    parsed = empresaSchema.parse({
      razao_social:         formData.get('razao_social'),
      nome_fantasia:        formData.get('nome_fantasia'),
      cnpj:                 formData.get('cnpj'),
      inscricao_municipal:  formData.get('inscricao_municipal'),
      municipio_incidencia: formData.get('municipio_incidencia'),
      aliquota_iss:         formData.get('aliquota_iss'),
      atividade:            formData.get('atividade'),
      data_abertura:        formData.get('data_abertura') || undefined,
      endereco:             formData.get('endereco'),
      telefone:             formData.get('telefone'),
      email:                formData.get('email'),
    });
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.issues[0]?.message || 'Dados inválidos.');
    throw err;
  }
  const { error } = await supabase
    .from('empresas')
    .upsert({ ...parsed, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
  revalidatePath('/painel', 'layout');
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout() {
  const { supabase } = await getUser();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}
