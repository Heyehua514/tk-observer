begin;
select plan(6);

select has_table('public', 'notification_preferences', 'notification preferences table exists');
select has_column('public', 'notification_preferences', 'deadline_enabled', 'deadline preference exists');
select has_column('public', 'notification_preferences', 'review_enabled', 'review preference exists');
select has_column('public', 'notification_preferences', 'follow_up_enabled', 'follow-up preference exists');
select policies_are(
  'public',
  'notification_preferences',
  array[
    'members can read own notification preferences',
    'members can insert own notification preferences',
    'members can update own notification preferences'
  ],
  'notification preferences are owner-scoped'
);
select col_is_pk('public', 'notification_preferences', 'user_id', 'user id is the preference primary key');

select * from finish();
rollback;
