
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- enum for destination
create type public.capsule_destination as enum ('vault','archive','letter');

-- capsules
create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_path text not null,
  duration_seconds integer not null default 0,
  location text,
  destination public.capsule_destination not null,
  deliver_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index capsules_user_idx on public.capsules(user_id, created_at desc);
create index capsules_letter_idx on public.capsules(user_id, deliver_at) where destination = 'letter' and delivered_at is null;
alter table public.capsules enable row level security;
create policy "capsules self select" on public.capsules for select using (auth.uid() = user_id);
create policy "capsules self insert" on public.capsules for insert with check (auth.uid() = user_id);
create policy "capsules self update" on public.capsules for update using (auth.uid() = user_id);
create policy "capsules self delete" on public.capsules for delete using (auth.uid() = user_id);

-- subscriptions
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'free',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subs self select" on public.subscriptions for select using (auth.uid() = user_id);

-- auto-create profile + subscription on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.subscriptions (user_id, status) values (new.id, 'free');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- private storage bucket for audio
insert into storage.buckets (id, name, public) values ('capsules', 'capsules', false);

create policy "capsules storage self read"
on storage.objects for select
using (bucket_id = 'capsules' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "capsules storage self insert"
on storage.objects for insert
with check (bucket_id = 'capsules' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "capsules storage self delete"
on storage.objects for delete
using (bucket_id = 'capsules' and auth.uid()::text = (storage.foldername(name))[1]);
