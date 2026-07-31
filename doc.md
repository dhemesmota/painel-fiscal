# Roadmap — Painel Fiscal como assistente de gestão da empresa

> **Progresso:** ✅ item 0 (erros silenciosos) · ✅ item 1 (feriados + autopreencher CNPJ) · ✅ item 3 (lembretes por e-mail, DAS + DEFIS, em produção) · 🟡 item 2 (upload de PDF com IA) — código pronto em `/painel/importar`, mas parado por falta de crédito na conta da Anthropic (API paga por uso, sem free tier — decisão consciente de não ativar agora). Não custa nada enquanto não for usado; é só adicionar crédito no console.anthropic.com quando quiser ligar. Nota: o fluxo não envolve mais contadora — todo o envio das obrigações é feito por você mesmo, os lembretes já foram escritos nesse tom.

Objetivo: sair de "planilha de controle manual" para um sistema que **avisa, preenche e confere sozinho**, pra você conseguir manter o CNPJ regular sem depender de lembrar de nada e sem precisar reabrir cada PDF pra copiar número.

Todas as ideias abaixo têm uma tag de esforço (🟢 baixo · 🟡 médio · 🔴 alto) pra te ajudar a priorizar.

---

## 0. Corrigir agora (bug real encontrado nesta sessão)

🟢 **Server actions não checam erro do Supabase.** Em `app/painel/actions.ts`, todas as funções fazem `await supabase.from(...).insert/upsert(...)` sem checar `{ error }`. Foi assim que descobrimos que os checkboxes do checklist "salvavam" (200 OK na tela) enquanto as tabelas nem existiam no banco. Precisa:
```ts
const { error } = await supabase.from('checklist_mensal').upsert(...);
if (error) throw new Error(error.message);
```
em toda action, e mostrar o erro na UI (hoje o `ChecklistClient`/`NotaForm` não têm estado de erro, só de "pending"). Sem isso, qualquer falha futura de banco vai continuar passando despercebida.

---

## 1. Quick wins (baixo esforço, alto impacto)

- 🟢 **Corrigir vencimento do DAS para considerar feriados, não só fins de semana.** Hoje `vencimentoDAS()` em `lib/simplesNacional.ts` só empurra pra frente se cair em sábado/domingo. Se dia 20 cair num feriado nacional (ou de Brasília/DF), o vencimento real também muda. A [BrasilAPI](https://brasilapi.com.br/docs#tag/Feriados-Nacionais) tem endpoint gratuito de feriados nacionais (`GET /api/feriados/v1/{ano}`) — dá pra cruzar isso na função.
- 🟢 **Auto-preencher dados da empresa a partir do CNPJ.** Em vez de digitar razão social, endereço, atividade etc. manualmente, um campo "Buscar CNPJ" que chama a [BrasilAPI CNPJ](https://brasilapi.com.br/docs#tag/CNPJ) (gratuita, sem chave) ou ReceitaWS e preenche o formulário sozinho.
- 🟢 **Autopreencher endereço por CEP** no formulário da empresa via [ViaCEP](https://viacep.com.br/) (gratuita).
- 🟢 **Alerta visual de proximidade do vencimento** no próprio painel (`/painel`) — hoje só mostra a data; dá pra colorir de vermelho/amarelo quando faltar ≤5 dias e o checklist não estiver completo.
- 🟢 **Aviso de proximidade do sublimite/teto do Simples Nacional.** `computeRBT12`/`calcImposto` já calculam RBT12; falta um aviso proativo tipo "você está a 15% do sublimite de R$3,6M" — hoje só avisa quando já estourou (`erro: true`).

## 2. Automatizar a entrada de dados (o maior ganho de tempo)

Nesta conversa, toda vez que você anexou um PDF (guia do DAS, NFS-e, cartão CNPJ), eu li e extraí os dados manualmente pra te dizer o que preencher. Isso dá pra automatizar dentro do próprio app:

- 🟡 **Upload de PDF com extração automática (IA).** Uma tela de "Importar documento" onde você arrasta o PDF da NFS-e ou da guia do DAS, e o sistema (via API da Anthropic/Claude, teu paper mesmo enquanto assistente) extrai número da nota, tomador, valor, competência, ISS etc. e já sugere o preenchimento do formulário de Nota Fiscal ou do histórico de faturamento. Elimina 100% da digitação manual.
- 🟡 **Detecção automática de e-mails da contadora.** Integração com Gmail API: quando chegar um e-mail com anexo de guia DAS/PGDAS, o sistema baixa o PDF, extrai os dados e pré-preenche o checklist do mês como "PGDAS enviado" automaticamente.
- 🟡 **WhatsApp como canal de entrada.** Um número de WhatsApp Business (via API oficial ou Twilio) pro qual você encaminha o PDF da nota assim que emite — o bot responde confirmando o lançamento no painel. Mais rápido que abrir o app.

## 3. Alertas e lembretes proativos (o sistema te procura, não o contrário)

Hoje o app é 100% passivo — só mostra informação quando você abre. Pra "facilitar ao máximo" o ideal é inverter isso:

- 🟡 **E-mail/WhatsApp automático nos dias -5, -1 e no dia do vencimento do DAS**, se o checklist do mês ainda não estiver 100% completo. Dá pra implementar com [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) (roda 1x por dia, de graça no plano Hobby) + [Resend](https://resend.com) (e-mail transacional, tier grátis generoso) ou WhatsApp Business API.
- 🟡 **Lembrete da DEFIS** (anual, até 31/03) e de **manutenção do Livro Caixa** — mesma infra de cron + e-mail.
- 🟢 **Notificação push via PWA.** Transformar o app num PWA instalável (manifest + service worker) permite mandar push notification direto no celular, sem depender de e-mail/WhatsApp.

## 4. Monitoramento e conferência automática

- 🟡 **Checar a situação cadastral do CNPJ periodicamente** (via BrasilAPI/ReceitaWS, 1x por semana num cron) e alertar se mudar de "ATIVA" pra qualquer outra coisa — pega problema de pendência antes que vire exclusão do Simples.
- 🔴 **Conciliação automática do pagamento do DAS via Open Finance.** Usando uma API de Open Banking (ex: Pluggy, Belvo) conectada à sua conta, o sistema detectaria automaticamente o Pix/débito do valor do DAS e marcaria "Pago" sozinho no checklist. Mais complexo (exige consentimento bancário, LGPD, custo de API), mas é o item que mais elimina esforço manual.
- 🔴 **Emissão de NFS-e direto pelo painel via API do ISS.NET/DF.** Brasília expõe webservice para emissão de NFS-e para sistemas de terceiros, mas exige certificado digital e-CNPJ e integração mais robusta. Só compensa se o volume de notas crescer — hoje, com o limite de 2 notas/mês, o ganho é pequeno.

## 5. Colaboração com a contadora

- 🟢 **Link de acesso somente-leitura** pra contadora, sem precisar de login completo (ex: um token de URL que mostra o painel do mês em modo leitura).
- 🟢 **Exportar relatório anual (CSV/PDF)** com receita mês a mês, RBT12 e DAS pago — pronto pra conferência da DEFIS, em vez de ela pedir print de tela.

## 6. O que não dá pra automatizar 100% (gerenciar expectativa)

- **Transmissão oficial do PGDAS-D e emissão de NFS-e continuam exigindo os sistemas oficiais** (Portal do Simples Nacional, iss.fazenda.df.gov.br) — não existe API pública aberta pra isso sem certificado digital e credenciamento. O painel pode preparar os dados e lembrar você, mas o clique final no site do governo ainda é seu (ou automatizável só com certificado digital + integração mais cara/complexa, item 4).
- **Cálculo do DAS no painel é estimativa** — o valor oficial sempre vem do PGDAS-D. Isso já está bem sinalizado no rodapé da página de Imposto; vale manter.

---

## Sugestão de ordem de implementação

1. Corrigir tratamento de erro nas actions (item 0) — sem isso, qualquer feature nova pode falhar em silêncio.
2. Feriados no cálculo do vencimento + autopreencher CNPJ/CEP (item 1) — ganho rápido, baixo risco.
3. Lembretes automáticos por e-mail via cron (item 3) — é o que mais "tira você da frente do teclado".
4. Upload de PDF com extração por IA (item 2) — maior redução de digitação manual.
5. Resto conforme a necessidade for aparecendo (monitoramento de CNPJ, conciliação bancária, etc.).
