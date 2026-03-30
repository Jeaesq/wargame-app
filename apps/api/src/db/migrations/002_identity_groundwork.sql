alter table game_sessions
  add column if not exists owner_user_id text;

update game_sessions
set owner_user_id = coalesce(owner_user_id, game_data ->> 'ownerUserId', 'local-dev-user')
where owner_user_id is null;

alter table game_sessions
  alter column owner_user_id set not null;

create index if not exists game_sessions_owner_user_id_idx
  on game_sessions (owner_user_id);
