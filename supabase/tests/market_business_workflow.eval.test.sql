begin;
select plan(6);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eval-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eval-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now()),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eval-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '40000000-0000-0000-0000-000000000001' then 'business'
      when '40000000-0000-0000-0000-000000000002' then 'market'
      when '40000000-0000-0000-0000-000000000003' then 'editing'
    end
where id::text like '40000000-0000-0000-0000-00000000000%';

insert into public.clients (id, name, industry, source, level)
values ('41000000-0000-0000-0000-000000000001', '闭环客户', 'brand', 'event', 'S');
insert into public.events (
  id, name, type, start_date, location_city, target_attendees,
  target_sponsorship, status, created_by
) values (
  '42000000-0000-0000-0000-000000000001', '闭环活动', 'annual_summit',
  now() + interval '60 days', '深圳', 100, 500000, 'sponsoring',
  '40000000-0000-0000-0000-000000000002'
);
insert into public.event_phases (id, event_id, name, phase_order, status)
values (
  '43000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001', 'P1 资源锁定', 1, 'in_progress'
);
insert into public.event_tasks (
  id, event_id, phase_id, title, assignee_role, assignee_id, status, priority
) values
  ('44000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', '完成剪辑物料', 'editing', '40000000-0000-0000-0000-000000000003', 'todo', 'high'),
  ('44000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', '确认赞助方案', 'business', '40000000-0000-0000-0000-000000000001', 'todo', 'high');
insert into public.event_sponsorships (
  id, event_id, client_id, amount, stage
) values (
  '45000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000001', 500000, 'intent'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.event_tasks set status = 'done'
  where id = '44000000-0000-0000-0000-000000000001'
$$, 'editing completes its assigned task');
select throws_ok($$
  update public.event_tasks set title = '越权改标题'
  where id = '44000000-0000-0000-0000-000000000001'
$$, '42501', 'assigned collaborators may only update event task status and notes',
  'editing cannot rewrite task ownership fields');

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is(
  (select completion_pct from public.event_phases where id = '43000000-0000-0000-0000-000000000001'),
  50,
  'one of two completed tasks yields 50 percent'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.event_tasks set status = 'done'
  where id = '44000000-0000-0000-0000-000000000002'
$$, 'business completes its assigned task');
select lives_ok($$
  update public.event_sponsorships set stage = 'signed'
  where id = '45000000-0000-0000-0000-000000000001'
$$, 'business signs the sponsorship');

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select results_eq(
  $$ select p.completion_pct, s.stage
     from public.event_phases p
     join public.event_sponsorships s on s.event_id = p.event_id
     where p.id = '43000000-0000-0000-0000-000000000001' $$,
  $$ values (100, 'signed'::text) $$,
  'activity workflow closes with complete tasks and signed sponsorship'
);

select * from finish();
rollback;
