-- AI 建议需由记录所有者明确采用或忽略；该状态不触发任何业务实体写入。
alter table public.ai_notes
  add column decision text not null default 'pending'
    constraint ai_notes_decision_check check (decision in ('pending', 'adopted', 'dismissed')),
  add column decided_at timestamptz;

alter table public.ai_notes
  add constraint ai_notes_decision_time_check check (
    (decision = 'pending' and decided_at is null)
    or (decision in ('adopted', 'dismissed') and decided_at is not null)
  );

create index ai_notes_owner_decision_created_idx
  on public.ai_notes (owner_id, decision, created_at desc)
  where deleted_at is null;
