-- Paper Trail — Postgres schema for Supabase.
-- Every table is row-level-secured to auth.uid() from day one, so opening the
-- app to any creator later is a config change, not a rewrite.

create extension if not exists "pgcrypto";

-- profiles: one row per user (auth.users is managed by Supabase Auth).
create table if not exists profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  business_name text not null default '',
  display_name text not null default '',
  address_lines text[] not null default '{}',
  email text not null default '',
  default_net_days int not null default 30,
  default_currency text not null default 'USD',
  memo_convention text not null default '{Month of post} + {Brand}',
  next_invoice_number int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('bank','wise','paypal','payoneer','other')),
  label text not null,
  details jsonb not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  bill_to_name text not null default '',
  address_lines text[] not null default '{}',
  notes text not null default '',
  default_rate numeric,
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands (id) on delete cascade,
  name text not null,
  email text not null default '',
  role text not null default ''
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_id uuid not null references brands (id) on delete cascade,
  campaign_name text not null,
  status text not null default 'Pitched',
  total_value numeric not null default 0,
  currency text not null default 'USD',
  contract_file_url text,
  contract_file_name text,
  payment_schedule jsonb not null default '[]',
  usage_rights_months int,
  usage_rights_start date,
  exclusivity_notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  description text not null,
  due_date date,
  post_url text,
  amount numeric not null default 0,
  delivered_at date
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deal_id uuid references deals (id) on delete set null,
  brand_id uuid not null references brands (id) on delete cascade,
  number text not null,
  date date not null,
  net_days int not null default 30,
  memo text not null default '',
  campaign text not null default '',
  currency text not null default 'USD',
  status text not null default 'Draft' check (status in ('Draft','Sent','Paid')),
  payment_method_id uuid references payment_methods (id) on delete set null,
  sent_at date,
  paid_at date,
  created_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  description text not null,
  detail text not null default '',
  link text,
  amount numeric not null default 0,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Row-level security. Each table is scoped to the owning user. Child tables
-- (contacts, deliverables, invoice_items) inherit ownership through their parent.
-- ---------------------------------------------------------------------------
alter table profiles         enable row level security;
alter table payment_methods  enable row level security;
alter table brands           enable row level security;
alter table contacts         enable row level security;
alter table deals            enable row level security;
alter table deliverables     enable row level security;
alter table invoices         enable row level security;
alter table invoice_items    enable row level security;

create policy "own profile" on profiles
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own payment_methods" on payment_methods
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own brands" on brands
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own deals" on deals
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own invoices" on invoices
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own contacts" on contacts
  using (exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()))
  with check (exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()));

create policy "own deliverables" on deliverables
  using (exists (select 1 from deals d where d.id = deal_id and d.user_id = auth.uid()))
  with check (exists (select 1 from deals d where d.id = deal_id and d.user_id = auth.uid()));

create policy "own invoice_items" on invoice_items
  using (exists (select 1 from invoices i where i.id = invoice_id and i.user_id = auth.uid()))
  with check (exists (select 1 from invoices i where i.id = invoice_id and i.user_id = auth.uid()));

-- Storage bucket for contract PDFs (create once).
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;
