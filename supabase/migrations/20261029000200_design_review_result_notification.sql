-- 设计稿审核结果通知：设计稿通过或驳回后，通知素材所有者并携带设计素材深链。
-- 权限：security definer 触发器写入，沿用通知偏好过滤与本人只读 RLS。

create or replace function public.notify_design_asset_owner_on_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_content text;
begin
  if old.status <> 'pending_review'
     or new.status not in ('approved', 'rejected')
     or new.owner_id is null
     or new.owner_id is not distinct from new.reviewed_by then
    return new;
  end if;

  if new.status = 'approved' then
    v_title := '设计稿已通过';
    v_content := '「' || new.file_name || '」已通过审核。';
  else
    v_title := '设计稿已驳回';
    v_content := '「' || new.file_name || '」未通过审核，原因：'
      || coalesce(nullif(btrim(new.review_reason), ''), '未填写驳回理由');
  end if;

  insert into public.notifications (
    recipient_id, type, title, content, link, record_type, record_id
  ) values (
    new.owner_id,
    'design_review',
    v_title,
    v_content,
    '/design',
    'design_asset',
    new.id::text
  );

  return new;
end;
$$;

drop trigger if exists design_assets_notify_owner_on_review on public.design_assets;
create trigger design_assets_notify_owner_on_review
after update of status on public.design_assets
for each row execute function public.notify_design_asset_owner_on_review();

revoke all on function public.notify_design_asset_owner_on_review() from public;