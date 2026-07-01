-- Loop Arena schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "uuid-ossp";

-- Players are Supabase Auth users; this table holds display info.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,              -- short human-shareable join code
  host_id uuid not null references public.profiles (id),
  status text not null default 'lobby' check (status in ('lobby', 'active', 'finished')),
  sandbox_id text not null,               -- which seeded-bug sandbox this room uses
  created_at timestamptz not null default now()
);

create table if not exists public.rounds (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  round_number int not null,
  started_at timestamptz,
  ends_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'active', 'finished'))
);

create table if not exists public.bug_reports (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  player_id uuid not null references public.profiles (id),
  bug_id text not null,                   -- matches src/lib/bugs seed definitions
  correct boolean not null,
  points_awarded int not null default 0,
  submitted_at timestamptz not null default now(),
  unique (round_id, player_id, bug_id)    -- one score per player per bug per round
);

create table if not exists public.scores (
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.profiles (id),
  total_points int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.rounds enable row level security;
alter table public.bug_reports enable row level security;
alter table public.scores enable row level security;

create policy "profiles are publicly readable" on public.profiles
  for select using (true);
create policy "users manage their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "rooms are publicly readable" on public.rooms
  for select using (true);
create policy "authenticated users can create rooms" on public.rooms
  for insert with check (auth.uid() = host_id);

create policy "rounds are publicly readable" on public.rounds
  for select using (true);

create policy "bug reports readable by room participants" on public.bug_reports
  for select using (true);
create policy "players submit their own bug reports" on public.bug_reports
  for insert with check (auth.uid() = player_id);

create policy "scores are publicly readable" on public.scores
  for select using (true);

-- Atomic upsert-and-increment for scores, called from the rounds API route.
-- Doing this as a single SQL function (rather than read-then-write in app
-- code) is what actually makes concurrent scoring safe.
create or replace function public.increment_score(
  p_room_id uuid,
  p_player_id uuid,
  p_points int
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.scores (room_id, player_id, total_points, updated_at)
  values (p_room_id, p_player_id, p_points, now())
  on conflict (room_id, player_id)
  do update set
    total_points = public.scores.total_points + excluded.total_points,
    updated_at = now();
end;
$$;

-- Realtime: expose rounds + bug_reports + scores for live leaderboard updates
alter publication supabase_realtime add table public.rounds;
alter publication supabase_realtime add table public.bug_reports;
alter publication supabase_realtime add table public.scores;
