-- Autenticação administrativa baseada em auth.users + public.profiles.
-- Execute uma vez no SQL Editor do projeto já configurado.

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

insert into public.profiles (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do update set email = excluded.email;

-- Migra administradores cadastrados pelo esquema anterior.
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

alter table public.profiles enable row level security;

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

revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;
