-- Sistema de marcas para o catálogo existente.
-- Execute uma vez no SQL Editor do Supabase.

create table if not exists public.brands (
  slug text primary key,
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

insert into public.brands (slug, name, description, sort_order)
values ('arena-08', 'Arena 08', 'Mesas de jogos Arena 08', 1)
on conflict (slug) do nothing;

alter table public.products add column if not exists brand text;
update public.products set brand = 'arena-08' where brand is null or trim(brand) = '';
alter table public.products alter column brand set default 'arena-08';
alter table public.products alter column brand set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_brand_fkey') then
    alter table public.products add constraint products_brand_fkey
      foreign key (brand) references public.brands(slug)
      on update cascade on delete restrict;
  end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists brands_updated_at on public.brands;
create trigger brands_updated_at before update on public.brands
  for each row execute function public.touch_updated_at();

alter table public.brands enable row level security;
drop policy if exists "marcas públicas e admin" on public.brands;
create policy "marcas públicas e admin" on public.brands for select to anon, authenticated
  using (active or public.is_admin());
drop policy if exists "admin insere marcas" on public.brands;
create policy "admin insere marcas" on public.brands for insert to authenticated
  with check (public.is_admin());
drop policy if exists "admin atualiza marcas" on public.brands;
create policy "admin atualiza marcas" on public.brands for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "admin exclui marcas" on public.brands;
create policy "admin exclui marcas" on public.brands for delete to authenticated
  using (public.is_admin());

drop policy if exists "catálogo público e admin" on public.products;
create policy "catálogo público e admin" on public.products for select to anon, authenticated
  using (
    public.is_admin()
    or (
      active
      and exists (select 1 from public.categories c where c.slug = category and c.active)
      and exists (select 1 from public.brands b where b.slug = brand and b.active)
    )
  );

-- O checkout também valida se a marca continua ativa.
drop function if exists public.place_order(jsonb, jsonb);
create or replace function public.place_order(customer jsonb, lines jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  new_order_id uuid;
  new_order_number bigint;
  entry jsonb;
  product_row public.products%rowtype;
  qty integer;
  unit_amount numeric(12,2);
  total_amount numeric(12,2) := 0;
begin
  if jsonb_typeof(customer) is distinct from 'object'
     or jsonb_typeof(lines) is distinct from 'array' then
    raise exception 'Dados do pedido inválidos';
  end if;
  if jsonb_array_length(lines) < 1 or jsonb_array_length(lines) > 20 then
    raise exception 'Dados do pedido inválidos';
  end if;
  if length(trim(coalesce(customer->>'name',''))) < 2
     or length(trim(coalesce(customer->>'email',''))) < 5
     or coalesce(customer->>'email','') !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
     or length(trim(coalesce(customer->>'phone',''))) < 8
     or coalesce(customer->>'cep','') !~ '^[0-9]{8}$'
     or length(trim(coalesce(customer->>'city',''))) < 2
     or length(trim(coalesce(customer->>'state',''))) <> 2
     or length(trim(coalesce(customer->>'address',''))) < 3
     or length(trim(coalesce(customer->>'number',''))) < 1 then
    raise exception 'Preencha os dados de entrega';
  end if;
  insert into public.orders
    (customer_name, customer_email, customer_phone, cep, city, state, address,
     address_number, complement, note)
  values
    (left(trim(customer->>'name'), 120), left(trim(customer->>'email'), 200),
     left(trim(customer->>'phone'), 30), customer->>'cep', left(trim(customer->>'city'), 100),
     upper(left(trim(customer->>'state'), 2)), left(trim(customer->>'address'), 200),
     left(trim(customer->>'number'), 30), left(coalesce(customer->>'complement',''), 200),
     left(coalesce(customer->>'note',''), 1000))
  returning id, number into new_order_id, new_order_number;
  for entry in select value from jsonb_array_elements(lines) loop
    if coalesce(entry->>'quantity','') !~ '^[0-9]+$' then
      raise exception 'Quantidade inválida';
    end if;
    qty := (entry->>'quantity')::integer;
    if qty < 1 or qty > 20 then raise exception 'Quantidade inválida'; end if;
    select p.* into product_row from public.products p
      join public.categories c on c.slug = p.category
      join public.brands b on b.slug = p.brand
      where p.id = (entry->>'id')::uuid and p.active and c.active and b.active;
    if not found then raise exception 'Produto indisponível'; end if;
    unit_amount := coalesce(product_row.promotional_price, product_row.price);
    insert into public.order_items
      (order_id, product_id, product_name, product_slug, image, quantity, unit_price, line_total)
    values
      (new_order_id, product_row.id, product_row.name, product_row.slug,
       coalesce(product_row.images[1], ''), qty, unit_amount, unit_amount * qty);
    total_amount := total_amount + unit_amount * qty;
  end loop;
  update public.orders set subtotal = total_amount where id = new_order_id;
  return new_order_number;
end;
$$;
revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'brands'
     ) then
    alter publication supabase_realtime add table public.brands;
  end if;
end $$;

revoke all on public.brands from anon, authenticated;
grant select on public.brands to anon, authenticated;
grant insert, update, delete on public.brands to authenticated;
