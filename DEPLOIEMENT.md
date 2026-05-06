import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

/* ─────────────────────────────────────────────────────────────
   SQL à coller dans l'éditeur SQL de Supabase (une seule fois)
   ─────────────────────────────────────────────────────────────

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  a1 text not null,
  a2 text not null,
  b1 text not null,
  b2 text not null,
  score_a integer not null,
  score_b integer not null,
  played_at timestamptz default now()
);

create table settings (
  id integer primary key default 1,
  min_matches integer not null default 3
);

insert into settings (id, min_matches) values (1, 3)
  on conflict (id) do nothing;

-- Activer le temps réel
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table players;

-- Accès public (pas d'authentification)
alter table players enable row level security;
alter table matches enable row level security;
alter table settings enable row level security;

create policy "public_all" on players for all using (true) with check (true);
create policy "public_all" on matches for all using (true) with check (true);
create policy "public_all" on settings for all using (true) with check (true);

─────────────────────────────────────────────────────────────── */
