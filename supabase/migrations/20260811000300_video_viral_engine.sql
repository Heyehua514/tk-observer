-- Supabase 爆款选题派生引擎；权限：客户端只写输入指标，数据库维护爆款与 AI 服务端字段。
create or replace function public.recalculate_video_idea_viral(target_account text)
returns void language plpgsql security definer set search_path = '' as $$
declare account_average numeric;
begin
  select avg(views) into account_average
  from public.video_ideas
  where account = target_account and deleted_at is null;

  update public.video_ideas
  set is_viral = (
    completion_rate >= 60
    or (
      coalesce(account_average, 0) > 0
      and views >= 2 * account_average
    )
  )
  where account = target_account
    and deleted_at is null
    and is_viral is distinct from (
      completion_rate >= 60
      or (
        coalesce(account_average, 0) > 0
        and views >= 2 * account_average
      )
    );
end;
$$;

create or replace function public.handle_video_idea_viral_recalculation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_video_idea_viral(old.account);
    return old;
  end if;

  perform public.recalculate_video_idea_viral(new.account);
  if tg_op = 'UPDATE' and old.account is distinct from new.account then
    perform public.recalculate_video_idea_viral(old.account);
  end if;
  return new;
end;
$$;

revoke all on function public.recalculate_video_idea_viral(text) from public;
revoke all on function public.handle_video_idea_viral_recalculation() from public;

create trigger video_ideas_recalculate_viral
after insert or delete or update of account, views, completion_rate, deleted_at
on public.video_ideas
for each row execute function public.handle_video_idea_viral_recalculation();

revoke insert, update on public.video_ideas from authenticated;
grant insert (
  account, video_type, title, description, source_url, tags, publish_date,
  views, likes, comments, shares, completion_rate, follower_gain
) on public.video_ideas to authenticated;
grant update (
  account, video_type, title, description, source_url, tags, publish_date,
  views, likes, comments, shares, completion_rate, follower_gain, deleted_at
) on public.video_ideas to authenticated;
grant all on public.video_ideas to service_role;
