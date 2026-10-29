-- Reem Portfolio CMS
-- شغّلي الملف كاملًا مرة واحدة داخل Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('projects','certificates','training','volunteer')),
  title_ar text not null,
  title_en text default '',
  organization_ar text default '',
  organization_en text default '',
  description_ar text default '',
  description_en text default '',
  date_label text default '',
  badge_ar text default '',
  badge_en text default '',
  image_url text default '',
  logo_url text default '',
  primary_url text default '',
  secondary_url text default '',
  tags jsonb not null default '[]'::jsonb,
  details jsonb not null default '{}'::jsonb,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "Admin can see own access" on public.admin_users;
create policy "Admin can see own access"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can read settings" on public.site_settings;
create policy "Public can read settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admin can insert settings" on public.site_settings;
create policy "Admin can insert settings"
on public.site_settings for insert
to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "Admin can update settings" on public.site_settings;
create policy "Admin can update settings"
on public.site_settings for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

drop policy if exists "Public can read visible portfolio items" on public.portfolio_items;
create policy "Public can read visible portfolio items"
on public.portfolio_items for select
to anon, authenticated
using (is_visible = true or public.is_portfolio_admin());

drop policy if exists "Admin can insert portfolio items" on public.portfolio_items;
create policy "Admin can insert portfolio items"
on public.portfolio_items for insert
to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "Admin can update portfolio items" on public.portfolio_items;
create policy "Admin can update portfolio items"
on public.portfolio_items for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

drop policy if exists "Admin can delete portfolio items" on public.portfolio_items;
create policy "Admin can delete portfolio items"
on public.portfolio_items for delete
to authenticated
using (public.is_portfolio_admin());

drop policy if exists "Admin can read messages" on public.contact_messages;
create policy "Admin can read messages"
on public.contact_messages for select
to authenticated
using (public.is_portfolio_admin());

drop policy if exists "Admin can update messages" on public.contact_messages;
create policy "Admin can update messages"
on public.contact_messages for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

grant select on public.admin_users to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;
grant select, update on public.contact_messages to authenticated;

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view portfolio media" on storage.objects;
create policy "Public can view portfolio media"
on storage.objects for select
to public
using (bucket_id = 'portfolio-media');

drop policy if exists "Admin can upload portfolio media" on storage.objects;
create policy "Admin can upload portfolio media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

drop policy if exists "Admin can update portfolio media" on storage.objects;
create policy "Admin can update portfolio media"
on storage.objects for update
to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin())
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

drop policy if exists "Admin can delete portfolio media" on storage.objects;
create policy "Admin can delete portfolio media"
on storage.objects for delete
to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

-- بعد إنشاء حسابك من Authentication > Users شغّلي السطر التالي وحده
-- بعد استبدال بريد المثال ببريدك:
--
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_EMAIL@example.com'
-- on conflict (user_id) do nothing;
