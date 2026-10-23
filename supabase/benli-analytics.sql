-- Benli Kuruyemiş: KVKK çerez iznine bağlı ziyaretçi analizi
-- Supabase > SQL Editor > New query > Run
-- Bu tabloya browser/anon doğrudan erişemez.
create table if not exists public.benli_analytics_events (
 id bigint generated always as identity primary key,
 visitor_id text not null,
 session_id text not null,
 event text not null,
 page text not null,
 target text not null default '',
 duration_sec integer not null default 0,
 created_at timestamptz not null default now(),
 constraint benli_analytics_duration_ck check (duration_sec between 0 and 30),
 constraint benli_analytics_event_ck check (event in ('page_view','click','product_view','category_view','search','add_to_cart','checkout_started','order_requested','whatsapp_click','active_time'))
);
create index if not exists benli_analytics_date_idx on public.benli_analytics_events (created_at desc);
create index if not exists benli_analytics_visitor_idx on public.benli_analytics_events(visitor_id);
alter table public.benli_analytics_events enable row level security;
revoke all on table public.benli_analytics_events from public, anon, authenticated;
grant select,insert,update,delete on table public.benli_analytics_events to service_role;
grant usage, select on sequence public.benli_analytics_events_id_seq to service_role;
-- Yalnızca 90 günlük kayıt tutulur: uygulama olay geldikçe ve rapor okununca eski kayıtları siler.
select count(*) as kaydedilmis_olay from public.benli_analytics_events;
