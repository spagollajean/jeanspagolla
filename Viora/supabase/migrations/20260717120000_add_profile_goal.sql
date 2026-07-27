-- Meta principal do usuário (retenção): personaliza análise de prato,
-- dieta/treino do coach e o card no dashboard.
-- Valores espelham as chaves de goal_fit que a IA do prato já devolve.
alter table public.profiles
  add column if not exists goal text
  check (goal in ('emagrecer', 'ganhar_massa', 'manter'));

comment on column public.profiles.goal is 'Meta principal: emagrecer | ganhar_massa | manter (null = ainda não escolheu)';
