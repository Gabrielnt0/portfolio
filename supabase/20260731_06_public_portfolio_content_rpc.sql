begin;

create or replace function public.get_public_portfolio_content(
  requested_owner_user_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with owner as (
    select coalesce(
      requested_owner_user_id,
      (
        select p.user_id
        from public.profiles p
        where p.is_public = true
        order by p.updated_at desc
        limit 1
      )
    ) as user_id
  )
  select jsonb_build_object(
    'profile',
    (
      select to_jsonb(p)
      from public.profiles p, owner o
      where p.user_id = o.user_id
        and p.is_public = true
      limit 1
    ),
    'projects',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(project_row)
          order by project_row.display_order, project_row.updated_at desc
        )
        from (
          select
            p.*,
            coalesce(
              (
                select jsonb_agg(
                  to_jsonb(s)
                  order by s.sort_order, s.created_at
                )
                from public.portfolio_project_slides s
                where s.project_id = p.id
              ),
              '[]'::jsonb
            ) as slides
          from public.portfolio_projects p, owner o
          where p.user_id = o.user_id
            and p.is_published = true
        ) project_row
      ),
      '[]'::jsonb
    ),
    'education',
    coalesce(
      (
        select jsonb_agg(to_jsonb(e) order by e.display_order, e.start_date desc)
        from public.education e, owner o
        where e.user_id = o.user_id
          and e.is_published = true
      ),
      '[]'::jsonb
    ),
    'experiences',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(e)
          order by e.featured desc, e.start_date desc
        )
        from public.experiences e, owner o
        where e.user_id = o.user_id
          and lower(coalesce(e.status, '')) in
            ('publicado', 'published', 'ativo', 'active')
      ),
      '[]'::jsonb
    ),
    'skills',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(s)
          order by s.is_featured desc, s.display_order, s.name
        )
        from public.skills s, owner o
        where s.user_id = o.user_id
          and s.is_published = true
      ),
      '[]'::jsonb
    ),
    'seo',
    (
      select to_jsonb(s)
      from public.seo s, owner o
      where s.user_id = o.user_id
      limit 1
    ),
    'meta',
    jsonb_build_object(
      'generated_at', now(),
      'owner_user_id', (select user_id from owner)
    )
  );
$$;

revoke all
  on function public.get_public_portfolio_content(uuid)
  from public;

grant execute
  on function public.get_public_portfolio_content(uuid)
  to anon, authenticated;

notify pgrst, 'reload schema';

commit;
