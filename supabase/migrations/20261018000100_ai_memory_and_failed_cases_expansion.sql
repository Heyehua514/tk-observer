-- Migration: AI memory & failed cases expansion for video auto-cut and team reflection
-- Date: 2026-10-18
-- Purpose: 扩展 ai_memory 与 failed_cases 约束，纳管 auto_cut_diagnosis 并支持团队沉淀复盘案例。

alter table public.ai_memory drop constraint if exists ai_memory_source_check;
alter table public.ai_memory add constraint ai_memory_source_check check (
  source in ('manual', 'accepted_ai', 'review', 'auto_cut_diagnosis')
);

alter table public.failed_cases drop constraint if exists failed_cases_source_type_check;
alter table public.failed_cases add constraint failed_cases_source_type_check check (
  source_type in ('opportunity', 'event_task', 'editing', '剪辑', 'video_cut', 'market')
);

alter table public.failed_cases alter column source_id type text;
alter table public.failed_cases drop constraint if exists failed_cases_source_id_check;
alter table public.failed_cases add constraint failed_cases_source_id_check check (
  char_length(source_id) between 1 and 255
);

drop policy if exists "boss can read failed cases" on public.failed_cases;
drop policy if exists "members can read failed cases" on public.failed_cases;
create policy "members can read failed cases" on public.failed_cases
for select to authenticated
using (public.current_user_status() = 'active');

drop policy if exists "active members can record failed cases" on public.failed_cases;
create policy "active members can record failed cases" on public.failed_cases
for insert to authenticated
with check (public.current_user_status() = 'active');

drop policy if exists "owner can manage failed cases" on public.failed_cases;
create policy "owner can manage failed cases" on public.failed_cases
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

grant select, insert, update on public.ai_memory to authenticated;
grant select, insert on public.failed_cases to authenticated;
grant select, insert, update, delete on public.failed_cases to service_role;
