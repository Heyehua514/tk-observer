-- 商务工作台：商机成交自动通知老板（PRD 补充八模块二：stage 变为已成交时自动创建一条通知给磊哥）。
-- 用途：opportunities.stage 变为 won 时，为所有 active 的 boss 角色用户创建站内通知，同一商机不重复通知。
-- 权限：security definer 触发器绕过 RLS 写入；函数本身 revoke public，仅触发器内部可执行。

alter table public.notifications
  drop constraint notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('design_review', 'gmv_target', 'comment', 'deadline', 'opportunity_won'));

create or replace function public.notify_boss_on_opportunity_won()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stage = 'won' and old.stage is distinct from 'won' then
    insert into public.notifications (recipient_id, type, title, content, link)
    select p.id, 'opportunity_won', '商机已成交',
           '「' || new.title || '」已成交'
             || case when new.amount is not null
                then '，金额 ' || round(new.amount / 100.0, 2) || ' 元'
                else '' end,
           '/business'
    from public.profiles p
    where p.role = 'boss'
      and p.status = 'active'
      and not exists (
        select 1 from public.notifications n
        where n.recipient_id = p.id
          and n.type = 'opportunity_won'
          and n.title = '商机已成交'
          and n.content = '「' || new.title || '」已成交'
            || case when new.amount is not null
               then '，金额 ' || round(new.amount / 100.0, 2) || ' 元'
               else '' end
          and n.deleted_at is null
      );
  end if;
  return new;
end;
$$;

create trigger opportunities_notify_boss_on_won
after update of stage on public.opportunities
for each row execute function public.notify_boss_on_opportunity_won();

revoke all on function public.notify_boss_on_opportunity_won() from public;
