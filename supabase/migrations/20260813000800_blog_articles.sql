-- Supabase 商务公众号分析：business 维护文章，boss 只读，爆款状态由数据库自动计算。
create table public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (char_length(title) between 1 and 200),
  account text not null check (account in ('TK观察','霞光社','白鲸出海','晚点财经')),
  publish_date timestamptz not null,
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  shares bigint not null default 0 check (shares >= 0),
  is_viral boolean not null default false,
  analysis_notes text check (char_length(analysis_notes) <= 5000),
  source_url text check (char_length(source_url) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index blog_articles_account_publish_idx
on public.blog_articles (account, publish_date desc)
where deleted_at is null;

create index blog_articles_viral_publish_idx
on public.blog_articles (is_viral, publish_date desc)
where deleted_at is null;

create trigger blog_articles_set_updated_at before update on public.blog_articles
for each row execute function public.set_updated_at();

create or replace function public.recompute_blog_article_viral_flags(target_account text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_avg numeric;
begin
  select avg(views)::numeric into account_avg
  from public.blog_articles
  where account = target_account
    and deleted_at is null;

  update public.blog_articles
  set is_viral = case
      when coalesce(account_avg, 0) > 0 then views >= account_avg * 2
      else false
    end
  where account = target_account
    and deleted_at is null;
end;
$$;

revoke all on function public.recompute_blog_article_viral_flags(text) from public;
grant execute on function public.recompute_blog_article_viral_flags(text) to authenticated;

create or replace function public.sync_blog_article_viral_flags()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recompute_blog_article_viral_flags(new.account);
  end if;
  if tg_op = 'UPDATE' and new.account is distinct from old.account then
    perform public.recompute_blog_article_viral_flags(old.account);
  end if;
  if tg_op = 'DELETE' then
    perform public.recompute_blog_article_viral_flags(old.account);
  end if;
  return null;
end;
$$;

revoke all on function public.sync_blog_article_viral_flags() from public;
grant execute on function public.sync_blog_article_viral_flags() to authenticated;

create trigger blog_articles_sync_viral_flags
after insert or update of account, views, deleted_at or delete on public.blog_articles
for each row execute function public.sync_blog_article_viral_flags();

alter table public.blog_articles enable row level security;

grant select, insert, update, delete on public.blog_articles to authenticated;

create policy "blog collaborators can read articles" on public.blog_articles
for select to authenticated using (
  public.has_any_role(array['owner','boss','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "business can create blog articles" on public.blog_articles
for insert to authenticated
with check (public.has_any_role(array['owner','business']) and deleted_at is null);

create policy "business can update blog articles" on public.blog_articles
for update to authenticated
using (public.has_any_role(array['owner','business']))
with check (public.has_any_role(array['owner','business']));

create policy "owners can hard delete blog articles" on public.blog_articles
for delete to authenticated
using (public.has_any_role(array['owner']));

alter table public.blog_articles replica identity full;

alter publication supabase_realtime add table public.blog_articles;
