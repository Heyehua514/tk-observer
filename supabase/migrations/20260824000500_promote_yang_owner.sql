-- 杨振康是项目维护者，升级为 owner 以维护成员、权限、数据和所有工作台。
update public.profiles
set role = 'owner', updated_at = now()
where name = '杨振康' and status in ('active', 'invited');

update public.member_invitations
set role = 'owner', updated_at = now()
where name = '杨振康' and status = 'invited';
