create table if not exists game_sessions (
  id text primary key,
  scenario_id text not null,
  status text not null,
  mode text not null,
  current_faction_id text,
  turn_number integer not null,
  target_game_length text not null,
  game_data jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists game_sessions_updated_at_idx
  on game_sessions (updated_at desc);

create index if not exists game_sessions_status_idx
  on game_sessions (status);

create table if not exists game_turns (
  sequence_id bigserial primary key,
  id text not null unique,
  session_id text not null references game_sessions(id) on delete cascade,
  turn_number integer not null,
  actor_player_id text not null,
  actor_faction_id text not null,
  resolved_at timestamptz not null,
  turn_data jsonb not null
);

create index if not exists game_turns_session_sequence_idx
  on game_turns (session_id, sequence_id);
