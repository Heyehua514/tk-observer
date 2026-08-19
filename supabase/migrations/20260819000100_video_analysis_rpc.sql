-- WorkBuddy 视频分析结果回写 RPC
-- 用途：前端取得 WorkBuddy 结构化分析后，安全写回 video_ideas.ai_analysis / analyzed_at。
--      受限 authenticated 不能直写 ai_analysis（列级收口），故经本 security definer RPC 落库。
-- 所属工作台：剪辑（谢洁）
-- 权限：owner/boss/editing 可调用；服务端以调用者角色校验后写入。
create or replace function public.write_video_idea_analysis(
  target_id uuid,
  analysis text,
  analyzed timestamp with time zone
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_any_role(array['owner','boss','editing']) then
    raise exception 'FORBIDDEN';
  end if;
  if char_length(coalesce(analysis,'')) > 10000 then
    raise exception 'ANALYSIS_TOO_LONG';
  end if;
  update public.video_ideas
  set ai_analysis = analysis, analyzed_at = coalesce(analyzed, now())
  where id = target_id and deleted_at is null;
end;
$$;

revoke all on function public.write_video_idea_analysis(uuid, text, timestamp with time zone) from public;
grant execute on function public.write_video_idea_analysis(uuid, text, timestamp with time zone) to authenticated;
