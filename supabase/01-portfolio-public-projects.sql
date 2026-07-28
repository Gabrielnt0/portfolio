-- Portfolio - Public Projects Access
-- Execute no SQL Editor do mesmo projeto Supabase usado pelo NT Studio CMS.

alter table public.projects enable row level security;

drop policy if exists "Portfolio pode ler projetos publicados" on public.projects;

create policy "Portfolio pode ler projetos publicados"
on public.projects
for select
to anon
using (status = 'Publicado');

create or replace view public.public_portfolio_projects
with (security_invoker = true)
as
select
  id,
  user_id,
  title,
  description,
  category,
  status,
  featured,
  github_url,
  demo_url,
  image_url,
  created_at,
  updated_at
from public.projects
where status = 'Publicado';

grant select on public.public_portfolio_projects to anon, authenticated;

notify pgrst, 'reload schema';
