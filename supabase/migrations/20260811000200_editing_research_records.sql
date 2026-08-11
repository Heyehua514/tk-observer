-- Supabase 剪辑选题、对标、热点与导入研究记录；权限：editing 主责，business 协作维护对标账号。
create table public.video_ideas (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  account text not null check (account in ('跨境TK磊哥','TK观察磊哥','磊哥出海笔记')),
  video_type text not null check (video_type in ('口播','专访预热','专访正片','专访花絮','快问快答','茶话会','饭局交流','饭局感受')),
  title text not null check (char_length(title) between 1 and 240),
  description text check (char_length(description) <= 5000),
  source_url text check (char_length(source_url) <= 2000),
  tags text check (char_length(tags) <= 1000),
  publish_date timestamptz not null,
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  comments bigint not null default 0 check (comments >= 0),
  shares bigint not null default 0 check (shares >= 0),
  completion_rate integer not null default 0 check (completion_rate between 0 and 100),
  follower_gain bigint not null default 0 check (follower_gain >= 0),
  is_viral boolean not null default false,
  ai_analysis text check (char_length(ai_analysis) <= 10000),
  analyzed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  constraint video_ideas_title_publish_key unique (title, publish_date)
);

create table public.import_history (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  imported_at timestamptz not null,
  file_name text not null check (char_length(file_name) between 1 and 240),
  total_rows integer not null default 0 check (total_rows >= 0),
  new_count integer not null default 0 check (new_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table public.competitor_accounts (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  name text not null unique check (char_length(name) between 1 and 160),
  platform text not null check (char_length(platform) between 1 and 60),
  profile_url text check (char_length(profile_url) <= 2000),
  category text check (char_length(category) <= 120),
  follower_count bigint not null default 0 check (follower_count >= 0),
  avg_views bigint not null default 0 check (avg_views >= 0),
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table public.competitor_videos (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  competitor_id uuid not null references public.competitor_accounts(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 240),
  url text check (char_length(url) <= 2000), publish_date timestamptz,
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  content_tags text check (char_length(content_tags) <= 1000),
  why_viral text check (char_length(why_viral) <= 5000),
  reference_to text check (char_length(reference_to) <= 5000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table public.trending_topics (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  topic text not null check (char_length(topic) between 1 and 240),
  source text check (char_length(source) <= 240), keywords text check (char_length(keywords) <= 1000),
  heat_level text not null check (heat_level in ('高','中','低')),
  insight text check (char_length(insight) <= 5000),
  reference_url text check (char_length(reference_url) <= 2000),
  discovered_at timestamptz not null, converted_to_idea boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table public.competitor_style_analysis (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  competitor_id uuid not null references public.competitor_accounts(id) on delete restrict,
  content_style text check (char_length(content_style) <= 5000),
  title_pattern text check (char_length(title_pattern) <= 5000),
  hook_method text check (char_length(hook_method) <= 5000),
  editing_style text check (char_length(editing_style) <= 5000),
  viral_factors text check (char_length(viral_factors) <= 5000),
  applicable_to_us text check (char_length(applicable_to_us) <= 5000),
  analyzed_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create index video_ideas_account_views_idx on public.video_ideas (account, views desc) where deleted_at is null;
create index video_ideas_viral_publish_idx on public.video_ideas (is_viral, publish_date desc) where deleted_at is null;
create index import_history_imported_idx on public.import_history (imported_at desc) where deleted_at is null;
create index competitor_videos_account_views_idx on public.competitor_videos (competitor_id, views desc) where deleted_at is null;
create index trending_topics_heat_discovered_idx on public.trending_topics (heat_level, discovered_at desc) where deleted_at is null;
create index style_analysis_competitor_date_idx on public.competitor_style_analysis (competitor_id, analyzed_at desc) where deleted_at is null;

create trigger video_ideas_set_updated_at before update on public.video_ideas for each row execute function public.set_updated_at();
create trigger import_history_set_updated_at before update on public.import_history for each row execute function public.set_updated_at();
create trigger competitor_accounts_set_updated_at before update on public.competitor_accounts for each row execute function public.set_updated_at();
create trigger competitor_videos_set_updated_at before update on public.competitor_videos for each row execute function public.set_updated_at();
create trigger trending_topics_set_updated_at before update on public.trending_topics for each row execute function public.set_updated_at();
create trigger competitor_style_analysis_set_updated_at before update on public.competitor_style_analysis for each row execute function public.set_updated_at();

create or replace function public.enforce_import_history_immutable()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if row(new.id, new.legacy_id, new.imported_at, new.file_name, new.total_rows, new.new_count, new.updated_count, new.snapshot, new.created_at)
     is distinct from
     row(old.id, old.legacy_id, old.imported_at, old.file_name, old.total_rows, old.new_count, old.updated_count, old.snapshot, old.created_at)
  then
    raise exception using errcode = '42501', message = 'import history is immutable';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_import_history_immutable() from public;
grant execute on function public.enforce_import_history_immutable() to authenticated;
create trigger import_history_enforce_immutable before update on public.import_history
for each row execute function public.enforce_import_history_immutable();

create or replace function public.invalidate_import_history(target_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  if not public.has_any_role(array['owner','boss','editing']) then
    raise exception using errcode = '42501', message = 'editing role required to invalidate import history';
  end if;
  update public.import_history set deleted_at = now()
  where id = target_id and deleted_at is null;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
revoke all on function public.invalidate_import_history(uuid) from public;
grant execute on function public.invalidate_import_history(uuid) to authenticated;

alter table public.video_ideas enable row level security;
alter table public.import_history enable row level security;
alter table public.competitor_accounts enable row level security;
alter table public.competitor_videos enable row level security;
alter table public.trending_topics enable row level security;
alter table public.competitor_style_analysis enable row level security;
grant select, insert, update, delete on public.video_ideas, public.import_history, public.competitor_accounts, public.competitor_videos, public.trending_topics, public.competitor_style_analysis to authenticated;

create policy "editing collaborators can read video ideas" on public.video_ideas for select to authenticated using (public.has_any_role(array['owner','boss','editing']) and (deleted_at is null or public.has_any_role(array['owner'])));
create policy "editing collaborators can create video ideas" on public.video_ideas for insert to authenticated with check (public.has_any_role(array['owner','boss','editing']) and deleted_at is null);
create policy "editing collaborators can update video ideas" on public.video_ideas for update to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete video ideas" on public.video_ideas for delete to authenticated using (public.has_any_role(array['owner']));

create policy "editing collaborators can read import history" on public.import_history for select to authenticated using (public.has_any_role(array['owner','boss','editing']) and (deleted_at is null or public.has_any_role(array['owner'])));
create policy "editing collaborators can create import history" on public.import_history for insert to authenticated with check (public.has_any_role(array['owner','boss','editing']) and deleted_at is null);
create policy "editing collaborators can invalidate import history" on public.import_history for update to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete import history" on public.import_history for delete to authenticated using (public.has_any_role(array['owner']));

create policy "competitor collaborators can read competitor accounts" on public.competitor_accounts for select to authenticated using (public.has_any_role(array['owner','boss','editing','business']) and (deleted_at is null or public.has_any_role(array['owner'])));
create policy "competitor collaborators can create competitor accounts" on public.competitor_accounts for insert to authenticated with check (public.has_any_role(array['owner','boss','editing','business']) and deleted_at is null);
create policy "competitor collaborators can update competitor accounts" on public.competitor_accounts for update to authenticated using (public.has_any_role(array['owner','boss','editing','business'])) with check (public.has_any_role(array['owner','boss','editing','business']));
create policy "owners can hard delete competitor accounts" on public.competitor_accounts for delete to authenticated using (public.has_any_role(array['owner']));

create policy "editing collaborators can read competitor videos" on public.competitor_videos for select to authenticated using (public.has_any_role(array['owner','boss','editing']) and (deleted_at is null or public.has_any_role(array['owner'])));
create policy "editing collaborators can create competitor videos" on public.competitor_videos for insert to authenticated with check (public.has_any_role(array['owner','boss','editing']) and deleted_at is null);
create policy "editing collaborators can update competitor videos" on public.competitor_videos for update to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete competitor videos" on public.competitor_videos for delete to authenticated using (public.has_any_role(array['owner']));

create policy "editing collaborators can read trending topics" on public.trending_topics for select to authenticated using (public.has_any_role(array['owner','boss','editing']) and (deleted_at is null or public.has_any_role(array['owner'])));
create policy "editing collaborators can create trending topics" on public.trending_topics for insert to authenticated with check (public.has_any_role(array['owner','boss','editing']) and deleted_at is null);
create policy "editing collaborators can update trending topics" on public.trending_topics for update to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete trending topics" on public.trending_topics for delete to authenticated using (public.has_any_role(array['owner']));

create policy "editing collaborators can read style analyses" on public.competitor_style_analysis for select to authenticated using (public.has_any_role(array['owner','boss','editing']) and (deleted_at is null or public.has_any_role(array['owner'])));
create policy "editing collaborators can create style analyses" on public.competitor_style_analysis for insert to authenticated with check (public.has_any_role(array['owner','boss','editing']) and deleted_at is null);
create policy "editing collaborators can update style analyses" on public.competitor_style_analysis for update to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete style analyses" on public.competitor_style_analysis for delete to authenticated using (public.has_any_role(array['owner']));
