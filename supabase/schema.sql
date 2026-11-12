create table if not exists public.players (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 16),
  xp integer not null default 0 check (xp >= 0),
  rings_total integer not null default 0 check (rings_total >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_rules (
  game_id text primary key,
  better text not null check (better in ('high', 'low')),
  min_score numeric not null,
  max_score numeric not null
);

create table if not exists public.scores (
  player_id uuid not null references public.players(id) on delete cascade,
  game_id text not null references public.game_rules(game_id),
  mode_id text not null default '',
  mode_label text not null default '',
  score numeric not null,
  info text not null default '',
  updated_at timestamptz not null default now(),
  primary key (player_id, game_id, mode_id)
);

create index if not exists players_xp_idx on public.players (xp desc);
create index if not exists players_rings_idx on public.players (rings_total desc);
create index if not exists scores_rank_idx on public.scores (game_id, mode_id, score);

alter table public.players enable row level security;
alter table public.game_rules enable row level security;
alter table public.scores enable row level security;

revoke all on public.players from anon, authenticated;
revoke all on public.game_rules from anon, authenticated;
revoke all on public.scores from anon, authenticated;

insert into public.game_rules (game_id, better, min_score, max_score) values
  ('2048', 'high', 1, 1000000),
  ('adivina', 'high', 1, 1000),
  ('ahorcado', 'high', 1, 2000),
  ('anillos', 'high', 1, 200000),
  ('bugs', 'high', 1, 200000),
  ('buscaminas', 'low', 2, 3600),
  ('caos', 'high', 1, 200000),
  ('codigo', 'high', 1, 1000),
  ('esquiva', 'high', 1, 200000),
  ('flap', 'high', 1, 5000),
  ('hanoi', 'low', 7, 5000),
  ('laberinto', 'high', 1, 200000),
  ('ladrillos', 'high', 1, 200000),
  ('lightsout', 'low', 1, 2000),
  ('mates', 'high', 1, 500),
  ('memoria', 'low', 6, 2000),
  ('palabrle', 'high', 1, 1000),
  ('pong', 'high', 1, 1000),
  ('puzzle15', 'low', 3, 5000),
  ('reflejo', 'low', 80, 5000),
  ('simon', 'high', 1, 500),
  ('snake', 'high', 1, 200000),
  ('stroop', 'high', 1, 500),
  ('teclea', 'high', 1, 400),
  ('turbillo', 'high', 1, 200000)
on conflict (game_id) do update
  set better = excluded.better, min_score = excluded.min_score, max_score = excluded.max_score;

create or replace function public.submit_profile(p_id uuid, p_name text, p_xp integer, p_rings integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := left(btrim(coalesce(p_name, '')), 16);
  v_old public.players%rowtype;
begin
  if p_id is null or v_name = '' or p_xp is null or p_rings is null then
    raise exception 'invalid_input';
  end if;
  if p_xp < 0 or p_rings < 0 or p_xp > 500000 or p_rings > 500000 then
    raise exception 'out_of_range';
  end if;
  select * into v_old from public.players where id = p_id;
  if found then
    if v_old.updated_at > now() - interval '1 second' then
      return 'throttled';
    end if;
    if p_xp - v_old.xp > 5000 or p_rings - v_old.rings_total > 5000 then
      raise exception 'too_fast';
    end if;
    update public.players
      set name = v_name, xp = p_xp, rings_total = p_rings, updated_at = now()
      where id = p_id;
  else
    insert into public.players (id, name, xp, rings_total) values (p_id, v_name, p_xp, p_rings);
  end if;
  return 'ok';
end;
$$;

create or replace function public.submit_score(
  p_id uuid, p_game text, p_mode_id text, p_mode_label text, p_score numeric, p_info text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.game_rules%rowtype;
  v_old numeric;
  v_mode text := coalesce(p_mode_id, '');
  v_label text := left(btrim(coalesce(p_mode_label, '')), 24);
  v_info text := left(btrim(coalesce(p_info, '')), 40);
begin
  if v_mode !~ '^[a-z0-9]{0,12}$' then
    raise exception 'invalid_mode';
  end if;
  select * into r from public.game_rules where game_id = p_game;
  if not found then
    raise exception 'unknown_game';
  end if;
  if p_score is null or p_score < r.min_score or p_score > r.max_score then
    raise exception 'out_of_range';
  end if;
  if not exists (select 1 from public.players where id = p_id) then
    raise exception 'no_player';
  end if;
  select score into v_old from public.scores
    where player_id = p_id and game_id = p_game and mode_id = v_mode;
  if found then
    if (r.better = 'high' and p_score <= v_old) or (r.better = 'low' and p_score >= v_old) then
      return 'kept';
    end if;
    update public.scores
      set score = p_score, mode_label = v_label, info = v_info, updated_at = now()
      where player_id = p_id and game_id = p_game and mode_id = v_mode;
  else
    if (select count(*) from public.scores where player_id = p_id and game_id = p_game) >= 8 then
      raise exception 'too_many_modes';
    end if;
    insert into public.scores (player_id, game_id, mode_id, mode_label, score, info)
      values (p_id, p_game, v_mode, v_label, p_score, v_info);
  end if;
  return 'saved';
end;
$$;

create or replace function public.get_top_players(p_sort text, p_limit integer default 20)
returns table (name text, xp integer, rings_total integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.name, p.xp, p.rings_total
  from public.players p
  order by case when p_sort = 'rings' then p.rings_total else p.xp end desc, p.updated_at asc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
$$;

create or replace function public.get_my_rank(p_id uuid, p_sort text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me public.players%rowtype;
begin
  select * into me from public.players where id = p_id;
  if not found then
    return null;
  end if;
  if p_sort = 'rings' then
    return (select count(*) + 1 from public.players o where o.rings_total > me.rings_total)::integer;
  end if;
  return (select count(*) + 1 from public.players o where o.xp > me.xp)::integer;
end;
$$;

create or replace function public.get_top_scores(p_game text, p_mode text, p_limit integer default 10)
returns table (name text, score numeric, info text, mode_label text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_better text;
begin
  select g.better into v_better from public.game_rules g where g.game_id = p_game;
  if v_better is null then
    return;
  end if;
  return query
    select p.name, s.score, s.info, s.mode_label
    from public.scores s
    join public.players p on p.id = s.player_id
    where s.game_id = p_game and s.mode_id = coalesce(p_mode, '')
    order by case when v_better = 'low' then s.score else -s.score end asc, s.updated_at asc
    limit least(greatest(coalesce(p_limit, 10), 1), 50);
end;
$$;

create or replace function public.get_game_modes(p_game text)
returns table (mode_id text, mode_label text, n bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.mode_id, max(s.mode_label), count(*)
  from public.scores s
  where s.game_id = p_game
  group by s.mode_id
  order by count(*) desc, s.mode_id asc
$$;

create or replace function public.delete_player(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.players where id = p_id;
  return 'ok';
end;
$$;

revoke all on function public.submit_profile(uuid, text, integer, integer) from public;
revoke all on function public.submit_score(uuid, text, text, text, numeric, text) from public;
revoke all on function public.get_top_players(text, integer) from public;
revoke all on function public.get_my_rank(uuid, text) from public;
revoke all on function public.get_top_scores(text, text, integer) from public;
revoke all on function public.get_game_modes(text) from public;
revoke all on function public.delete_player(uuid) from public;

grant execute on function public.submit_profile(uuid, text, integer, integer) to anon, authenticated;
grant execute on function public.submit_score(uuid, text, text, text, numeric, text) to anon, authenticated;
grant execute on function public.get_top_players(text, integer) to anon, authenticated;
grant execute on function public.get_my_rank(uuid, text) to anon, authenticated;
grant execute on function public.get_top_scores(text, text, integer) to anon, authenticated;
grant execute on function public.get_game_modes(text) to anon, authenticated;
grant execute on function public.delete_player(uuid) to anon, authenticated;
