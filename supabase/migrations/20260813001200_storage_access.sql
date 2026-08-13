-- Storage 角色化访问：按工作台职责开放私有 bucket 的读/写策略。
-- 所属工作台：全局（市场/设计/财务/成员头像共用）。
-- 权限：owner 已有全 bucket 策略（保留）；本迁移仅追加业务角色策略，不改已有策略。
-- 原则：与业务表 RLS 一致——design-assets 读=owner/boss/design、写=owner/design；
--       venue-photos/finance-receipts 读=owner/boss/market、写=owner/boss/market；
--       event-materials 读=owner/boss/market/design、写=owner/boss/market；
--       avatars 全员可读，成员仅可管理自己的头像目录（auth.uid()/），owner 可管理全部。

drop policy if exists "design collaborators can read design files" on storage.objects;
create policy "design collaborators can read design files"
on storage.objects for select to authenticated
using (
  bucket_id = 'design-assets'
  and public.has_any_role(array['owner','boss','design'])
);

drop policy if exists "design can upload design files" on storage.objects;
create policy "design can upload design files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'design-assets'
  and public.has_any_role(array['owner','design'])
);

drop policy if exists "design collaborators can update design files" on storage.objects;
create policy "design collaborators can update design files"
on storage.objects for update to authenticated
using (
  bucket_id = 'design-assets'
  and public.has_any_role(array['owner','boss','design'])
)
with check (
  bucket_id = 'design-assets'
  and public.has_any_role(array['owner','boss','design'])
);

drop policy if exists "design can delete design files" on storage.objects;
create policy "design can delete design files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'design-assets'
  and public.has_any_role(array['owner','design'])
);

drop policy if exists "market collaborators can read venue files" on storage.objects;
create policy "market collaborators can read venue files"
on storage.objects for select to authenticated
using (
  bucket_id = 'venue-photos'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "market can upload venue files" on storage.objects;
create policy "market can upload venue files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue-photos'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "market collaborators can update venue files" on storage.objects;
create policy "market collaborators can update venue files"
on storage.objects for update to authenticated
using (
  bucket_id = 'venue-photos'
  and public.has_any_role(array['owner','boss','market'])
)
with check (
  bucket_id = 'venue-photos'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "market can delete venue files" on storage.objects;
create policy "market can delete venue files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'venue-photos'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "material collaborators can read material files" on storage.objects;
create policy "material collaborators can read material files"
on storage.objects for select to authenticated
using (
  bucket_id = 'event-materials'
  and public.has_any_role(array['owner','boss','market','design'])
);

drop policy if exists "market can upload material files" on storage.objects;
create policy "market can upload material files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-materials'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "material collaborators can update material files" on storage.objects;
create policy "material collaborators can update material files"
on storage.objects for update to authenticated
using (
  bucket_id = 'event-materials'
  and public.has_any_role(array['owner','boss','market','design'])
)
with check (
  bucket_id = 'event-materials'
  and public.has_any_role(array['owner','boss','market','design'])
);

drop policy if exists "market can delete material files" on storage.objects;
create policy "market can delete material files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'event-materials'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "market collaborators can read finance files" on storage.objects;
create policy "market collaborators can read finance files"
on storage.objects for select to authenticated
using (
  bucket_id = 'finance-receipts'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "market can upload finance files" on storage.objects;
create policy "market can upload finance files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'finance-receipts'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "market collaborators can update finance files" on storage.objects;
create policy "market collaborators can update finance files"
on storage.objects for update to authenticated
using (
  bucket_id = 'finance-receipts'
  and public.has_any_role(array['owner','boss','market'])
)
with check (
  bucket_id = 'finance-receipts'
  and public.has_any_role(array['owner','boss','market'])
);

drop policy if exists "market can delete finance files" on storage.objects;
create policy "market can delete finance files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'finance-receipts'
  and public.has_any_role(array['owner','boss','market'])
);

-- 头像：全员可读（成员列表展示），成员管理自己的头像目录。
drop policy if exists "members can read avatars" on storage.objects;
create policy "members can read avatars"
on storage.objects for select to authenticated
using (bucket_id = 'avatars');

drop policy if exists "members can upload own avatars" on storage.objects;
create policy "members can upload own avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "members can update own avatars" on storage.objects;
create policy "members can update own avatars"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "members can delete own avatars" on storage.objects;
create policy "members can delete own avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
