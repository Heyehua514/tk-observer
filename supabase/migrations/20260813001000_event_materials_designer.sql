-- Supabase 对账收口：event_materials 补 designer 关联列（PB event_materials.designer 对齐）
-- 所属工作台：市场（韩素云）/ 设计（孙铭泽）。
-- 权限：本 migration 只追加字段与索引，不改已有表结构定义、不删字段、不触碰 RLS；
--       designer_id 只读引用 profiles（设计师），RLS 沿用 event_materials 现有行级策略。

alter table public.event_materials
  add column if not exists designer_id uuid references public.profiles(id) on delete set null;

create index if not exists event_materials_designer_idx
  on public.event_materials (designer_id) where deleted_at is null;
