-- 设计审核提醒：所属全局通知中心；权限：security definer 触发器写入，老板接收。
alter table public.notifications
  drop constraint if exists notifications_record_type_check;

alter table public.notifications
  add constraint notifications_record_type_check
  check (record_type is null or record_type in ('opportunity', 'event_task', 'design_asset'));

create or replace function public.notify_boss_on_design_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending_review' and old.status is distinct from 'pending_review' then
    insert into public.notifications (
      recipient_id, type, title, content, link, record_type, record_id
    )
    select p.id,
      'design_review',
      '设计稿待审核',
      '「' || new.file_name || '」已提交审核，请及时处理。',
      '/design',
      'design_asset',
      new.id::text
    from public.profiles p
    where p.role = 'boss'
      and p.status = 'active'
      and not exists (
        select 1 from public.notifications n
        where n.recipient_id = p.id
          and n.type = 'design_review'
          and n.record_type = 'design_asset'
          and n.record_id = new.id::text
          and n.deleted_at is null
      );
  end if;
  return new;
end;
$$;

drop trigger if exists design_assets_notify_boss_on_review on public.design_assets;
create trigger design_assets_notify_boss_on_review
after update of status on public.design_assets
for each row execute function public.notify_boss_on_design_review();

revoke all on function public.notify_boss_on_design_review() from public;
