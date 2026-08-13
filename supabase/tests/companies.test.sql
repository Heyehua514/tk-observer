begin;
select plan(9);

select has_table('public', 'companies', 'companies table exists');
select has_check('public', 'companies', 'companies have kind and region checks');
select policies_are('public', 'companies', array[
  'business collaborators can read companies',
  'business can manage companies'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'company-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'company-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'company-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when 'c0000000-0000-0000-0000-000000000001' then 'business'
      when 'c0000000-0000-0000-0000-000000000002' then 'boss'
      when 'c0000000-0000-0000-0000-000000000003' then 'market'
    end
where id::text like 'c0000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.companies (
    company_name, kind, contact_name, contact_email, region
  ) values (
    '出海供应商', 'supplier', '王总', 'wang@example.test', 'US'
  )
$$, 'business can create company');
select is(
  (select count(*) from public.companies where company_name = '出海供应商'),
  1::bigint,
  'business can read companies'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.companies where company_name = '出海供应商'),
  1::bigint,
  'boss can read companies'
);
update public.companies set company_name = '老板越权修改';
select is((select count(*) from public.companies where company_name = '老板越权修改'), 0::bigint, 'boss cannot update companies');

select set_config(
  'request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.companies), 0::bigint, 'market cannot read companies');
select throws_ok($$
  insert into public.companies (
    company_name, kind
  ) values (
    '市场越权', 'client'
  )
$$, '42501', null, 'market cannot create company');

select * from finish();
rollback;
