-- 个人 AI 记忆：仅保存用户明确确认的结构化偏好和推进经验。
create table public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  memory_type text not null check (char_length(memory_type) between 1 and 40),
  memory_key text not null check (char_length(memory_key) between 1 and 120),
  memory_value text not null check (char_length(memory_value) between 1 and 2000),
  confidence numeric(4,3) not null default 0.5 check (confidence >= 0 and confidence <= 1),
  source text not null default 'manual' check (source in ('manual','accepted_ai','review')),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, memory_key)
);

create index ai_memory_owner_recent_idx on public.ai_memory (owner_id, last_used_at desc, updated_at desc)
where deleted_at is null;

create trigger ai_memory_set_updated_at
before update on public.ai_memory
for each row execute function public.set_updated_at();

alter table public.ai_memory enable row level security;
grant select, insert, update on public.ai_memory to authenticated;

create policy "members can read own ai memory"
on public.ai_memory for select to authenticated
using (owner_id = auth.uid() and deleted_at is null);

create policy "members can create own ai memory"
on public.ai_memory for insert to authenticated
with check (owner_id = auth.uid() and deleted_at is null);

create policy "members can update own ai memory"
on public.ai_memory for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

alter table public.ai_memory replica identity full;
alter publication supabase_realtime add table public.ai_memory;
