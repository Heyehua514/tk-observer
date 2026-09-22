-- Migration: Add multi-currency support and exchange rates to products catalog
-- Date: 2026-09-22

-- 1. Expand currency constraint to include common TikTok Shop cross-border currencies
alter table public.products drop constraint if exists products_currency_check;
alter table public.products add constraint products_currency_check
  check (currency in ('USD', 'CNY', 'GBP', 'EUR', 'IDR', 'THB', 'VND', 'MYR', 'PHP', 'SGD'));

-- 2. Add exchange_rate column (selling currency to CNY benchmark rate)
alter table public.products add column if not exists exchange_rate numeric(10, 4) not null default 1.0;
alter table public.products drop constraint if exists products_exchange_rate_check;
alter table public.products add constraint products_exchange_rate_check check (exchange_rate > 0);

-- 3. Add cost_currency column (procurement currency, default CNY)
alter table public.products add column if not exists cost_currency text not null default 'CNY';
alter table public.products drop constraint if exists products_cost_currency_check;
alter table public.products add constraint products_cost_currency_check
  check (cost_currency in ('USD', 'CNY', 'GBP', 'EUR', 'IDR', 'THB', 'VND', 'MYR', 'PHP', 'SGD'));

comment on column public.products.currency is '销售定价币种 (如 USD, GBP, IDR, THB 等)';
comment on column public.products.exchange_rate is '目标销售币种兑换人民币(CNY)的换算汇率，默认 1.0';
comment on column public.products.cost_currency is '供应链采购成本币种，默认 CNY 人民币';
