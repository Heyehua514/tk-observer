begin;
select plan(12);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'member_invitations', 'member invitations table exists');
select has_function('public', 'current_user_role', array[]::text[]);
select has_function('public', 'current_user_status', array[]::text[]);
select has_function('public', 'has_any_role', array['text[]']);
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
select trigger_is(
  'auth', 'users', 'on_auth_user_created',
  'public', 'handle_new_auth_user'
);

select * from finish();
rollback;
