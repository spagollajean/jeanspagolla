-- Relay de link curto pro magic link do painel: o link real do Supabase
-- (db.jeanspagolla.com.br/auth/v1/verify?token=...) é longo e feio pra
-- mandar no WhatsApp. Guarda o destino real por um slug curto; a rota
-- /api/r/[slug] no site principal consome e redireciona (uso único).
create table if not exists public.link_redirects (
  slug text primary key,
  target_url text not null,
  created_at timestamptz not null default now()
);

comment on table public.link_redirects is 'Relay de links curtos (ex: magic link do painel mandado por WhatsApp) -- uso único, expira em minutos.';
