create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null default '',
  business_type text not null default 'Other',
  description text not null default '',
  currency text not null default 'INR',
  opening_cash numeric(14,2),
  onboarding_step int not null default 1,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists businesses_one_per_owner
  on public.businesses(owner_id);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  invoice_number text not null,
  total numeric(14,2) not null check (total >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'partial', 'paid', 'overdue')),
  issued_at date,
  due_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  received_at timestamptz not null default now(),
  method text
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.business_bills (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  due_at date not null,
  paid_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  channel text not null default 'email',
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function private.owns_business(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses as b
    where b.id = target and b.owner_id = auth.uid()
  );
$$;
revoke all on function private.owns_business(uuid) from public, anon;
grant execute on function private.owns_business(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'customers', 'invoices', 'payments', 'expenses',
    'business_bills', 'follow_ups', 'notifications'
  ] loop
    execute pg_catalog.format('alter table public.%I enable row level security', table_name);
    policy_name := table_name || '_business_owner';
    if not exists (
      select 1 from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = policy_name
    ) then
      execute pg_catalog.format(
        'create policy %I on public.%I for all to authenticated using (private.owns_business(business_id)) with check (private.owns_business(business_id))',
        policy_name, table_name
      );
    end if;
  end loop;
  if not exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='profiles' and policyname='profile owner access') then
    create policy "profile owner access" on public.profiles for all to authenticated
      using (id = auth.uid()) with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='businesses' and policyname='business owner access') then
    create policy "business owner access" on public.businesses for all to authenticated
      using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;
end
$$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.businesses, public.customers, public.invoices,
  public.payments, public.expenses, public.business_bills,
  public.follow_ups, public.notifications
  to authenticated;

create or replace function private.bootstrap_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.bootstrap_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_flowpilot on auth.users;
create trigger on_auth_user_created_flowpilot
  after insert on auth.users
  for each row execute function private.bootstrap_profile();
