-- Supabase 剪辑生产/研究核心 Realtime 发布；权限继续由各表 RLS 控制。
alter table public.video_tasks replica identity full;
alter table public.videos replica identity full;
alter table public.video_ideas replica identity full;
alter table public.import_history replica identity full;
alter table public.competitor_accounts replica identity full;
alter table public.competitor_videos replica identity full;
alter table public.trending_topics replica identity full;
alter table public.competitor_style_analysis replica identity full;

alter publication supabase_realtime add table
  public.video_tasks,
  public.videos,
  public.video_ideas,
  public.import_history,
  public.competitor_accounts,
  public.competitor_videos,
  public.trending_topics,
  public.competitor_style_analysis;
