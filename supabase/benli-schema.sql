-- Benli Kuruyemiş: kalıcı ürün, stok ve sipariş tabloları.
-- Supabase SQL Editor > New query > Run.
-- Müşteri verileri için anonim veya authenticated role doğrudan izin verilmez.
-- REST erişimini yalnızca Vercel server tarafındaki SUPABASE_SECRET_KEY sağlar.

create table if not exists public.benli_products (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.benli_orders (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.benli_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

create index if not exists benli_orders_created_at_idx on public.benli_orders (created_at desc);

alter table public.benli_products enable row level security;
alter table public.benli_orders enable row level security;
alter table public.benli_config enable row level security;

-- RLS açık, istemci / genel ziyaretçiler bu tablolara erişemez.
revoke all on table public.benli_products, public.benli_orders, public.benli_config from public, anon, authenticated;
grant select, insert, update, delete on table public.benli_products, public.benli_orders, public.benli_config to service_role;

-- Çalıştığını doğrulama sorgusu:
select 'benli_products' as tablo, count(*) as kayit from public.benli_products
union all
select 'benli_orders', count(*) from public.benli_orders
union all
select 'benli_config', count(*) from public.benli_config;
