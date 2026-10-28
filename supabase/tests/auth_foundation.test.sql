begin;
select plan(18);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'member_invitations', 'member invitations table exists');
select has_function('public', 'current_user_role', array[]::text[]);
select has_function('public', 'current_user_status', array[]::text[]);
select has_function('public', 'has_any_role', array['text[]']);
select has_function('public', 'guard_member_invitation_transition', array[]::text[]);
select policies_are('public', 'profiles', array[
  'active members can read active profiles',
  'owners can manage profiles'
]);
select policies_are('public', 'member_invitations', array[
  'owners can read invitations',
  'owners can create invitations',
  'owners can update invitations'
]);
select col_is_pk('public', 'profiles', 'id', 'profiles id is the primary key');
select col_is_fk('public', 'profiles', 'id', 'profiles id references auth users');
select col_is_unique('public', 'member_invitations', 'email', 'invitation email is unique');
select has_column('public', 'profiles', 'legacy_id', 'profiles retain the PocketBase legacy id');
select has_column('public', 'profiles', 'approved_at', 'profiles record invitation approval time');
select has_column('public', 'profiles', 'approved_by', 'profiles record invitation approver');
select has_index('public', 'profiles', 'profiles_status_idx', 'profiles status is indexed');
select trigger_is(
  'auth', 'users', 'on_auth_user_created',
  'public', 'handle_new_auth_user'
);
select trigger_is(
  'public', 'member_invitations', 'member_invitation_links_pending_profile',
  'public', 'link_invitation_to_pending_profile'
);

select trigger_is(
  'public', 'member_invitations', 'member_invitations_guard_transition',
  'public', 'guard_member_invitation_transition'
);

select * from finish();
rollback;
