-- Νέες Οικοδομές Radar — database setup.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- Municipalities: filled in automatically with map coordinates the first time a permit appears there.
create table if not exists public.municipalities (
  code text primary key,
  lat double precision,
  lon double precision,
  geocoded_at timestamptz
);

-- Building permits pulled from Diavgeia every morning.
create table if not exists public.permits (
  ada text primary key,
  subject text not null,
  title text not null,
  stage text not null check (stage in ('ok', 'pre')),
  type text not null,
  pool boolean not null default false,
  municipality_code text,
  unit_code text generated always as (left(municipality_code, 2)) stored,
  issued_at timestamptz not null,
  published_at timestamptz not null,
  document_url text not null,
  created_at timestamptz not null default now()
);
create index if not exists permits_unit_published on public.permits (unit_code, published_at desc);
create index if not exists permits_published on public.permits (published_at desc);

-- One row per customer, created automatically when they first log in.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  business_name text,
  plan text check (plan in ('local', 'region', 'pro')),
  status text,
  billing_interval text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  trial_end timestamptz,
  units text[] not null default '{}',
  regions text[] not null default '{}',
  products text[] not null default '{}',
  digest boolean not null default true,
  last_digest_at timestamptz,
  created_at timestamptz not null default now()
);

-- Projects a customer is following, with their own notes and progress.
create table if not exists public.saved_leads (
  user_id uuid not null references auth.users (id) on delete cascade,
  ada text not null references public.permits (ada) on delete cascade,
  status text not null default 'new' check (status in ('new', 'contacted', 'offer', 'won', 'lost')),
  note text not null default '',
  remind_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, ada)
);

-- Log of each daily run, so you can see that the robot works.
create table if not exists public.runs (
  id bigint generated always as identity primary key,
  kind text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  details jsonb
);

-- Create a profile when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Security: customers can only read their own profile and their own saved projects.
-- Permits are served through the website's server, which checks the customer's plan first.
alter table public.municipalities enable row level security;
alter table public.permits enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_leads enable row level security;
alter table public.runs enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "own leads" on public.saved_leads;
create policy "own leads" on public.saved_leads for select using (auth.uid() = user_id);
