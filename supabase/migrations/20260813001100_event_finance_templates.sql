-- Supabase 对账收口：新建活动时自动生成 7 条标准收支模板（PB event_finance_templates.pb.js 对齐）
-- 所属工作台：市场（韩素云）。
-- 权限：种子函数 security definer 仅服务端触发器调用，客户端不可绕过；
--       金额约束从 >0 放宽为 >=0（模板行金额留空由韩素云填写），其余校验不变。

-- 模板行 amount=0 占位（与 PocketBase min:0 对齐）
alter table public.event_finances
  drop constraint if exists event_finances_amount_check;

alter table public.event_finances
  add constraint event_finances_amount_check check (amount >= 0);

create or replace function public.seed_event_finance_templates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.event_finances (event_id, category, type, amount, description)
  values
    (new.id, 'sponsorship_income', 'income', 0, '赞助收入'),
    (new.id, 'ticket_income', 'income', 0, '票务收入'),
    (new.id, 'venue', 'expense', 0, '场地费'),
    (new.id, 'setup', 'expense', 0, '布置费'),
    (new.id, 'catering', 'expense', 0, '餐饮费'),
    (new.id, 'printing', 'expense', 0, '物料印刷'),
    (new.id, 'travel', 'expense', 0, '嘉宾差旅');
  return new;
end;
$$;

create trigger event_seed_finance_templates
  after insert on public.events
  for each row execute function public.seed_event_finance_templates();
