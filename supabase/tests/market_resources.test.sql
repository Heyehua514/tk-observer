begin;
select plan(21);

select has_table('public', 'venues', 'venues table exists');
select has_table('public', 'event_templates', 'event templates table exists');
select has_table('public', 'event_materials', 'event materials table exists');
select has_table('public', 'event_finances', 'event finances table exists');
select col_is_fk('public', 'events', 'venue_id', 'events reference venues');
select col_is_fk('public', 'event_materials', 'event_id', 'materials reference events');
select col_is_fk('public', 'event_materials', 'designer_id', 'materials reference designer profile');
select col_is_fk('public', 'event_finances', 'event_id', 'finances reference events');
select has_check('public', 'venues', 'venues have capacity and enum checks');
select has_check('public', 'event_finances', 'finances have amount and category checks');
select policies_are('public', 'venues', array[
  'market collaborators can read venues',
  'market can manage venues'
]);
select policies_are('public', 'event_finances', array[
  'market collaborators can read finances',
  'market can manage finances'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'market-resource-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'market-resource-user@example.test', '', now(), '{}', '{"name":"Market"}', now(), now()),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'market-resource-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '70000000-0000-0000-0000-000000000001' then 'owner'
      when '70000000-0000-0000-0000-000000000002' then 'market'
      when '70000000-0000-0000-0000-000000000003' then 'business'
    end
where id::text like '70000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.venues (
    id, name, type, city, capacity_min, capacity_max, is_verified
  ) values (
    '71000000-0000-0000-0000-000000000001', '厦门海景酒店', 'hotel', '厦门', 30, 100, true
  )
$$, 'market can create venue');
select lives_ok($$
  insert into public.events (
    id, name, type, start_date, location_city, venue_id
  ) values (
    '72000000-0000-0000-0000-000000000001', '厦门沙龙', 'closed_salon',
    now() + interval '10 days', '厦门', '71000000-0000-0000-0000-000000000001'
  )
$$, 'market can create event with venue');
select is(
  (select count(*) from public.event_finances where event_id = '72000000-0000-0000-0000-000000000001'),
  7::bigint,
  'creating event seeds 7 finance templates'
);
select is(
  (select min(amount) from public.event_finances where event_id = '72000000-0000-0000-0000-000000000001'),
  0::bigint,
  'finance templates start with amount 0'
);
select lives_ok($$
  insert into public.event_templates (
    name, type, event_type, content, tags
  ) values (
    '闭门沙龙邀约', 'invitation', 'closed_salon', '邀请您参加 {{活动名称}}', '邀约'
  )
$$, 'market can create template');
select lives_ok($$
  insert into public.event_materials (
    event_id, type, name, status
  ) values (
    '72000000-0000-0000-0000-000000000001', 'poster', '活动海报', 'designing'
  )
$$, 'market can create material');
select lives_ok($$
  insert into public.event_finances (
    event_id, category, type, amount, description
  ) values (
    '72000000-0000-0000-0000-000000000001', 'venue', 'expense', 100000, '场地费'
  )
$$, 'market can create valid expense');
select throws_ok($$
  insert into public.event_finances (
    event_id, category, type, amount, description
  ) values (
    '72000000-0000-0000-0000-000000000001', 'venue', 'income', 100000, '错误收入'
  )
$$, '23514', null, 'finance category must match type');

select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.venues), 0::bigint, 'business cannot read market venues');

select * from finish();
rollback;
