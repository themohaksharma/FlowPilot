-- Atomic, business-scoped invoice payment allocation.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create unique index if not exists customers_business_id_id_key
  on public.customers(business_id,id);
create unique index if not exists invoices_business_id_id_key
  on public.invoices(business_id,id);

do $$ begin
 if not exists(select 1 from pg_catalog.pg_constraint where conrelid='public.invoices'::pg_catalog.regclass and conname='invoices_business_customer_fkey') then
  alter table public.invoices add constraint invoices_business_customer_fkey foreign key(business_id,customer_id) references public.customers(business_id,id) on delete set null (customer_id);
 end if;
 if not exists(select 1 from pg_catalog.pg_constraint where conrelid='public.payments'::pg_catalog.regclass and conname='payments_business_invoice_fkey') then
  alter table public.payments add constraint payments_business_invoice_fkey foreign key(business_id,invoice_id) references public.invoices(business_id,id) on delete set null (invoice_id);
 end if;
 if not exists(select 1 from pg_catalog.pg_constraint where conrelid='public.follow_ups'::pg_catalog.regclass and conname='follow_ups_business_invoice_fkey') then
  alter table public.follow_ups add constraint follow_ups_business_invoice_fkey foreign key(business_id,invoice_id) references public.invoices(business_id,id) on delete set null (invoice_id);
 end if;
end $$;

alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check(status in ('draft','unpaid','sent','partially_paid','partial','paid','overdue'));

create or replace function private.record_invoice_payment(
 p_business_id uuid, p_invoice_id uuid, p_amount numeric, p_method text default null
) returns table(payment_id uuid, outstanding numeric, invoice_status text)
language plpgsql security definer set search_path = '' as $$
declare inv public.invoices%rowtype; paid numeric; remaining numeric; next_status text; new_payment_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
 select * into inv from public.invoices i where i.id=p_invoice_id and i.business_id=p_business_id for update;
 if not found or not exists(select 1 from public.businesses b where b.id=p_business_id and b.owner_id=auth.uid()) then raise exception 'Invoice not found for this business'; end if;
 if inv.status='draft' then raise exception 'Draft invoices cannot receive payments'; end if;
 select coalesce(sum(p.amount),0) into paid from public.payments p where p.business_id=p_business_id and p.invoice_id=p_invoice_id;
 remaining := inv.total-paid;
 if p_amount > remaining then raise exception 'Payment exceeds the invoice outstanding balance'; end if;
 insert into public.payments(business_id,invoice_id,amount,method) values(p_business_id,p_invoice_id,p_amount,p_method) returning id into new_payment_id;
 remaining := remaining-p_amount;
 if remaining=0 then next_status:='paid';
 elsif paid+p_amount>0 then next_status:='partially_paid';
 elsif inv.due_at < current_date then next_status:='overdue';
 else next_status:='unpaid'; end if;
 update public.invoices set status=next_status where id=p_invoice_id and business_id=p_business_id;
 return query select new_payment_id,remaining,next_status;
end;
$$;
revoke all on function private.record_invoice_payment(uuid,uuid,numeric,text) from public,anon;
grant execute on function private.record_invoice_payment(uuid,uuid,numeric,text) to authenticated;
