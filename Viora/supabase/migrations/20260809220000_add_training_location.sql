-- Onde o usuário treina (casa ou academia): decide se o Titan Coach monta
-- treino HIIT com peso corporal ou treino de academia com equipamentos.
alter table public.profiles
  add column if not exists training_location text
  check (training_location in ('casa', 'academia'));

comment on column public.profiles.training_location is 'Local de treino: casa | academia (null = ainda não escolheu)';
