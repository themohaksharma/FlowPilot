-- Add a first-class, business-owned expense category without changing existing records.
alter table public.expenses
  add column if not exists category text not null default 'Other'
    check (length(btrim(category)) between 1 and 60);
