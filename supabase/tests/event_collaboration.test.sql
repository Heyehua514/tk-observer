begin;
select plan(32);

select has_table('public', 'events', 'events table exists');
select has_table('public', 'event_phases', 'event phases table exists');
select has_table('public', 'event_tasks', 'event tasks table exists');
select has_table('public', 'event_registrations', 'event registrations table exists');
select has_table('public', 'event_sponsorships', 'event sponsorships table exists');
select col_is_fk('public', 'event_tasks', 'event_id', 'tasks reference events');
select col_is_fk('public', 'event_tasks', 'phase_id', 'tasks reference phases');
select col_is_fk('public', 'event_sponsorships', 'event_id', 'sponsorships reference events');
select col_is_fk('public', 'event_sponsorships', 'client_id', 'sponsorships reference clients');
select has_check('public', 'events', 'events have value constraints');
select has_check('public', 'event_phases', 'event phases have value constraints');
select has_check('public', 'event_tasks', 'event tasks have value constraints');
select trigger_is(
  'public', 'event_tasks', 'event_tasks_validate_phase',
  'public', 'validate_event_task_phase'
);
select trigger_is(
  'public', 'event_tasks', 'event_tasks_enforce_collaborator_update',
  'public', 'enforce_event_task_collaborator_update'
);
select trigger_is(
  'public', 'event_tasks', 'event_tasks_refresh_phase_completion',
  'public', 'handle_event_task_phase_completion'
);
select policies_are('public', 'events', array[
  'event collaborators can read events',
  'event coordinators can create events',
  'event coordinators can update events',
  'owners can hard delete events'
]);
select policies_are('public', 'event_phases', array[
  'event coordinators can read phases',
  'event coordinators can create phases',
  'event coordinators can update phases',
  'owners can hard delete phases'
]);
select policies_are('public', 'event_tasks', array[
  'event coordinators can read tasks',
  'assigned collaborators can read tasks',
  'event coordinators can create tasks',
  'event coordinators can update tasks',
  'assigned collaborators can update tasks',
  'owners can hard delete tasks'
]);
select policies_are('public', 'event_registrations', array[
  'event coordinators can read registrations',
  'event coordinators can create registrations',
  'event coordinators can update registrations',
  'owners can hard delete registrations'
]);
select policies_are('public', 'event_sponsorships', array[
  'sponsorship collaborators can read sponsorships',
  'event coordinators can create sponsorships',
  'sponsorship collaborators can update sponsorships',
  'owners can hard delete sponsorships'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'event-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'event-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'event-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now()),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'event-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '30000000-0000-0000-0000-000000000001' then 'owner'
      when '30000000-0000-0000-0000-000000000002' then 'business'
      when '30000000-0000-0000-0000-000000000003' then 'market'
      when '30000000-0000-0000-0000-000000000004' then 'editing'
    end
where id::text like '30000000-0000-0000-0000-00000000000%';

insert into public.clients (id, name, industry, source, level)
values ('31000000-0000-0000-0000-000000000001', '活动赞助客户', 'brand', 'event', 'A');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.events (
    id, name, type, start_date, location_city, target_attendees, status, created_by
  ) values (
    '32000000-0000-0000-0000-000000000001', '金鳞会测试活动', 'closed_salon',
    now() + interval '30 days', '厦门', 50, 'preparing',
    '30000000-0000-0000-0000-000000000003'
  )
$$, 'market can create events');
select lives_ok($$
  insert into public.event_phases (
    id, event_id, name, phase_order, status
  ) values (
    '33000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001', 'P0 立项定档', 0, 'in_progress'
  )
$$, 'market can create phases');
select lives_ok($$
  insert into public.event_tasks (
    id, event_id, phase_id, title, assignee_role, assignee_id, status, priority
  ) values (
    '34000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0000-000000000001', '剪辑任务', 'editing',
    '30000000-0000-0000-0000-000000000004', 'todo', 'high'
  )
$$, 'market can create tasks');
select lives_ok($$
  insert into public.event_registrations (
    event_id, name, channel, confirmation_status, payment_status
  ) values (
    '32000000-0000-0000-0000-000000000001', '测试嘉宾', 'referral', 'confirmed', 'paid'
  )
$$, 'market can create registrations');
select lives_ok($$
  insert into public.event_sponsorships (
    id, event_id, client_id, contact_name, amount, stage
  ) values (
    '35000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001', '商务对接人', 200000, 'intent'
  )
$$, 'market can create sponsorships');

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.events), 1::bigint, 'business can read event names');
select is((select count(*) from public.event_sponsorships), 1::bigint, 'business can read sponsorships');
select lives_ok($$
  update public.event_sponsorships set stage = 'negotiating'
  where id = '35000000-0000-0000-0000-000000000001'
$$, 'business can update sponsorship follow-up state');

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select is((select count(*) from public.event_registrations), 0::bigint, 'editing cannot read registrations');

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select throws_ok($$
  insert into public.event_tasks (
    event_id, phase_id, title, assignee_role, status, priority
  ) values (
    gen_random_uuid(), '33000000-0000-0000-0000-000000000001',
    '错误活动任务', 'market', 'todo', 'medium'
  )
$$, '23503', 'event task phase must belong to the same event',
  'task and phase event mismatch is rejected');

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.events set deleted_at = now()
  where id = '32000000-0000-0000-0000-000000000001'
$$, 'owner can soft delete events');
select is(
  (select count(*) from public.events where deleted_at is not null),
  1::bigint,
  'owner can inspect soft-deleted events'
);

select * from finish();
rollback;
