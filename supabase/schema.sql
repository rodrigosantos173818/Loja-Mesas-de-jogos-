-- Execute no SQL Editor de um projeto Supabase novo.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Perfis vinculados ao Supabase Auth. Novas contas sempre começam como customer.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_auth_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
    set email = excluded.email, updated_at = now();
  return new;
end;
$$;
revoke all on function public.sync_auth_profile() from public;
drop trigger if exists auth_user_profile on auth.users;
create trigger auth_user_profile
  after insert or update of email on auth.users
  for each row execute function public.sync_auth_profile();

-- Cria perfis para usuários anteriores e preserva os administradores já cadastrados.
insert into public.profiles (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do update set email = excluded.email;
insert into public.profiles (id, email, role)
select users.id, coalesce(users.email, ''), 'admin'
from public.admin_users admins
join auth.users users on users.id = admins.user_id
on conflict (id) do update set role = 'admin', email = excluded.email;

-- Administradores principais da loja. O e-mail permite promover a conta
-- correta mesmo quando ela foi recriada e recebeu um novo UUID no Auth.
insert into public.profiles (id, email, role)
select id, coalesce(email, ''), 'admin'
from auth.users
where id = '94758066-39ca-41b4-ba04-5a7becc50ff5'::uuid
   or lower(email) in ('r624989@gmail.com', 'r62498918@gmail.com')
on conflict (id) do update set role = 'admin', email = excluded.email;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('sinuca', 'futmesa', 'ping-pong', 'pebolim')),
  description text not null default '',
  details text[] not null default '{}',
  price numeric(12,2) not null check (price > 0),
  pix_price numeric(12,2) not null check (pix_price > 0),
  installment_count integer not null default 10 check (installment_count between 1 and 24),
  weight_kg numeric(10,2) not null check (weight_kg > 0),
  length_cm numeric(10,2) not null check (length_cm > 0),
  width_cm numeric(10,2) not null check (width_cm > 0),
  height_cm numeric(10,2) not null check (height_cm > 0),
  images text[] not null default '{}',
  featured boolean not null default false,
  premium boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_product_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.touch_product_updated_at();

alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
drop policy if exists "admin lê própria conta" on public.admin_users;
create policy "admin lê própria conta" on public.admin_users for select to authenticated using (user_id = auth.uid());
drop policy if exists "usuário lê próprio perfil" on public.profiles;
create policy "usuário lê próprio perfil" on public.profiles for select to authenticated
  using (id = auth.uid());
drop policy if exists "admin lê perfis" on public.profiles;
create policy "admin lê perfis" on public.profiles for select to authenticated
  using (public.is_admin());
drop policy if exists "admin atualiza perfis" on public.profiles;
create policy "admin atualiza perfis" on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "catálogo público e admin" on public.products;
create policy "catálogo público e admin" on public.products for select to anon, authenticated
  using (active or public.is_admin());
drop policy if exists "admin insere produtos" on public.products;
create policy "admin insere produtos" on public.products for insert to authenticated
  with check (public.is_admin());
drop policy if exists "admin atualiza produtos" on public.products;
create policy "admin atualiza produtos" on public.products for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "admin exclui produtos" on public.products;
create policy "admin exclui produtos" on public.products for delete to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;
drop policy if exists "imagens de produtos públicas" on storage.objects;
create policy "imagens de produtos públicas" on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
drop policy if exists "admin envia imagens" on storage.objects;
create policy "admin envia imagens" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin atualiza imagens" on storage.objects;
create policy "admin atualiza imagens" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin exclui imagens" on storage.objects;
create policy "admin exclui imagens" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

insert into public.products
  (slug, name, category, description, details, price, pix_price, installment_count, weight_kg, length_cm, width_cm, height_cm, images, featured, premium)
values
  ('mesa-de-sinuca-pro-08', 'Mesa de Sinuca Pro 08', 'sinuca', 'Uma mesa feita para partidas memoráveis. Acabamento em madeira escura, pano verde profundo e estrutura robusta.', array['Estrutura em madeira com acabamento premium','Pano verde de alta resistência','Acompanha kit básico para começar a jogar'], 7990, 7590.50, 10, 180, 260, 145, 85, array['/images/sinuca-hero.webp'], true, true),
  ('futmesa-curve-08', 'Futmesa Curve 08', 'futmesa', 'Curvas precisas e uma superfície responsiva para treinar domínio, reflexo e criatividade.', array['Superfície curvada para jogadas dinâmicas','Estrutura estável','Uso interno e em áreas cobertas'], 4990, 4740.50, 10, 95, 300, 170, 85, array['/images/futmesa.webp'], true, true),
  ('mesa-de-ping-pong-match-08', 'Mesa de Ping-Pong Match 08', 'ping-pong', 'Área de jogo ampla, visual sóbrio e desempenho para partidas intensas.', array['Tampo com linhas de jogo','Rede inclusa','Estrutura firme para uso interno'], 3690, 3505.50, 10, 76, 274, 152, 76, array['/images/ping-pong.webp'], true, false),
  ('mesa-de-pebolim-arena-08', 'Mesa de Pebolim Arena 08', 'pebolim', 'Um clássico de toda sala de jogos, com acabamento escuro e pegada esportiva.', array['Campo de jogo resistente','Manoplas confortáveis','Acabamento em madeira e preto'], 2890, 2745.50, 10, 72, 142, 80, 90, array['/images/pebolim.webp'], true, false),
  ('mesa-de-sinuca-club-08', 'Mesa de Sinuca Club 08', 'sinuca', 'Presença marcante e jogabilidade confortável para reunir amigos em torno de uma boa partida.', array['Acabamento em madeira escura','Pano verde','Estrutura estável'], 6490, 6165.50, 10, 160, 240, 135, 85, array['/images/sinuca-hero.webp'], false, false),
  ('futmesa-play-08', 'Futmesa Play 08', 'futmesa', 'Uma forma nova de jogar bola com amigos, em família ou na área de lazer.', array['Tampo curvo','Estrutura reforçada','Ideal para áreas cobertas'], 4290, 4075.50, 10, 88, 280, 160, 85, array['/images/futmesa.webp'], false, false),
  ('mesa-de-ping-pong-competition-08', 'Mesa de Ping-Pong Competition 08', 'ping-pong', 'Um clássico para quem quer mais velocidade, mais rallys e mais partidas.', array['Tampo de jogo com linhas','Rede inclusa','Estrutura para uso interno'], 4190, 3980.50, 10, 82, 274, 152, 76, array['/images/ping-pong.webp'], false, true),
  ('mesa-de-pebolim-club-08', 'Mesa de Pebolim Club 08', 'pebolim', 'A energia do futebol de mesa em um equipamento que dá personalidade à sala de jogos.', array['Campo de jogo resistente','Manoplas confortáveis','Estrutura estável'], 2490, 2365.50, 10, 68, 135, 78, 88, array['/images/pebolim.webp'], false, false)
on conflict (slug) do nothing;

-- Para promover outro usuário, execute com segurança no SQL Editor:
-- update public.profiles set role = 'admin' where id = 'UUID-DO-USUARIO';

-- Extensão do painel: pode ser executada também sobre a versão anterior do esquema.
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  image text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

insert into public.categories (slug, name, image, description, sort_order)
values
  ('sinuca', 'Sinuca', '/images/sinuca-hero.webp', 'Estratégia em cada tacada', 1),
  ('futmesa', 'Futmesa', '/images/futmesa.webp', 'Controle para competir', 2),
  ('ping-pong', 'Ping-Pong', '/images/ping-pong.webp', 'Ritmo sem pausa', 3),
  ('pebolim', 'Pebolim', '/images/pebolim.webp', 'A disputa começa aqui', 4)
on conflict (slug) do nothing;

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

alter table public.products add column if not exists promotional_price numeric(12,2);
alter table public.products add column if not exists volumes integer not null default 1;
alter table public.products add column if not exists brand text;
update public.products set brand = 'arena-08' where brand is null or trim(brand) = '';
alter table public.products alter column brand set default 'arena-08';
alter table public.products alter column brand set not null;
alter table public.products drop constraint if exists products_category_check;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_category_fkey') then
    alter table public.products add constraint products_category_fkey
      foreign key (category) references public.categories(slug)
      on update cascade on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_promotional_price_check') then
    alter table public.products add constraint products_promotional_price_check
      check (promotional_price is null or (promotional_price > 0 and promotional_price < price));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_volumes_check') then
    alter table public.products add constraint products_volumes_check check (volumes between 1 and 20);
  end if;
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
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.touch_updated_at();
drop trigger if exists brands_updated_at on public.brands;
create trigger brands_updated_at before update on public.brands
  for each row execute function public.touch_updated_at();

alter table public.categories enable row level security;
drop policy if exists "categorias públicas e admin" on public.categories;
create policy "categorias públicas e admin" on public.categories for select to anon, authenticated
  using (active or public.is_admin());
drop policy if exists "admin insere categorias" on public.categories;
create policy "admin insere categorias" on public.categories for insert to authenticated
  with check (public.is_admin());
drop policy if exists "admin atualiza categorias" on public.categories;
create policy "admin atualiza categorias" on public.categories for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "admin exclui categorias" on public.categories;
create policy "admin exclui categorias" on public.categories for delete to authenticated
  using (public.is_admin());

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

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  cep text not null,
  city text not null,
  state text not null,
  address text not null,
  address_number text not null,
  complement text not null default '',
  note text not null default '',
  subtotal numeric(12,2) not null default 0,
  status text not null default 'pending' check
    (status in ('pending','in_progress','awaiting_payment','paid','shipped','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  image text not null default '',
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12,2) not null check (unit_price > 0),
  line_total numeric(12,2) not null check (line_total > 0)
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.touch_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "admin lê pedidos" on public.orders;
create policy "admin lê pedidos" on public.orders for select to authenticated
  using (public.is_admin());
drop policy if exists "admin atualiza pedidos" on public.orders;
create policy "admin atualiza pedidos" on public.orders for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "admin lê itens dos pedidos" on public.order_items;
create policy "admin lê itens dos pedidos" on public.order_items for select to authenticated
  using (public.is_admin());

-- O checkout cria pedidos por RPC; o visitante não pode ler nem modificar pedidos.
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

-- Atualização imediata do catálogo em outras abas e sessões.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
      alter publication supabase_realtime add table public.products;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories') then
      alter publication supabase_realtime add table public.categories;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'brands') then
      alter publication supabase_realtime add table public.brands;
    end if;
  end if;
end $$;

-- Privilégios da API: a RLS decide quais linhas cada sessão pode usar.
revoke all on public.admin_users, public.profiles, public.products, public.categories, public.brands, public.orders, public.order_items
  from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.products, public.categories, public.brands to anon, authenticated;
grant insert, update, delete on public.products, public.categories, public.brands to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
