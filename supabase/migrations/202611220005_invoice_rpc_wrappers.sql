-- Expose authenticated PostgREST entry points for the private invoice
-- operations used by the browser client. The private SECURITY DEFINER
-- functions retain ownership checks and atomic invoice-item handling.
create or replace function public.save_invoice(
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
language sql
security invoker
set search_path = ''
as $$
  select private.save_invoice(
    p_business_id, p_invoice_id, p_customer_id, p_invoice_number,
    p_issued_at, p_due_at, p_discount, p_tax, p_total,
    p_payment_instructions, p_status, p_items
  );
$$;
revoke all on function public.save_invoice(uuid,uuid,uuid,text,date,date,numeric,numeric,numeric,text,text,jsonb) from public, anon;
grant execute on function public.save_invoice(uuid,uuid,uuid,text,date,date,numeric,numeric,numeric,text,text,jsonb) to authenticated;

create or replace function public.delete_unpaid_invoice(p_business_id uuid, p_invoice_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.delete_unpaid_invoice(p_business_id, p_invoice_id);
$$;
revoke all on function public.delete_unpaid_invoice(uuid,uuid) from public, anon;
grant execute on function public.delete_unpaid_invoice(uuid,uuid) to authenticated;

notify pgrst, 'reload schema';
