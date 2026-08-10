-- Supabase 市场/商务核心 Realtime 发布；权限继续由各表 RLS 控制。
alter table public.creators replica identity full;
alter table public.clients replica identity full;
alter table public.opportunities replica identity full;
alter table public.channel_orders replica identity full;
alter table public.social_plans replica identity full;
alter table public.events replica identity full;
alter table public.event_phases replica identity full;
alter table public.event_tasks replica identity full;
alter table public.event_registrations replica identity full;
alter table public.event_sponsorships replica identity full;

alter publication supabase_realtime add table
  public.creators,
  public.clients,
  public.opportunities,
  public.channel_orders,
  public.social_plans,
  public.events,
  public.event_phases,
  public.event_tasks,
  public.event_registrations,
  public.event_sponsorships;
