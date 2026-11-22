-- Structured, business-owned invoice details and atomic invoice maintenance.
alter table public.invoices
  add column if not exists tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  add column if not exists discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  add column if not exists payment_instructions text not null default '';

create unique index if not exists invoices_business_invoice_number_key
  on public.invoices(business_id, invoice_number);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_id uuid not null,
  description text not null check (length(btrim(description)) > 0),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint invoice_items_business_invoice_fkey
    foreign key (business_id, invoice_id)
    references public.invoices(business_id, id) on delete cascade
);
alter table public.invoice_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='invoice_items' and policyname='invoice_items_business_owner') then
    create policy invoice_items_business_owner on public.invoice_items
      for all to authenticated
      using (private.owns_business(business_id))
      with check (private.owns_business(business_id));
  end if;
end $$;
grant select, insert, update, delete on public.invoice_items to authenticated;

create or replace function private.save_invoice(
  p_business_id uuid,
  p_invoice_id uuid,
  p_customer_id uuid,
  p_invoice_number text,
  p_issued_at date,
  p_due_at date,
  p_discount numeric,
  p_tax numeric,
  p_total numeric,
  p_payment_instructions text,
  p_status text,
  p_items jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  current_invoice public.invoices%rowtype;
  paid numeric(14,2);
  subtotal numeric(14,2);
  next_status text;
  saved_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.businesses b where b.id=p_business_id and b.owner_id=auth.uid()) then raise exception 'Business not found'; end if;
  if p_customer_id is not null and not exists (select 1 from public.customers c where c.id=p_customer_id and c.business_id=p_business_id) then raise exception 'Customer does not belong to this business'; end if;
  if nullif(btrim(p_invoice_number),'') is null then raise exception 'Invoice number is required'; end if;
  if p_discount is null or p_discount<0 or p_tax is null or p_tax<0 or p_total is null or p_total<0 then raise exception 'Invoice totals must be non-negative'; end if;
  if p_due_at is null then raise exception 'Due date is required'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'At least one invoice line item is required'; end if;
  select coalesce(sum(round((x.quantity*x.unit_price)::numeric,2)),0) into subtotal
  from jsonb_to_recordset(p_items) as x(description text,quantity numeric,unit_price numeric);
  if exists(select 1 from jsonb_to_recordset(p_items) as x(description text,quantity numeric,unit_price numeric)
    where nullif(btrim(x.description),'') is null or x.quantity is null or x.quantity<=0 or x.unit_price is null or x.unit_price<0) then
    raise exception 'Invoice line items contain invalid values';
  end if;
  if abs(round(subtotal-p_discount+p_tax,2)-p_total)>0.01 then raise exception 'Invoice total does not match line items, discount and tax'; end if;

  if p_invoice_id is null then
    if p_status is null or p_status not in ('draft','unpaid') then raise exception 'New invoices must be draft or unpaid'; end if;
    if p_status='draft' then next_status:='draft';
    elsif p_due_at<current_date then next_status:='overdue';
    else next_status:='unpaid'; end if;
    insert into public.invoices(business_id,customer_id,invoice_number,total,status,issued_at,due_at,tax_amount,discount_amount,payment_instructions)
    values(p_business_id,p_customer_id,btrim(p_invoice_number),p_total,next_status,p_issued_at,p_due_at,p_tax,p_discount,coalesce(p_payment_instructions,''))
    returning id into saved_id;
  else
    select * into current_invoice from public.invoices i where i.id=p_invoice_id and i.business_id=p_business_id for update;
    if not found then raise exception 'Invoice not found for this business'; end if;
    select coalesce(sum(pm.amount),0) into paid from public.payments pm where pm.business_id=p_business_id and pm.invoice_id=p_invoice_id;
    if p_total<paid then raise exception 'Invoice total cannot be less than the amount already paid'; end if;
    if current_invoice.status='draft' then next_status:='draft';
    elsif p_total=paid then next_status:='paid';
    elsif paid>0 then next_status:='partially_paid';
    elsif p_due_at<current_date then next_status:='overdue';
    else next_status:='unpaid'; end if;
    update public.invoices set customer_id=p_customer_id,invoice_number=btrim(p_invoice_number),total=p_total,
      status=next_status,issued_at=p_issued_at,due_at=p_due_at,tax_amount=p_tax,
      discount_amount=p_discount,payment_instructions=coalesce(p_payment_instructions,'')
    where id=p_invoice_id and business_id=p_business_id returning id into saved_id;
    delete from public.invoice_items where invoice_id=saved_id and business_id=p_business_id;
  end if;

  insert into public.invoice_items(business_id,invoice_id,description,quantity,unit_price,line_total,position)
  select p_business_id,saved_id,btrim(x.description),x.quantity,x.unit_price,round(x.quantity*x.unit_price,2),x.position
  from jsonb_to_recordset(p_items) as x(description text,quantity numeric,unit_price numeric,position integer);
  return saved_id;
end;
$$;
revoke all on function private.save_invoice(uuid,uuid,uuid,text,date,date,numeric,numeric,numeric,text,text,jsonb) from public,anon;
grant execute on function private.save_invoice(uuid,uuid,uuid,text,date,date,numeric,numeric,numeric,text,text,jsonb) to authenticated;

create or replace function private.delete_unpaid_invoice(p_business_id uuid,p_invoice_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare invoice_row public.invoices%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.businesses b where b.id=p_business_id and b.owner_id=auth.uid()) then raise exception 'Business not found'; end if;
  select * into invoice_row from public.invoices i where i.id=p_invoice_id and i.business_id=p_business_id for update;
  if not found then raise exception 'Invoice not found for this business'; end if;
  if exists(select 1 from public.payments p where p.business_id=p_business_id and p.invoice_id=p_invoice_id) then raise exception 'Invoices with payment history cannot be deleted'; end if;
  delete from public.invoices where id=p_invoice_id and business_id=p_business_id;
end;
$$;
revoke all on function private.delete_unpaid_invoice(uuid,uuid) from public,anon;
grant execute on function private.delete_unpaid_invoice(uuid,uuid) to authenticated;
