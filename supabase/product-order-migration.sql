-- Ordenação manual dos produtos.
-- Execute uma vez no SQL Editor do Supabase.

alter table public.products add column if not exists display_order integer;

-- Preserva uma ordem inicial previsível para os produtos já cadastrados.
with ranked as (
  select id, row_number() over (order by created_at asc, id asc)::integer as position
  from public.products
  where display_order is null
)
update public.products products
set display_order = ranked.position
from ranked
where products.id = ranked.id;

create index if not exists products_display_order_idx
  on public.products (display_order asc nulls last);

create or replace function public.set_product_order(product_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;

  update public.products products
  set display_order = ordered.position::integer
  from unnest(product_ids) with ordinality as ordered(id, position)
  where products.id = ordered.id;
end;
$$;
revoke all on function public.set_product_order(uuid[]) from public;
grant execute on function public.set_product_order(uuid[]) to authenticated;
