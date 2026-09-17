-- Cores e variações de imagem dos produtos.
-- Execute uma vez no SQL Editor do Supabase.

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex_code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint colors_name_not_blank check (length(trim(name)) > 0),
  constraint colors_hex_format check (hex_code ~ '^#[0-9A-Fa-f]{6}$')
);

-- As cores são cadastradas dentro de cada produto e podem repetir o mesmo nome.
alter table public.colors drop constraint if exists colors_name_key;

create table if not exists public.product_colors (
  product_id uuid not null references public.products(id) on update cascade on delete cascade,
  color_id uuid not null references public.colors(id) on update cascade on delete cascade,
  image text not null default '',
  created_at timestamptz not null default now(),
  primary key (product_id, color_id)
);

create index if not exists product_colors_color_id_idx on public.product_colors(color_id);

drop trigger if exists colors_updated_at on public.colors;
create trigger colors_updated_at before update on public.colors
  for each row execute function public.touch_updated_at();

alter table public.colors enable row level security;
alter table public.product_colors enable row level security;

drop policy if exists "cores públicas e admin" on public.colors;
create policy "cores públicas e admin" on public.colors for select to anon, authenticated
  using (active or public.is_admin());
drop policy if exists "admin insere cores" on public.colors;
create policy "admin insere cores" on public.colors for insert to authenticated
  with check (public.is_admin());
drop policy if exists "admin atualiza cores" on public.colors;
create policy "admin atualiza cores" on public.colors for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin exclui cores" on public.colors;
create policy "admin exclui cores" on public.colors for delete to authenticated
  using (public.is_admin());

drop policy if exists "variações públicas e admin" on public.product_colors;
create policy "variações públicas e admin" on public.product_colors for select to anon, authenticated
  using (
    public.is_admin()
    or (
      exists (
        select 1 from public.products p
        join public.categories c on c.slug = p.category
        join public.brands b on b.slug = p.brand
        where p.id = product_id and p.active and c.active and b.active
      )
      and exists (select 1 from public.colors c where c.id = color_id and c.active)
    )
  );
drop policy if exists "admin insere variações" on public.product_colors;
create policy "admin insere variações" on public.product_colors for insert to authenticated
  with check (public.is_admin());
drop policy if exists "admin atualiza variações" on public.product_colors;
create policy "admin atualiza variações" on public.product_colors for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin exclui variações" on public.product_colors;
create policy "admin exclui variações" on public.product_colors for delete to authenticated
  using (public.is_admin());

alter table public.order_items add column if not exists color_name text not null default '';
alter table public.order_items add column if not exists color_hex text not null default '';
alter table public.order_items add column if not exists color_id uuid references public.colors(id) on delete set null;

drop function if exists public.place_order(jsonb, jsonb);
create or replace function public.place_order(customer jsonb, lines jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  new_order_id uuid;
  new_order_number bigint;
  entry jsonb;
  product_row public.products%rowtype;
  selected_color_id uuid;
  selected_color_name text;
  selected_color_hex text;
  variant_image text;
  qty integer;
  unit_amount numeric(12,2);
  total_amount numeric(12,2) := 0;
begin
  if jsonb_typeof(customer) is distinct from 'object'
     or jsonb_typeof(lines) is distinct from 'array'
     or jsonb_array_length(lines) < 1
     or jsonb_array_length(lines) > 20 then
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

    selected_color_id := null;
    selected_color_name := '';
    selected_color_hex := '';
    variant_image := '';
    if exists (
      select 1 from public.product_colors pc
      join public.colors c on c.id = pc.color_id
      where pc.product_id = product_row.id and c.active
    ) then
      if coalesce(entry->>'color_id', '') = '' then
        raise exception 'Selecione uma cor para o produto';
      end if;
      select c.id, c.name, c.hex_code, pc.image
        into selected_color_id, selected_color_name, selected_color_hex, variant_image
      from public.product_colors pc
      join public.colors c on c.id = pc.color_id
      where pc.product_id = product_row.id
        and pc.color_id = (entry->>'color_id')::uuid
        and c.active;
      if not found then raise exception 'Cor indisponível'; end if;
    end if;

    unit_amount := coalesce(product_row.promotional_price, product_row.price);
    insert into public.order_items
      (order_id, product_id, product_name, product_slug, image, color_id, color_name, color_hex,
       quantity, unit_price, line_total)
    values
      (new_order_id, product_row.id, product_row.name, product_row.slug,
       coalesce(nullif(variant_image, ''), product_row.images[1], ''),
       selected_color_id, selected_color_name, selected_color_hex,
       qty, unit_amount, unit_amount * qty);
    total_amount := total_amount + unit_amount * qty;
  end loop;

  update public.orders set subtotal = total_amount where id = new_order_id;
  return new_order_number;
end;
$$;
revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'colors'
    ) then
      alter publication supabase_realtime add table public.colors;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'product_colors'
    ) then
      alter publication supabase_realtime add table public.product_colors;
    end if;
  end if;
end $$;

revoke all on public.colors, public.product_colors from anon, authenticated;
grant select on public.colors, public.product_colors to anon, authenticated;
grant insert, update, delete on public.colors, public.product_colors to authenticated;
