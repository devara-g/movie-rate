-- ==========================================================
-- CINEHEARTH: CINEMA DIARY & LOGGING DATABASE SCHEMA
-- PostgreSQL schema for Supabase with Row Level Security (RLS)
-- ==========================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  name text not null,
  avatar_url text,
  bio text,
  location text default 'Indonesia',
  role text default 'Cinephile',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MOVIE LOGS & DIARY TABLE
create table if not exists public.movie_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- references profiles or auth.users
  tmdb_id integer not null,
  film_title text not null,
  film_year integer not null,
  film_poster text not null,
  rating numeric(2, 1) not null check (rating >= 0.5 and rating <= 5.0),
  review_text text,
  watched_date date default current_date not null,
  watch_format text default 'Digital' not null, -- '35mm Print', 'IMAX', '2D Cinema', 'Dolby Atmos'
  is_rewatch boolean default false not null,
  is_favorite boolean default false not null,
  likes_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. WATCHLISTS TABLE
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tmdb_id integer not null,
  film_title text not null,
  film_poster text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tmdb_id)
);

-- 4. CUSTOM LISTS TABLE
create table if not exists public.custom_lists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  description text,
  is_private boolean default false not null,
  likes_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. CUSTOM LIST FILMS TABLE
create table if not exists public.custom_list_films (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.custom_lists(id) on delete cascade not null,
  tmdb_id integer not null,
  film_title text not null,
  film_year integer not null,
  film_poster text not null,
  film_rating numeric(2, 1) default 4.0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(list_id, tmdb_id)
);

-- 6. REVIEW COMMENTS / DISCUSSION TABLE
create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id text not null,
  user_id text not null,
  user_name text not null,
  user_username text not null,
  user_avatar text,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  message text not null,
  type text default 'system' not null, -- 'like', 'comment', 'watchlist', 'system'
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. PERFORMANCE INDEXES
create index if not exists idx_movie_logs_tmdb_id on public.movie_logs(tmdb_id);
create index if not exists idx_movie_logs_user_id on public.movie_logs(user_id);
create index if not exists idx_movie_logs_created_at on public.movie_logs(created_at desc);
create index if not exists idx_watchlists_user_tmdb on public.watchlists(user_id, tmdb_id);
create index if not exists idx_custom_lists_user_id on public.custom_lists(user_id);
create index if not exists idx_custom_list_films_list_id on public.custom_list_films(list_id);
create index if not exists idx_review_comments_review_id on public.review_comments(review_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.movie_logs enable row level security;
alter table public.watchlists enable row level security;
alter table public.custom_lists enable row level security;
alter table public.custom_list_films enable row level security;
alter table public.review_comments enable row level security;
alter table public.notifications enable row level security;

-- Permissive public read & write policies for seamless community interactions
drop policy if exists "Allow public read on profiles" on public.profiles;
create policy "Allow public read on profiles" on public.profiles for select using (true);

drop policy if exists "Allow public read on movie_logs" on public.movie_logs;
create policy "Allow public read on movie_logs" on public.movie_logs for select using (true);

drop policy if exists "Allow public insert on movie_logs" on public.movie_logs;
create policy "Allow public insert on movie_logs" on public.movie_logs for insert with check (true);

drop policy if exists "Allow public read on watchlists" on public.watchlists;
create policy "Allow public read on watchlists" on public.watchlists for select using (true);

drop policy if exists "Allow public insert on watchlists" on public.watchlists;
create policy "Allow public insert on watchlists" on public.watchlists for insert with check (true);

drop policy if exists "Allow public delete on watchlists" on public.watchlists;
create policy "Allow public delete on watchlists" on public.watchlists for delete using (true);

drop policy if exists "Allow public read on custom_lists" on public.custom_lists;
create policy "Allow public read on custom_lists" on public.custom_lists for select using (true);

drop policy if exists "Allow public insert on custom_lists" on public.custom_lists;
create policy "Allow public insert on custom_lists" on public.custom_lists for insert with check (true);

drop policy if exists "Allow public delete on custom_lists" on public.custom_lists;
create policy "Allow public delete on custom_lists" on public.custom_lists for delete using (true);

drop policy if exists "Allow public read on custom_list_films" on public.custom_list_films;
create policy "Allow public read on custom_list_films" on public.custom_list_films for select using (true);

drop policy if exists "Allow public insert on custom_list_films" on public.custom_list_films;
create policy "Allow public insert on custom_list_films" on public.custom_list_films for insert with check (true);

drop policy if exists "Allow public delete on custom_list_films" on public.custom_list_films;
create policy "Allow public delete on custom_list_films" on public.custom_list_films for delete using (true);

drop policy if exists "Allow public read on review_comments" on public.review_comments;
create policy "Allow public read on review_comments" on public.review_comments for select using (true);

drop policy if exists "Allow public insert on review_comments" on public.review_comments;
create policy "Allow public insert on review_comments" on public.review_comments for insert with check (true);

drop policy if exists "Allow public read on notifications" on public.notifications;
create policy "Allow public read on notifications" on public.notifications for select using (true);

drop policy if exists "Allow public insert on notifications" on public.notifications;
create policy "Allow public insert on notifications" on public.notifications for insert with check (true);

drop policy if exists "Allow public update on notifications" on public.notifications;
create policy "Allow public update on notifications" on public.notifications for update using (true);

-- ==========================================================
-- 10. DIRECT MESSAGES / REALTIME WEBSOCKET CHAT TABLE
-- ==========================================================
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  sender_name text not null,
  sender_avatar text,
  receiver_id text not null,
  receiver_name text not null,
  receiver_avatar text,
  message text not null,
  film_attachment jsonb,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_direct_messages_sender on public.direct_messages(sender_id);
create index if not exists idx_direct_messages_receiver on public.direct_messages(receiver_id);
create index if not exists idx_direct_messages_created on public.direct_messages(created_at desc);

alter table public.direct_messages enable row level security;
drop policy if exists "Allow public read on direct_messages" on public.direct_messages;
create policy "Allow public read on direct_messages" on public.direct_messages for select using (true);

drop policy if exists "Allow public insert on direct_messages" on public.direct_messages;
create policy "Allow public insert on direct_messages" on public.direct_messages for insert with check (true);

drop policy if exists "Allow public update on direct_messages" on public.direct_messages;
create policy "Allow public update on direct_messages" on public.direct_messages for update using (true);

-- Enable Supabase Realtime replication on direct_messages
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
exception
  when others then null;
end $$;

-- ==========================================================
-- 11. JOURNAL ESSAYS & FILM CRITIQUE TABLE
-- ==========================================================
create table if not exists public.journal_essays (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  author_name text not null,
  author_avatar text,
  author_role text default 'Cinephile Critic',
  title text not null,
  subtitle text default '',
  film_subject text not null,
  read_time text default '5 min read',
  lead_paragraph text not null,
  body_text text not null,
  pull_quote text,
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_journal_essays_created on public.journal_essays(created_at desc);

alter table public.journal_essays enable row level security;
drop policy if exists "Allow public read on journal_essays" on public.journal_essays;
create policy "Allow public read on journal_essays" on public.journal_essays for select using (true);

drop policy if exists "Allow public insert on journal_essays" on public.journal_essays;
create policy "Allow public insert on journal_essays" on public.journal_essays for insert with check (true);
