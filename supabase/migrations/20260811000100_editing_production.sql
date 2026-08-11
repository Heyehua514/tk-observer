-- Supabase 剪辑生产核心与私有视频存储；权限：editing 制作，business 只读关联成片，owner/boss 监督。
create table public.video_tasks (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (char_length(title) between 1 and 180),
  product_name text check (char_length(product_name) <= 160),
  creator_name text check (char_length(creator_name) <= 120),
  status text not null default 'todo' check (status in ('todo','editing','review','done')),
  due_at timestamptz,
  owner_name text not null check (char_length(owner_name) between 1 and 80),
  region text not null check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (char_length(title) between 1 and 180),
  file_path text not null check (char_length(file_path) between 1 and 2000),
  product_name text check (char_length(product_name) <= 160),
  creator_name text check (char_length(creator_name) <= 120),
  publish_at timestamptz,
  region text not null check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  creator_id uuid references public.creators(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index video_tasks_status_due_idx on public.video_tasks (status, due_at)
where deleted_at is null;
create index videos_creator_publish_idx on public.videos (creator_id, publish_at desc)
where deleted_at is null;

create trigger video_tasks_set_updated_at before update on public.video_tasks
for each row execute function public.set_updated_at();
create trigger videos_set_updated_at before update on public.videos
for each row execute function public.set_updated_at();

alter table public.video_tasks enable row level security;
alter table public.videos enable row level security;
grant select, insert, update, delete on public.video_tasks to authenticated;
grant select, insert, update, delete on public.videos to authenticated;

create policy "editing collaborators can read video tasks" on public.video_tasks
for select to authenticated using (
  public.has_any_role(array['owner','boss','editing'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "editing collaborators can create video tasks" on public.video_tasks
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','editing']) and deleted_at is null
);
create policy "editing collaborators can update video tasks" on public.video_tasks
for update to authenticated
using (public.has_any_role(array['owner','boss','editing']))
with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete video tasks" on public.video_tasks
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "video collaborators can read videos" on public.videos
for select to authenticated using (
  public.has_any_role(array['owner','boss','editing','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "video editors can create videos" on public.videos
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','editing']) and deleted_at is null
);
create policy "video editors can update videos" on public.videos
for update to authenticated
using (public.has_any_role(array['owner','boss','editing']))
with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete videos" on public.videos
for delete to authenticated using (public.has_any_role(array['owner']));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'video-files', 'video-files', false, 536870912,
  array['video/mp4','video/webm','video/quicktime']
);

drop policy "owners can read private workspace files" on storage.objects;
drop policy "owners can upload private workspace files" on storage.objects;
drop policy "owners can update private workspace files" on storage.objects;
drop policy "owners can delete private workspace files" on storage.objects;

create policy "owners can read private workspace files"
on storage.objects for select to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts','video-files'])
  and public.has_any_role(array['owner'])
);
create policy "owners can upload private workspace files"
on storage.objects for insert to authenticated
with check (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts','video-files'])
  and public.has_any_role(array['owner'])
);
create policy "owners can update private workspace files"
on storage.objects for update to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts','video-files'])
  and public.has_any_role(array['owner'])
)
with check (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts','video-files'])
  and public.has_any_role(array['owner'])
);
create policy "owners can delete private workspace files"
on storage.objects for delete to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts','video-files'])
  and public.has_any_role(array['owner'])
);

create policy "video collaborators can read video files"
on storage.objects for select to authenticated
using (
  bucket_id = 'video-files'
  and public.has_any_role(array['owner','boss','editing','business'])
);
create policy "video editors can upload video files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'video-files'
  and public.has_any_role(array['owner','boss','editing'])
);
create policy "video editors can update video files"
on storage.objects for update to authenticated
using (
  bucket_id = 'video-files'
  and public.has_any_role(array['owner','boss','editing'])
)
with check (
  bucket_id = 'video-files'
  and public.has_any_role(array['owner','boss','editing'])
);
create policy "video editors can delete video files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'video-files'
  and public.has_any_role(array['owner','boss','editing'])
);
