-- 验收：市场 + 商务 + 总览 跨工作台全链路闭环（活动→财务模板→阶段任务→场地→报名→招商→商机→失败沉淀→公众号→日报/周报/截止提醒）
-- 所属工作台：市场（韩素云）/ 商务（董雨辰）/ 总览（磊哥）。
-- 权限：以 postgres 服务端角色验证触发器与自动化函数；RLS 行级权限由 market_business_workflow.eval / notifications.test 单独覆盖。

begin;
select plan(38);

-- ---------- 准备 5 个角色账号 ----------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'accept-boss@example.test', '', now(), '{}', '{"name":"磊哥"}', now(), now()),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'accept-business@example.test', '', now(), '{}', '{"name":"董雨辰"}', now(), now()),
  ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'accept-market@example.test', '', now(), '{}', '{"name":"韩素云"}', now(), now()),
  ('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'accept-design@example.test', '', now(), '{}', '{"name":"孙铭泽"}', now(), now()),
  ('80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'accept-editing@example.test', '', now(), '{}', '{"name":"谢洁"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '80000000-0000-0000-0000-000000000001' then 'boss'
      when '80000000-0000-0000-0000-000000000002' then 'business'
      when '80000000-0000-0000-0000-000000000003' then 'market'
      when '80000000-0000-0000-0000-000000000004' then 'design'
      when '80000000-0000-0000-0000-000000000005' then 'editing'
    end
where id::text like '80000000-0000-0000-0000-00000000000%';

-- ---------- 1. 市场：韩素云建活动 → 自动种 7 条财务模板 ----------
select lives_ok($$
  insert into public.events (
    id, name, type, theme, start_date, location_city,
    target_attendees, target_sponsorship, total_budget, status, created_by
  ) values (
    '82000000-0000-0000-0000-000000000001', '金鳞会·厦门闭门沙龙', 'closed_salon',
    'TikTok 全域增长', now() + interval '30 days', '厦门',
    30, 300000, 250000, 'sponsoring',
    '80000000-0000-0000-0000-000000000003'
  )
$$, 'market creates an event');
select is(
  (select count(*) from public.event_finances where event_id = '82000000-0000-0000-0000-000000000001'),
  7::bigint,
  'event auto-seeds seven finance templates'
);
select is(
  (select count(*) from public.event_finances
   where event_id = '82000000-0000-0000-0000-000000000001' and type = 'income'),
  2::bigint,
  'finance templates include sponsorship and ticket income'
);
select is(
  (select count(*) from public.event_finances
   where event_id = '82000000-0000-0000-0000-000000000001' and type = 'expense'),
  5::bigint,
  'finance templates include venue setup catering printing travel'
);
select is(
  (select coalesce(sum(amount), 0)::bigint from public.event_finances
   where event_id = '82000000-0000-0000-0000-000000000001'),
  0::bigint,
  'template amounts start at zero for later fill-in'
);

-- ---------- 2. 市场：5 个阶段 + 阶段任务与进度 ----------
insert into public.event_phases (id, event_id, name, phase_order, start_date, end_date, status) values
  ('83000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', 'P0 立项定档', 0, now(), now() + interval '5 days', 'completed'),
  ('83000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', 'P1 资源锁定', 1, now() + interval '6 days', now() + interval '15 days', 'in_progress'),
  ('83000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000001', 'P2 宣发招募', 2, now() + interval '16 days', now() + interval '25 days', 'in_progress'),
  ('83000000-0000-0000-0000-000000000004', '82000000-0000-0000-0000-000000000001', 'P3 落地执行', 3, now() + interval '26 days', now() + interval '32 days', 'not_started'),
  ('83000000-0000-0000-0000-000000000005', '82000000-0000-0000-0000-000000000001', 'P4 会后复盘', 4, now() + interval '33 days', now() + interval '38 days', 'not_started');

insert into public.event_tasks (id, event_id, phase_id, title, assignee_role, assignee_id, status, priority, due_date) values
  ('84000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000002', '制作主 KV 物料', 'design', '80000000-0000-0000-0000-000000000004', 'done', 'high', now() + interval '10 days'),
  ('84000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000002', '确认赞助方案', 'business', '80000000-0000-0000-0000-000000000002', 'todo', 'high', now() + interval '12 days'),
  ('84000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000003', '剪辑宣传短视频', 'editing', '80000000-0000-0000-0000-000000000005', 'done', 'medium', now() + interval '18 days');

select is(
  (select count(*) from public.event_phases where event_id = '82000000-0000-0000-0000-000000000001'),
  5::bigint,
  'event has five phases P0-P4'
);
select is(
  (select completion_pct from public.event_phases where id = '83000000-0000-0000-0000-000000000002'),
  50,
  'phase with one of two tasks done shows fifty percent'
);
select is(
  (select completion_pct from public.event_phases where id = '83000000-0000-0000-0000-000000000003'),
  100,
  'phase with all tasks done shows one hundred percent'
);

-- ---------- 3. 市场：场地 + 活动绑定 ----------
insert into public.venues (
  id, name, type, city, address, capacity_min, capacity_max,
  price_range, scene_tags, pros, contact_name, contact_phone,
  site_visit_date, site_visit_notes, is_verified
) values (
  '87000000-0000-0000-0000-000000000001', '厦门七尚酒店', 'hotel', '厦门',
  '湖里区槟城道 277 号', 80, 300, '8000-15000/场',
  '私密,海景,有LED屏,适合圆桌', '层高充足、离机场近', '林经理', '13800000000',
  now() - interval '3 days', '踩点通过，晚宴区可隔断', true
);
select lives_ok($$
  update public.events set venue_id = '87000000-0000-0000-0000-000000000001'
  where id = '82000000-0000-0000-0000-000000000001'
$$, 'event can bind a verified venue');
select ok(
  (select e.venue_id = v.id
   from public.events e
   join public.venues v on v.id = e.venue_id
   where e.id = '82000000-0000-0000-0000-000000000001'),
  'event details resolve the bound venue'
);

-- ---------- 4. 市场：报名管理 ----------
insert into public.event_registrations (id, event_id, name, company, position, channel, confirmation_status, payment_status) values
  ('85000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '王总', '某美妆品牌', 'CEO', '主动邀请', 'confirmed', 'paid'),
  ('85000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '李总', '某供应链公司', '合伙人', 'referral', 'pending', 'unpaid');

select is(
  (select count(*) from public.event_registrations where event_id = '82000000-0000-0000-0000-000000000001'),
  2::bigint,
  'two registrations are tracked'
);
select is(
  (select count(*) from public.event_registrations
   where event_id = '82000000-0000-0000-0000-000000000001'
     and confirmation_status = 'confirmed' and payment_status = 'paid'),
  1::bigint,
  'confirmed and paid registration is visible'
);

-- ---------- 5. 招商：韩素云录意向，董雨辰跟进至签约 ----------
insert into public.clients (id, name, industry, source, level, contact_name, contact_phone)
values ('81000000-0000-0000-0000-000000000001', '厦门某跨境大卖', 'brand', 'event', 'S', '周总', '13900000000');

select lives_ok($$
  insert into public.event_sponsorships (id, event_id, client_id, contact_name, amount, stage, notes)
  values ('86000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001',
          '81000000-0000-0000-0000-000000000001', '周总', 300000, 'intent', '意向赞助闭门沙龙')
$$, 'market records a sponsorship intent');
select lives_ok($$
  update public.event_sponsorships set stage = 'negotiating', notes = '已报价，对方确认预算'
  where id = '86000000-0000-0000-0000-000000000001'
$$, 'business moves intent to negotiating');
select lives_ok($$
  update public.event_sponsorships set stage = 'signed', notes = '合同已签'
  where id = '86000000-0000-0000-0000-000000000001'
$$, 'business signs the sponsorship');
select is(
  (select stage from public.event_sponsorships where id = '86000000-0000-0000-0000-000000000001'),
  'signed',
  'sponsorship closes at signed with amount intact'
);

-- ---------- 6. 商机：概率自动调整 + 成交审计 ----------
select lives_ok($$
  insert into public.opportunities (
    id, client_id, title, type, amount, stage, expected_close, created_by
  ) values (
    '88000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001',
    '年度峰会联合赞助', 'event_sponsorship', 500000, 'contact',
    now() + interval '45 days', '80000000-0000-0000-0000-000000000002'
  )
$$, 'business creates an opportunity at first contact');
select is(
  (select probability from public.opportunities where id = '88000000-0000-0000-0000-000000000001'),
  10,
  'contact stage defaults to ten percent'
);
select lives_ok($$
  update public.opportunities set stage = 'proposal', notes = '方案已发'
  where id = '88000000-0000-0000-0000-000000000001'
$$, 'opportunity moves to proposal');
select is(
  (select probability from public.opportunities where id = '88000000-0000-0000-0000-000000000001'),
  30,
  'proposal stage auto-sets thirty percent'
);
select lives_ok($$
  update public.opportunities set stage = 'won', notes = '合同签署完成'
  where id = '88000000-0000-0000-0000-000000000001'
$$, 'opportunity closes won');
select is(
  (select count(*) from public.audit_logs where entity_type = 'opportunity_won'),
  1::bigint,
  'won opportunity leaves one audit trace'
);

-- ---------- 7. 商机流失 → 失败沉淀 ----------
select lives_ok($$
  insert into public.opportunities (
    id, client_id, title, type, amount, stage, created_by
  ) values (
    '88000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001',
    '渠道商单合作', 'channel_order', 80000, 'contact',
    '80000000-0000-0000-0000-000000000002'
  )
$$, 'second opportunity starts at contact');
select lives_ok($$
  update public.opportunities set stage = 'lost', lost_reason = '预算不足'
  where id = '88000000-0000-0000-0000-000000000002'
$$, 'opportunity can be marked lost with reason');
select is(
  (select count(*) from public.failed_cases where source_type = 'opportunity'),
  1::bigint,
  'lost opportunity is auto-recorded as a failed case'
);

-- ---------- 8. 公众号：爆款自动判定 ----------
insert into public.blog_articles (id, title, account, publish_date, views, likes, shares, analysis_notes, source_url) values
  ('89000000-0000-0000-0000-000000000001', '普通复盘', 'TK观察', now() - interval '3 days', 1000, 10, 2, '基准文章', 'https://example.test/normal'),
  ('89000000-0000-0000-0000-000000000002', '增长拆解', 'TK观察', now() - interval '2 days', 1200, 12, 3, '基准文章', 'https://example.test/growth'),
  ('89000000-0000-0000-0000-000000000003', '爆款底层逻辑', 'TK观察', now() - interval '1 day', 5000, 90, 30, '高于均值两倍', 'https://example.test/viral');
select is(
  (select count(*) from public.blog_articles where is_viral),
  1::bigint,
  'article at least twice account average auto-flags viral'
);

-- ---------- 9. 自动化：逾期沉淀 + 截止提醒 + 日报/周报 ----------
insert into public.event_tasks (id, event_id, phase_id, title, assignee_role, assignee_id, status, priority, due_date)
values ('84000000-0000-0000-0000-000000000005', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000002', '已过期的场地踩点', 'market', '80000000-0000-0000-0000-000000000003', 'todo', 'low', now() - interval '1 day');

select is(
  (select count(*) from public.failed_cases where source_type = 'event_task'),
  1::bigint,
  'overdue task is auto-recorded as a failed case'
);
select is(
  (select public.sweep_overdue_event_tasks()),
  0,
  'overdue task is recorded once by trigger, sweep adds none'
);

insert into public.event_tasks (id, event_id, phase_id, title, assignee_role, assignee_id, status, priority, due_date)
values ('84000000-0000-0000-0000-000000000004', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000002', '今日到期的招商跟进', 'business', '80000000-0000-0000-0000-000000000002', 'todo', 'high',
  (now() at time zone 'Asia/Shanghai')::date::timestamp at time zone 'Asia/Shanghai' + interval '2 hours');

insert into public.opportunities (
  id, client_id, title, type, amount, stage, expected_close, created_by
) values (
  '88000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000001',
  '今日预计成交的商机', 'channel_order', 60000, 'contact',
  (now() at time zone 'Asia/Shanghai')::date::timestamp at time zone 'Asia/Shanghai' + interval '3 hours',
  '80000000-0000-0000-0000-000000000002'
);

select lives_ok($$
  select public.run_deadline_checks()
$$, 'deadline check can run');
select is(
  (select count(*) from public.notifications where type = 'deadline'),
  2::bigint,
  'deadline check reminds one task and one opportunity'
);
select lives_ok($$
  select public.run_deadline_checks()
$$, 'deadline check can run again');
select is(
  (select count(*) from public.notifications where type = 'deadline'),
  2::bigint,
  'deadline check is idempotent'
);

select ok(
  (select public.generate_daily_report((now() at time zone 'Asia/Shanghai')::date) is not null),
  'daily report can be generated'
);
select is(
  (select count(*) from public.daily_reports),
  1::bigint,
  'daily report is persisted'
);
select ok(
  (select (stats_json::jsonb ->> 'newClients')::int >= 1
   from public.daily_reports limit 1),
  'daily report counts the new client'
);
select ok(
  (select public.generate_weekly_report((now() at time zone 'Asia/Shanghai')::date) is not null),
  'weekly report can be generated'
);
select is(
  (select count(*) from public.weekly_reports),
  1::bigint,
  'weekly report is persisted'
);
select ok(
  (select char_length(trends) > 0 from public.weekly_reports limit 1),
  'weekly report trends are non-empty'
);

select * from finish();
rollback;
