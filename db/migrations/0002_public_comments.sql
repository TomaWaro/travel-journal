create table if not exists public_comments (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  story_id text references published_stories(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists public_comments_trip_created_idx
  on public_comments (trip_id, created_at desc);

create index if not exists public_comments_story_created_idx
  on public_comments (story_id, created_at desc);
