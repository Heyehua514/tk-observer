-- 恢复 video_ideas 列级权限（表级 GRANT 覆盖后重收口）
-- 用途：20260813001300 对全表做 authenticated 表级 GRANT，覆盖了 video_viral_engine 原有的
--      列级收口，导致客户端可直写 is_viral / ai_analysis 派生字段。本 migration 重新
--      revoke 表级 insert/update 并只放行输入指标列，数据库继续维护爆款与 AI 派生字段。
-- 所属工作台：剪辑（谢洁）
-- 权限：authenticated 仅可写输入字段；is_viral / ai_analysis 由服务端函数维护。
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
