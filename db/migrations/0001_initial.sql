create table if not exists workspaces (
  id text primary key,
  slug text not null unique,
  name text not null,
  owner_member_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  handle text not null,
  created_at timestamptz not null default now()
);

create table if not exists trips (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  owner_member_id text not null references members(id),
  slug text not null unique,
  title text not null,
  summary text not null,
  start_date date not null,
  end_date date not null,
  visibility text not null,
  map_privacy text not null,
  map_delay_minutes integer not null default 30,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists contributors (
  trip_id text not null references trips(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  role text not null,
  primary key (trip_id, member_id)
);

create table if not exists access_links (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  trip_id text references trips(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  role text not null,
  label text not null,
  token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists trip_days (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  day_date date not null,
  label text not null
);

create table if not exists route_legs (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  sequence integer not null,
  day_date date,
  title text not null,
  origin_label text not null,
  destination_label text not null,
  waypoints jsonb not null default '[]'::jsonb,
  travel_mode text not null,
  raw_google_maps_url text,
  planned_path jsonb not null default '[]'::jsonb
);

create table if not exists assets (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  storage text not null,
  path text not null,
  url text not null,
  mime_type text not null,
  size_bytes integer,
  uploaded_at timestamptz not null default now()
);

create table if not exists moments (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  member_id text not null references members(id),
  day_date date not null,
  type text not null,
  status text not null,
  caption text,
  body text,
  asset_id text references assets(id) on delete set null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table if not exists track_sessions (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  member_id text not null references members(id),
  status text not null,
  started_at timestamptz not null,
  ended_at timestamptz
);

create table if not exists track_points (
  id text primary key,
  track_session_id text not null references track_sessions(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  recorded_at timestamptz not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision
);

create table if not exists draft_stories (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  day_date date,
  title text not null,
  summary text not null,
  body text not null,
  source_moment_ids jsonb not null default '[]'::jsonb,
  source_track_session_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists published_stories (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  draft_id text not null references draft_stories(id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text not null,
  body text not null,
  published_at timestamptz not null default now()
);
