alter table public_comments
  add column if not exists moment_id text references moments(id) on delete cascade;

create index if not exists public_comments_moment_created_idx
  on public_comments (moment_id, created_at desc);
