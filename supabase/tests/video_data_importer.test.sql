begin;

select plan(6);

select has_table('public', 'video_data_importers', 'video data importer capability exists');
select has_function('public', 'can_manage_video_data', 'video data importer check exists');
select policies_are('public', 'video_ideas', array[
  'video data importers can read video ideas',
  'video data importers can create video ideas',
  'video data importers can update video ideas'
], 'video idea importer policies are scoped');
select policies_are('public', 'import_history', array[
  'video data importers can read import history',
  'video data importers can create import history',
  'video data importers can invalidate import history'
], 'import history policies are scoped');
select policies_are('public', 'video_accounts', array[
  'video data importers can read video accounts',
  'video data importers can manage video accounts'
], 'video account policies are scoped');
select policies_are('public', 'video_sync_runs', array['video data importers can manage video sync runs'], 'sync run policy exists');

select * from finish();
rollback;
