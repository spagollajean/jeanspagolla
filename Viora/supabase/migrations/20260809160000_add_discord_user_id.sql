-- Guarda o ID do Discord de quem conectou a conta, pra liberar/revogar o
-- cargo "Assinante" no servidor do Discord (comunidade paga do Renascer).
alter table public.profiles add column if not exists discord_user_id text;
