-- 商务工作台：朋友圈计划复盘回填闭环（只追加触发器，不改旧 migration）。
-- 所属工作台：商务（董雨辰）；权限：business/boss 可读写，触发器服务端执行。
-- 用途：朋友圈计划关联商机（linked_opportunity_id）时，自动在商机 notes 追加
-- 「来源：朋友圈 M月D日 内容」，同一行内容不重复追加；另一条朋友圈再追加新行。

create or replace function public.social_plan_link_opportunity_notes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_line text;
begin
  if new.linked_opportunity_id is not null then
    source_line := '来源：朋友圈 ' || to_char(new.date, 'MM"月"DD"日"') || ' ' || new.content;
    update public.opportunities
    set notes = case
      when coalesce(notes, '') = '' then source_line
      when position(source_line in notes) > 0 then notes
      else notes || E'\n' || source_line
    end
    where id = new.linked_opportunity_id
      and deleted_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists social_plans_link_opportunity_notes on public.social_plans;

create trigger social_plans_link_opportunity_notes
after insert or update of linked_opportunity_id on public.social_plans
for each row execute function public.social_plan_link_opportunity_notes();

revoke all on function public.social_plan_link_opportunity_notes() from public;
