# Scripts descontinuados (removidos do Windmill em 2026-06-11)

Fluxo antigo do Titan Coach no WhatsApp, em 3 etapas:

1. `5_Start_Coach_Checks.ts` — checava limite (1 grátis / 1 a cada 3 dias PRO), pedia a foto e setava state `COACH_FRONT`
2. `6_Process_Coach_Front.ts` — salvava a foto no bucket `coach-uploads` e perguntava o objetivo com botões interativos (`goal_hipertrofia` / `goal_emagrecer` / `goal_definicao`), setando state `COACH_GOAL`
3. `7_Generate_Coach_Plan.ts` — gerava o protocolo via **Gemini**, mandava resumo no WhatsApp, gerava **PDF via n8n/Gotenberg** (`https://n8n.seureview.com.br/webhook/pdf-coach` → bucket `coach-pdfs`) e salvava em `coach_assessments`

**Por que foram removidos:** os jobs do Windmill provaram que nunca executaram em produção (só jobs de "dependencies", nenhuma execução real via flow). O `foodsnap_flow` chama direto o `Process_Body_AI` (OpenAI, 1 foto, sem etapa de objetivo) na branch `AWAITING_BODY_PHOTO`.

## supabase/functions/_deprecated/whatsapp-webhook

Edge function legada (Evolution API + Gemini), sem tráfego nos logs — quem
roda em produção é `meta-whatsapp-webhook` (Meta Cloud API) + `Process_Body_AI`
(Windmill). Junto com ela foi removida a migration `20260610_coach_evolution.sql`,
que adicionava a coluna `images` (jsonb, 3 fotos: front/side/back) — feature
nunca aplicada no banco nem usada pelo fluxo real (que salva 1 foto em `image_url`).

**Vale reaproveitar daqui:**
- Geração de PDF via n8n/Gotenberg + envio como documento no WhatsApp (script 7, seção 6) — útil pro Coach e pros futuros planos de alimentação
- Pergunta de objetivo com botões interativos (script 6, seção 4)
- Rate limit de 1 avaliação a cada 3 dias (script 5, seção 1.2)

## supabase/functions/_deprecated/stripe-checkout, stripe-portal, stripe-webhook (removidas em 2026-06-11)

Implementação antiga do Stripe via Supabase Edge Functions. `stripe-checkout`
tinha inclusive o preço hardcoded (`PRICE_MENSAL = "price_1TLsAFA5eAF7o14GeHRMJLzB"`).

**Por que foram removidas:** nenhum código do front-end (`src/`) chama essas
functions (`grep` por `functions.invoke`/`stripe-checkout`/`stripe-portal`/`stripe-webhook`
não retornou nada) e os logs de 24h não mostram nenhuma requisição a elas. Quem
roda em produção é a implementação Next.js, 100% via env vars, sem IDs hardcoded:
- `src/app/api/stripe/checkout/route.ts` (chamado por `checkout/page.tsx`)
- `src/app/api/stripe/cancel/route.ts` (chamado por `DashboardProfile.tsx`)
- `src/app/api/stripe/webhook/route.ts` (endpoint registrado no Stripe Dashboard)

**Pendente:** as 3 functions ainda estão deployadas e ACTIVE no Supabase
(`stripe-checkout` v35, `stripe-portal` v24, `stripe-webhook` v33), só não
recebem tráfego. Pra remover de vez do projeto Supabase, rodar manualmente:
`npx supabase functions delete stripe-checkout|stripe-portal|stripe-webhook --project-ref mnhgpnqkwuqzpvfrwftp`
(bloqueado pro agente pelo classifier de auto-mode).
