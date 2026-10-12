-- Νέες Οικοδομές Radar — tradesman profiles (run after schema.sql). Safe to run more than once.

-- Offer value on followed projects (for «Τα έργα μου»).
alter table public.saved_leads add column if not exists amount integer check (amount is null or amount >= 0);

-- A customer's public page: radar.gr/m/<slug>
create table if not exists public.business_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name text not null check (char_length(name) between 2 and 120),
  headline text not null default '',
  about text not null default '',
  trades text[] not null default '{}',
  areas text not null default '',
  since_year integer check (since_year is null or since_year between 1900 and 2100),
  phone text not null default '',
  public_email text not null default '',
  website text not null default '',
  address text not null default '',
  tags text[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Finished jobs shown on the profile, each with one photo.
create table if not exists public.profile_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.business_profiles (user_id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  place text not null default '',
  year integer check (year is null or year between 1950 and 2100),
  category text not null default '',
  photo_path text,
  via_radar boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists profile_works_user on public.profile_works (user_id, sort, created_at);

-- «Ζήτα προσφορά» requests sent from a public profile.
create table if not exists public.quote_requests (
  id bigint generated always as identity primary key,
  profile_user_id uuid not null references public.business_profiles (user_id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  project text not null default '',
  area text not null default '',
  message text not null default '',
  ip_hash text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists quote_requests_owner on public.quote_requests (profile_user_id, created_at desc);
create index if not exists quote_requests_ip on public.quote_requests (ip_hash, created_at desc);

-- Everything goes through the website's server; nobody reads these tables directly.
alter table public.business_profiles enable row level security;
alter table public.profile_works enable row level security;
alter table public.quote_requests enable row level security;

-- Photos of finished jobs: anyone may view them, only the website's server uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work-photos', 'work-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
