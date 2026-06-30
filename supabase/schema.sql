-- HighThrive Admin: members + automation (Skool → Zapier → Supabase → Dashboard)
--
-- Canonical schema: supabase/migrations/20250701000000_initial_schema.sql
-- Apply via CLI:  npm run db:push
-- Or paste this file in Supabase SQL Editor: Dashboard → SQL → New query

drop table if exists public.daily_send_log cascade;
drop table if exists public.members cascade;
drop table if exists public.app_settings cascade;

create table public.members (
  id bigint generated always as identity primary key,
  first_name text not null,
  last_name text not null default '',
  email text not null unique,
  skool_id text unique,
  phone text,
  invited_by text,
  joined_date date not null default current_date,
  question1 text,
  answer1 text,
  question2 text,
  answer2 text,
  question3 text,
  answer3 text,
  price text,
  recurring_interval text,
  tier text,
  ltv text not null default '$0',
  avatar_url text,
  -- Automation / migration tracking (Zapier writes these back)
  migration_status text not null default 'pending'
    check (migration_status in ('pending', 'new', 'messaged', 'fb_joined')),
  dm_sent boolean not null default false,
  date_messaged date,
  fb_joined boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_send_log (
  id bigint generated always as identity primary key,
  send_date date not null default current_date,
  members_sent int not null default 0,
  zapier_status text default 'sent',
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value text not null
);

insert into public.app_settings (key, value)
values ('zapier_api_key', 'change-me-before-going-live')
on conflict (key) do nothing;

create index if not exists members_email_idx on public.members (email);
create index if not exists members_skool_id_idx on public.members (skool_id);
create index if not exists members_migration_idx on public.members (migration_status, dm_sent);
create index if not exists members_dm_pending_idx on public.members (dm_sent) where dm_sent = false;
create index if not exists daily_send_log_date_idx on public.daily_send_log (send_date desc);

alter table public.members enable row level security;
alter table public.daily_send_log enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "members_anon_all" on public.members;
create policy "members_anon_all"
  on public.members for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "daily_log_anon_all" on public.daily_send_log;
create policy "daily_log_anon_all"
  on public.daily_send_log for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "settings_anon_read" on public.app_settings;
create policy "settings_anon_read"
  on public.app_settings for select to anon, authenticated
  using (true);

-- ─── Zapier API: verify shared secret ───────────────────────────────────────

create or replace function public.zapier_verify_key(p_api_key text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.app_settings
    where key = 'zapier_api_key' and value = p_api_key
  );
$$;

-- POST /members/add — Skool webhook → Zapier Path B
create or replace function public.zapier_add_member(
  p_api_key text,
  p_name text,
  p_email text,
  p_skool_id text,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_parts text[];
  v_row public.members%rowtype;
begin
  if not public.zapier_verify_key(p_api_key) then
    raise exception 'Unauthorized';
  end if;

  v_parts := string_to_array(trim(p_name), ' ');

  insert into public.members (
    first_name, last_name, email, skool_id, phone,
    migration_status, dm_sent, fb_joined
  )
  values (
    coalesce(v_parts[1], 'Member'),
    coalesce(array_to_string(v_parts[2:array_length(v_parts, 1)], ' '), ''),
    lower(trim(p_email)),
    p_skool_id,
    p_phone,
    'new',
    false,
    false
  )
  on conflict (email) do update set
    skool_id = coalesce(excluded.skool_id, members.skool_id),
    phone = coalesce(excluded.phone, members.phone),
    migration_status = 'new',
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'action', 'add',
    'member', jsonb_build_object(
      'id', v_row.id,
      'email', v_row.email,
      'skool_id', v_row.skool_id,
      'migration_status', v_row.migration_status,
      'dm_sent', v_row.dm_sent
    )
  );
end;
$$;

-- POST /members/update — after Skool DM sent (Path A or B)
create or replace function public.zapier_update_member(
  p_api_key text,
  p_skool_id text,
  p_status text default null,
  p_date_messaged date default current_date,
  p_dm_sent boolean default true,
  p_fb_joined boolean default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row public.members%rowtype;
  v_status text;
begin
  if not public.zapier_verify_key(p_api_key) then
    raise exception 'Unauthorized';
  end if;

  v_status := coalesce(p_status, case when p_dm_sent then 'messaged' else 'pending' end);

  update public.members set
    migration_status = v_status,
    dm_sent = coalesce(p_dm_sent, dm_sent),
    date_messaged = coalesce(p_date_messaged, date_messaged, current_date),
    fb_joined = coalesce(p_fb_joined, fb_joined),
    updated_at = now()
  where skool_id = p_skool_id
  returning * into v_row;

  if not found then
    raise exception 'Member not found: %', p_skool_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'action', 'update',
    'member', jsonb_build_object(
      'id', v_row.id,
      'skool_id', v_row.skool_id,
      'migration_status', v_row.migration_status,
      'dm_sent', v_row.dm_sent,
      'date_messaged', v_row.date_messaged,
      'fb_joined', v_row.fb_joined
    )
  );
end;
$$;

-- Zap 1: GET daily batch (pending members for Skool DM)
create or replace function public.zapier_get_daily_batch(
  p_api_key text,
  p_limit int default 1000
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_members jsonb;
  v_count int;
begin
  if not public.zapier_verify_key(p_api_key) then
    raise exception 'Unauthorized';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'skool_id', m.skool_id,
    'skoolMemberId', m.skool_id,
    'name', trim(m.first_name || ' ' || m.last_name),
    'firstName', m.first_name,
    'lastName', m.last_name,
    'email', m.email,
    'phone', m.phone,
    'migration_status', m.migration_status
  )), '[]'::jsonb)
  into v_members
  from (
    select * from public.members
    where dm_sent = false and fb_joined = false
    order by joined_date asc
    limit least(greatest(p_limit, 1), 5000)
  ) m;

  v_count := jsonb_array_length(v_members);

  return jsonb_build_object(
    'event', 'fb_transfer.daily_batch',
    'timestamp', now(),
    'batch_size', v_count,
    'members', v_members
  );
end;
$$;

-- Log daily send from Zapier after batch completes
create or replace function public.zapier_log_daily_send(
  p_api_key text,
  p_members_sent int,
  p_zapier_status text default 'sent'
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not public.zapier_verify_key(p_api_key) then
    raise exception 'Unauthorized';
  end if;

  insert into public.daily_send_log (send_date, members_sent, zapier_status)
  values (current_date, p_members_sent, p_zapier_status);

  return jsonb_build_object('ok', true, 'logged', p_members_sent);
end;
$$;

grant execute on function public.zapier_add_member to anon, authenticated;
grant execute on function public.zapier_update_member to anon, authenticated;
grant execute on function public.zapier_get_daily_batch to anon, authenticated;
grant execute on function public.zapier_log_daily_send to anon, authenticated;

-- Avatar storage
insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', true)
on conflict (id) do nothing;

drop policy if exists "member_avatars_public_read" on storage.objects;
create policy "member_avatars_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'member-avatars');

drop policy if exists "member_avatars_anon_upload" on storage.objects;
create policy "member_avatars_anon_upload"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'member-avatars');

drop policy if exists "member_avatars_anon_update" on storage.objects;
create policy "member_avatars_anon_update"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'member-avatars');

drop policy if exists "member_avatars_anon_delete" on storage.objects;
create policy "member_avatars_anon_delete"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'member-avatars');
