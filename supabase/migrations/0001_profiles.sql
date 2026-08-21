-- Profiles: application-level user data keyed to Supabase Auth.
--
-- NOTE ON PASSWORDS -----------------------------------------------------
-- This table deliberately has no password column. Supabase Auth already
-- stores a bcrypt hash in auth.users.encrypted_password, which lives in the
-- `auth` schema and is NOT exposed over the REST API. This table lives in
-- `public`, which IS exposed, so any value here is readable by the account
-- holder and one bad policy away from being readable by anyone. Passwords
-- are verified by GoTrue (signInWithPassword) and changed via
-- supabase.auth.updateUser({ password }) — never read back, never mirrored.
-- ------------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  -- Nullable on purpose: auth.users.email is null for phone-only signups, and
  -- a not-null violation inside the signup trigger would block registration.
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user application profile. Credentials live in auth.users, never here.';

-- Row level security -----------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by their owner" on public.profiles;
create policy "Profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by their owner" on public.profiles;
create policy "Profiles are insertable by their owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by their owner" on public.profiles;
create policy "Profiles are updatable by their owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Deliberately no DELETE policy: profiles are removed by the cascade when
-- the auth user is deleted, not by the client.

-- Table privileges -------------------------------------------------------
-- RLS decides which ROWS a caller sees, but PostgREST still needs a GRANT to
-- touch the table at all. Tables created in the SQL editor do not always
-- inherit the project's default privileges, so grant explicitly.
--
-- `anon` is intentionally omitted: an unauthenticated caller is refused at
-- the privilege layer, before RLS is even consulted.

grant select, insert, update on public.profiles to authenticated;

-- Keep updated_at honest -------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create a profile automatically on signup -------------------------------
-- security definer so the trigger can write to public.profiles while the
-- inserting role is the auth service; search_path pinned to avoid hijacking.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
exception
  -- Never let a profile problem block account creation. The backfill at the
  -- bottom of this file can be re-run to repair any row this skipped.
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mirror email changes made through Supabase Auth ------------------------

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = new.email
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Backfill anyone who signed up before this migration --------------------

insert into public.profiles (id, email)
select u.id, u.email
  from auth.users u
 where u.email is not null
on conflict (id) do nothing;
