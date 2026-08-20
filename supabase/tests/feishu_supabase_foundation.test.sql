begin;
select plan(12);

select has_table('public', 'feishu_connections', 'Feishu connections table exists');
select has_table('public', 'feishu_documents', 'Feishu documents table exists');
select has_table('public', 'feishu_sync_state', 'Feishu sync state table exists');
select col_is_pk('public', 'feishu_connections', 'user_id', 'one Feishu connection per member');
select has_column('public', 'feishu_connections', 'access_token_encrypted', 'access token is stored only as encrypted data');
select has_column('public', 'feishu_connections', 'refresh_token_encrypted', 'refresh token is stored only as encrypted data');
select has_function('public', 'get_my_feishu_connection', 'connection status RPC exists');
select policies_are('public', 'feishu_connections', array[]::text[], 'connection table has no browser-readable token policy');
select policies_are('public', 'feishu_documents', array[
  'members can read own feishu documents'
], 'documents are owner-scoped');
select policies_are('public', 'feishu_sync_state', array[
  'members can read own feishu sync state'
], 'sync state is owner-scoped');
select col_has_check('public', 'feishu_documents', 'source_type', 'documents restrict supported Feishu sources');
select col_has_check('public', 'feishu_sync_state', 'source_type', 'sync state restricts supported Feishu sources');

select * from finish();
rollback;
