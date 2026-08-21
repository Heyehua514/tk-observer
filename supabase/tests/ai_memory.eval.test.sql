begin;
select plan(2);
select has_check('public', 'ai_memory', 'ai_memory_memory_value_check', 'memory value is bounded');
select has_check('public', 'ai_memory', 'ai_memory_confidence_check', 'confidence is bounded');
select * from finish();
rollback;
