-- 通知偏好过滤：所属全局通知中心；权限：由服务端触发器执行，默认开启。
create or replace function public.filter_disabled_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  enabled boolean;
begin
  select case
    when new.type = 'deadline' then deadline_enabled
    when new.type in ('opportunity_won', 'comment') then follow_up_enabled
    when new.type = 'design_review' then review_enabled
    else true
  end
  into enabled
  from public.notification_preferences
  where user_id = new.recipient_id;

  if coalesce(enabled, true) is false then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_filter_disabled_preference on public.notifications;
create trigger notifications_filter_disabled_preference
before insert on public.notifications
for each row execute function public.filter_disabled_notification();

revoke all on function public.filter_disabled_notification() from public;
