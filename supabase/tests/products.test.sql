begin;
select plan(9);

select has_table('public', 'products', 'products table exists');
select has_check('public', 'products', 'products have price and status checks');
select policies_are('public', 'products', array[
  'market collaborators can read products',
  'market can manage products'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'product-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now()),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'product-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'product-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when 'b0000000-0000-0000-0000-000000000001' then 'market'
      when 'b0000000-0000-0000-0000-000000000002' then 'boss'
      when 'b0000000-0000-0000-0000-000000000003' then 'business'
    end
where id::text like 'b0000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.products (
    name, category, price_minor, cost_minor, currency, region, status
  ) values (
    '蓝牙音箱', 'electronics', 19900, 9200, 'CNY', 'US', 'active'
  )
$$, 'market can create product');
select is((select count(*) from public.products), 1::bigint, 'market can read products');

select set_config(
  'request.jwt.claims',
  '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.products), 1::bigint, 'boss can read products');
update public.products set status = 'paused';
select is((select count(*) from public.products where status = 'paused'), 0::bigint, 'boss cannot update products');

select set_config(
  'request.jwt.claims',
  '{"sub":"b0000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.products), 0::bigint, 'business cannot read products');
select throws_ok($$
  insert into public.products (
    name, category, price_minor, cost_minor
  ) values (
    '越权商品', 'electronics', 1, 1
  )
$$, '42501', null, 'business cannot create product');

select * from finish();
rollback;
