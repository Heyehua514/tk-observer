-- Five-role read/write matrix for collection-level RLS.
-- Roles: boss, business, market, design, editing.
-- Matrix: read permits overview only for boss; clients for boss/business/market;
--         radars for boss/market; design tasks for boss/design; video tasks for boss/editing;
--         intelligence for every active member. Boss may write every collection; each
--         workbench role writes only its own collection, with intelligence writes self-scoped.

begin;
select plan(60);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix-boss@example.test', '', now(), '{}', '{"name":"Matrix Boss"}', now(), now()),
  ('e1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix-business@example.test', '', now(), '{}', '{"name":"Matrix Business"}', now(), now()),
  ('e1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix-market@example.test', '', now(), '{}', '{"name":"Matrix Market"}', now(), now()),
  ('e1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix-design@example.test', '', now(), '{}', '{"name":"Matrix Design"}', now(), now()),
  ('e1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix-editing@example.test', '', now(), '{}', '{"name":"Matrix Editing"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when 'e1000000-0000-0000-0000-000000000001' then 'boss'
      when 'e1000000-0000-0000-0000-000000000002' then 'business'
      when 'e1000000-0000-0000-0000-000000000003' then 'market'
      when 'e1000000-0000-0000-0000-000000000004' then 'design'
      when 'e1000000-0000-0000-0000-000000000005' then 'editing'
    end
where id in (
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000002',
  'e1000000-0000-0000-0000-000000000003',
  'e1000000-0000-0000-0000-000000000004',
  'e1000000-0000-0000-0000-000000000005'
);

insert into public.gmv_metrics (
  id, metric_date, amount_minor, currency, region
) values (
  'f1000000-0000-0000-0000-000000000001', now(), 100000, 'CNY', 'US'
);

insert into public.clients (
  id, name, industry, source, level
) values (
  'f1000000-0000-0000-0000-000000000002', 'Matrix Client', 'brand', 'outbound', 'A'
);

insert into public.product_radars (
  id, title, category
) values (
  'f1000000-0000-0000-0000-000000000003', 'Matrix Radar', 'beauty'
);

insert into public.design_tasks (
  id, title, region
) values (
  'f1000000-0000-0000-0000-000000000004', 'Matrix Design Task', 'US'
);

insert into public.video_tasks (
  id, title, owner_name, region
) values (
  'f1000000-0000-0000-0000-000000000005', 'Matrix Video Task', 'Matrix Editor', 'US'
);

insert into public.intelligence_items (
  id, title, source_name, source_type, source_url, dedupe_key, created_by
) values
  ('f1000000-0000-0000-0000-000000000006', 'Boss Intel', 'Source', 'manual', 'https://example.com/boss-intel', 'matrix-read-boss', 'e1000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000007', 'Business Intel', 'Source', 'manual', 'https://example.com/business-intel', 'matrix-read-business', 'e1000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000008', 'Market Intel', 'Source', 'manual', 'https://example.com/market-intel', 'matrix-read-market', 'e1000000-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000009', 'Design Intel', 'Source', 'manual', 'https://example.com/design-intel', 'matrix-read-design', 'e1000000-0000-0000-0000-000000000004'),
  ('f1000000-0000-0000-0000-000000000010', 'Editing Intel', 'Source', 'manual', 'https://example.com/editing-intel', 'matrix-read-editing', 'e1000000-0000-0000-0000-000000000005');

set local role authenticated;

-- Read matrix (30 assertions).
select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is((select count(*) from public.gmv_metrics), 1::bigint, 'boss reads gmv metrics');
select is((select count(*) from public.clients), 1::bigint, 'boss reads clients');
select is((select count(*) from public.product_radars), 1::bigint, 'boss reads product radars');
select is((select count(*) from public.design_tasks), 1::bigint, 'boss reads design tasks');
select is((select count(*) from public.video_tasks), 1::bigint, 'boss reads video tasks');
select is((select count(*) from public.intelligence_items), 5::bigint, 'boss reads intelligence items');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.gmv_metrics), 0::bigint, 'business cannot read gmv metrics');
select is((select count(*) from public.clients), 1::bigint, 'business reads clients');
select is((select count(*) from public.product_radars), 0::bigint, 'business cannot read product radars');
select is((select count(*) from public.design_tasks), 0::bigint, 'business cannot read design tasks');
select is((select count(*) from public.video_tasks), 0::bigint, 'business cannot read video tasks');
select is((select count(*) from public.intelligence_items), 5::bigint, 'business reads intelligence items');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.gmv_metrics), 0::bigint, 'market cannot read gmv metrics');
select is((select count(*) from public.clients), 1::bigint, 'market reads clients');
select is((select count(*) from public.product_radars), 1::bigint, 'market reads product radars');
select is((select count(*) from public.design_tasks), 0::bigint, 'market cannot read design tasks');
select is((select count(*) from public.video_tasks), 0::bigint, 'market cannot read video tasks');
select is((select count(*) from public.intelligence_items), 5::bigint, 'market reads intelligence items');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select is((select count(*) from public.gmv_metrics), 0::bigint, 'design cannot read gmv metrics');
select is((select count(*) from public.clients), 0::bigint, 'design cannot read clients');
select is((select count(*) from public.product_radars), 0::bigint, 'design cannot read product radars');
select is((select count(*) from public.design_tasks), 1::bigint, 'design reads design tasks');
select is((select count(*) from public.video_tasks), 0::bigint, 'design cannot read video tasks');
select is((select count(*) from public.intelligence_items), 5::bigint, 'design reads intelligence items');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
select is((select count(*) from public.gmv_metrics), 0::bigint, 'editing cannot read gmv metrics');
select is((select count(*) from public.clients), 0::bigint, 'editing cannot read clients');
select is((select count(*) from public.product_radars), 0::bigint, 'editing cannot read product radars');
select is((select count(*) from public.design_tasks), 0::bigint, 'editing cannot read design tasks');
select is((select count(*) from public.video_tasks), 1::bigint, 'editing reads video tasks');
select is((select count(*) from public.intelligence_items), 5::bigint, 'editing reads intelligence items');

-- Write matrix (30 assertions). Every insert is validated and rolled back.
select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.gmv_metrics (metric_date, amount_minor, currency, region)
  values (now(), 200000, 'CNY', 'US')
$$, 'boss writes gmv metrics');
select lives_ok($$
  insert into public.clients (name, industry, source, level)
  values ('Boss Client', 'brand', 'outbound', 'A')
$$, 'boss writes clients');
select lives_ok($$
  insert into public.product_radars (title, category)
  values ('Boss Radar', 'beauty')
$$, 'boss writes product radars');
select lives_ok($$
  insert into public.design_tasks (title, region)
  values ('Boss Design Task', 'US')
$$, 'boss writes design tasks');
select lives_ok($$
  insert into public.video_tasks (title, owner_name, region)
  values ('Boss Video Task', 'Boss Editor', 'US')
$$, 'boss writes video tasks');
select lives_ok($$
  insert into public.intelligence_items (
    title, source_name, source_type, source_url, dedupe_key, created_by
  ) values (
    'Boss Write Intel', 'Source', 'manual', 'https://example.com/write-boss',
    'matrix-write-boss', 'e1000000-0000-0000-0000-000000000001'
  )
$$, 'boss writes own intelligence');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select throws_ok($$
  insert into public.gmv_metrics (metric_date, amount_minor, currency, region)
  values (now(), 300000, 'CNY', 'US')
$$, '42501', null, 'business cannot write gmv metrics');
select lives_ok($$
  insert into public.clients (name, industry, source, level)
  values ('Business Client', 'brand', 'outbound', 'B')
$$, 'business writes clients');
select throws_ok($$
  insert into public.product_radars (title, category)
  values ('Business Radar', 'beauty')
$$, '42501', null, 'business cannot write product radars');
select throws_ok($$
  insert into public.design_tasks (title, region)
  values ('Business Design Task', 'US')
$$, '42501', null, 'business cannot write design tasks');
select throws_ok($$
  insert into public.video_tasks (title, owner_name, region)
  values ('Business Video Task', 'Business Editor', 'US')
$$, '42501', null, 'business cannot write video tasks');
select lives_ok($$
  insert into public.intelligence_items (
    title, source_name, source_type, source_url, dedupe_key, created_by
  ) values (
    'Business Write Intel', 'Source', 'manual', 'https://example.com/write-business',
    'matrix-write-business', 'e1000000-0000-0000-0000-000000000002'
  )
$$, 'business writes own intelligence');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select throws_ok($$
  insert into public.gmv_metrics (metric_date, amount_minor, currency, region)
  values (now(), 400000, 'CNY', 'US')
$$, '42501', null, 'market cannot write gmv metrics');
select throws_ok($$
  insert into public.clients (name, industry, source, level)
  values ('Market Client', 'brand', 'outbound', 'C')
$$, '42501', null, 'market cannot write clients');
select lives_ok($$
  insert into public.product_radars (title, category)
  values ('Market Radar', 'beauty')
$$, 'market writes product radars');
select throws_ok($$
  insert into public.design_tasks (title, region)
  values ('Market Design Task', 'US')
$$, '42501', null, 'market cannot write design tasks');
select throws_ok($$
  insert into public.video_tasks (title, owner_name, region)
  values ('Market Video Task', 'Market Editor', 'US')
$$, '42501', null, 'market cannot write video tasks');
select lives_ok($$
  insert into public.intelligence_items (
    title, source_name, source_type, source_url, dedupe_key, created_by
  ) values (
    'Market Write Intel', 'Source', 'manual', 'https://example.com/write-market',
    'matrix-write-market', 'e1000000-0000-0000-0000-000000000003'
  )
$$, 'market writes own intelligence');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select throws_ok($$
  insert into public.gmv_metrics (metric_date, amount_minor, currency, region)
  values (now(), 500000, 'CNY', 'US')
$$, '42501', null, 'design cannot write gmv metrics');
select throws_ok($$
  insert into public.clients (name, industry, source, level)
  values ('Design Client', 'brand', 'outbound', 'C')
$$, '42501', null, 'design cannot write clients');
select throws_ok($$
  insert into public.product_radars (title, category)
  values ('Design Radar', 'beauty')
$$, '42501', null, 'design cannot write product radars');
select lives_ok($$
  insert into public.design_tasks (title, region)
  values ('Design Write Task', 'US')
$$, 'design writes design tasks');
select throws_ok($$
  insert into public.video_tasks (title, owner_name, region)
  values ('Design Video Task', 'Design Editor', 'US')
$$, '42501', null, 'design cannot write video tasks');
select lives_ok($$
  insert into public.intelligence_items (
    title, source_name, source_type, source_url, dedupe_key, created_by
  ) values (
    'Design Write Intel', 'Source', 'manual', 'https://example.com/write-design',
    'matrix-write-design', 'e1000000-0000-0000-0000-000000000004'
  )
$$, 'design writes own intelligence');

select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
select throws_ok($$
  insert into public.gmv_metrics (metric_date, amount_minor, currency, region)
  values (now(), 600000, 'CNY', 'US')
$$, '42501', null, 'editing cannot write gmv metrics');
select throws_ok($$
  insert into public.clients (name, industry, source, level)
  values ('Editing Client', 'brand', 'outbound', 'C')
$$, '42501', null, 'editing cannot write clients');
select throws_ok($$
  insert into public.product_radars (title, category)
  values ('Editing Radar', 'beauty')
$$, '42501', null, 'editing cannot write product radars');
select throws_ok($$
  insert into public.design_tasks (title, region)
  values ('Editing Design Task', 'US')
$$, '42501', null, 'editing cannot write design tasks');
select lives_ok($$
  insert into public.video_tasks (title, owner_name, region)
  values ('Editing Write Task', 'Editing Editor', 'US')
$$, 'editing writes video tasks');
select lives_ok($$
  insert into public.intelligence_items (
    title, source_name, source_type, source_url, dedupe_key, created_by
  ) values (
    'Editing Write Intel', 'Source', 'manual', 'https://example.com/write-editing',
    'matrix-write-editing', 'e1000000-0000-0000-0000-000000000005'
  )
$$, 'editing writes own intelligence');

select * from finish();
rollback;