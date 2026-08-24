begin;
select plan(3);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '97000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'ai-note-eval@example.test', '', now(),
  '{}', '{"name":"AI Note Evaluator"}', now(), now()
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
insert into public.ai_notes (
  scope, task_type, prompt, result, owner_id, decision, decided_at
) values
  ('总览工作台', '分析', '采用建议', '建议一。', '97000000-0000-0000-0000-000000000003', 'adopted', now()),
  ('总览工作台', '分析', '忽略建议', '建议二。', '97000000-0000-0000-0000-000000000003', 'dismissed', now());

select is(
  (select count(*) from public.ai_notes where owner_id = '97000000-0000-0000-0000-000000000003' and decision = 'adopted'),
  1::bigint,
  'accepted suggestion remains a distinct human decision'
);
select is(
  (select count(*) from public.ai_notes where owner_id = '97000000-0000-0000-0000-000000000003' and decision = 'dismissed'),
  1::bigint,
  'dismissed suggestion remains a distinct human decision'
);
select is(
  (select count(*) from public.ai_notes where owner_id = '97000000-0000-0000-0000-000000000003' and decided_at is null),
  0::bigint,
  'final decisions always retain a decision timestamp'
);

select * from finish();
rollback;
