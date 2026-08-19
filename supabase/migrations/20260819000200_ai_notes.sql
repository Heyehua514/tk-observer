-- AI 助手结果保存表
-- 用途：各工作台 AI 助手生成结果后，可人工保存为一条可检索记录，供后续查阅。
-- 所属工作台：全局（AI 助手）
-- 权限：authenticated 可创建/读取/软删自己或团队记录，boss 可查阅。
create table public.ai_notes (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (char_length(scope) between 1 and 80),
  task_type text not null check (char_length(task_type) between 1 and 40),
  prompt text not null check (char_length(prompt) <= 2000),
  result text not null check (char_length(result) <= 20000),
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index ai_notes_owner_created_idx on public.ai_notes (owner_id, created_at desc)
where deleted_at is null;

create trigger ai_notes_set_updated_at before update on public.ai_notes
for each row execute function public.set_updated_at();

alter table public.ai_notes enable row level security;

grant select, insert, update, delete on public.ai_notes to authenticated;

create policy "active members can read ai notes" on public.ai_notes
for select to authenticated using (
  (deleted_at is null or public.has_any_role(array['owner']))
  and (
    public.has_any_role(array['owner','boss'])
    or owner_id = auth.uid()
  )
);

create policy "members can create ai notes" on public.ai_notes
for insert to authenticated with check (deleted_at is null);

create policy "owner can update own ai notes" on public.ai_notes
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owners can hard delete ai notes" on public.ai_notes
for delete to authenticated using (public.has_any_role(array['owner']));

alter table public.ai_notes replica identity full;

alter publication supabase_realtime add table public.ai_notes;
