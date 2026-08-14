-- 商务工作台：渠道商单取消原因（只追加字段，不改旧 migration）。
-- 所属工作台：商务（董雨辰）；权限：business/boss 可读写。
alter table public.channel_orders
  add column if not exists cancel_reason text
  check (cancel_reason is null or char_length(cancel_reason) <= 1000);

-- 状态为 cancelled 时必须有取消原因（前端弹窗必填 + 数据库兜底）。
alter table public.channel_orders
  drop constraint if exists channel_orders_cancel_reason_check;

alter table public.channel_orders
  add constraint channel_orders_cancel_reason_check check (
    status <> 'cancelled'
    or (cancel_reason is not null and char_length(cancel_reason) > 0)
  );
