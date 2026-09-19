-- ==============================================================================
-- Khan Digital Solution – Digital Visiting Card & Business Profile
-- Supabase Database Schema, Row Level Security (RLS) & Storage Policies
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. SITE DATA TABLE
-- Stores profile data, business info, social links, services, and configuration in JSONB
create table if not exists public.site_data (
  id text primary key default 'kds_main',
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 3. ADMIN USERS TABLE
-- Tracks authorized administrators who have permission to edit the site
create table if not exists public.admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz default now()
);

-- Insert primary admin email
insert into public.admin_users (email)
values 
  ('samim.khanmiyaa@gmail.com')
on conflict (email) do nothing;

-- 4. HELPER FUNCTION: IS_ADMIN()
-- Determines admin authorization ONLY by checking if the authenticated user's email exists in public.admin_users
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_email text;
begin
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if current_email = '' then
    return false;
  end if;
  return exists (
    select 1 
    from public.admin_users 
    where pg_catalog.lower(email) = current_email
  );
end;
$$;

-- 5. ROW LEVEL SECURITY (RLS) FOR SITE_DATA
alter table public.site_data enable row level security;

-- Policy A: Anyone (public visitors & search engines) can READ the card data
drop policy if exists "Allow public read on site_data" on public.site_data;
create policy "Allow public read on site_data"
  on public.site_data
  for select
  using (true);

-- Policy B: Only authorized admins can INSERT or UPDATE site_data
drop policy if exists "Allow admin insert on site_data" on public.site_data;
create policy "Allow admin insert on site_data"
  on public.site_data
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Allow admin update on site_data" on public.site_data;
create policy "Allow admin update on site_data"
  on public.site_data
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6. ROW LEVEL SECURITY FOR ADMIN_USERS
alter table public.admin_users enable row level security;

-- Only authenticated users can check if their email is in admin_users
drop policy if exists "Allow authenticated read admin_users" on public.admin_users;
create policy "Allow authenticated read admin_users"
  on public.admin_users
  for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email') or public.is_admin());

-- 7. SUPABASE STORAGE BUCKET: kds-assets
-- Creates public bucket for profile pictures and business logos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kds-assets', 
  'kds-assets', 
  true, 
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
on conflict (id) do update set 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

-- Storage RLS Policies
-- A. Public can view/download images from kds-assets
drop policy if exists "Public view on kds-assets" on storage.objects;
create policy "Public view on kds-assets"
  on storage.objects
  for select
  using (bucket_id = 'kds-assets');

-- B. Authorized admin can upload images to kds-assets
drop policy if exists "Admin upload on kds-assets" on storage.objects;
create policy "Admin upload on kds-assets"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'kds-assets' and public.is_admin());

-- C. Authorized admin can update/replace images in kds-assets
drop policy if exists "Admin update on kds-assets" on storage.objects;
create policy "Admin update on kds-assets"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'kds-assets' and public.is_admin())
  with check (bucket_id = 'kds-assets' and public.is_admin());

-- D. Authorized admin can delete images in kds-assets
drop policy if exists "Admin delete on kds-assets" on storage.objects;
create policy "Admin delete on kds-assets"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'kds-assets' and public.is_admin());

-- 8. INITIAL SEED DATA
-- Default profile, business details, services, and social links
insert into public.site_data (id, data, updated_at)
values (
  'kds_main',
  '{
    "personal": {
      "name": "Shofikul Islam Samim",
      "designation": "Owner & CEO",
      "company": "Khan Digital Solution",
      "phone": "01744-188460",
      "phoneFormatted": "+8801744188460",
      "whatsapp": "01744-188460",
      "whatsappFormatted": "8801744188460",
      "email": "samim.khanmiyaa@gmail.com",
      "bio": "Passionate entrepreneur, creative technologist, and digital strategist dedicated to scaling modern brands through data-driven marketing, premier design, and cutting-edge web solutions.",
      "photoUrl": "./assets/placeholders/avatar.jpg",
      "website": "https://shofikulislamsamim.github.io/Digital-Visiting-Card/"
    },
    "personalSocials": [
      { "id": "p_fb", "platform": "Facebook", "icon": "facebook", "url": "https://facebook.com/kds.samim", "active": true },
      { "id": "p_ig", "platform": "Instagram", "icon": "instagram", "url": "https://instagram.com/kds.samim", "active": true },
      { "id": "p_li", "platform": "LinkedIn", "icon": "linkedin", "url": "https://linkedin.com/in/shofikul-islam-samim", "active": true },
      { "id": "p_yt", "platform": "YouTube", "icon": "youtube", "url": "https://youtube.com/@KhanDigitalSolution", "active": true },
      { "id": "p_tt", "platform": "TikTok", "icon": "tiktok", "url": "https://tiktok.com/@kds_samim", "active": true }
    ],
    "business": {
      "name": "Khan Digital Solution",
      "tagline": "Your Growth, Our Mission",
      "about": "Khan Digital Solution (KDS) is a premier full-service digital agency empowering businesses, startups, and personal brands worldwide. We engineer growth through high-performance digital marketing, world-class graphic branding, cinematic video production, responsive web development, and dependable IT solutions.",
      "phone": "01744-188460",
      "phoneFormatted": "+8801744188460",
      "whatsapp": "01744-188460",
      "whatsappFormatted": "8801744188460",
      "email": "samim.khanmiyaa@gmail.com",
      "logoUrl": "./assets/placeholders/logo.jpg",
      "website": "https://shofikulislamsamim.github.io/Digital-Visiting-Card/business.html"
    },
    "businessSocials": [
      { "id": "b_fb", "platform": "Facebook", "icon": "facebook", "url": "https://facebook.com/KhanDigitalSolution", "active": true },
      { "id": "b_ig", "platform": "Instagram", "icon": "instagram", "url": "https://instagram.com/KhanDigitalSolution", "active": true },
      { "id": "b_li", "platform": "LinkedIn", "icon": "linkedin", "url": "https://linkedin.com/company/khan-digital-solution", "active": true },
      { "id": "b_yt", "platform": "YouTube", "icon": "youtube", "url": "https://youtube.com/@KhanDigitalSolution", "active": true },
      { "id": "b_tt", "platform": "TikTok", "icon": "tiktok", "url": "https://tiktok.com/@KhanDigitalSolution", "active": true }
    ],
    "services": [
      {
        "id": "srv_1",
        "title": "Digital Marketing",
        "description": "Data-driven SEO, Google & Meta advertising campaigns, audience targeting, content strategy, and conversion-focused growth funnels.",
        "icon": "trending-up",
        "active": true
      },
      {
        "id": "srv_2",
        "title": "Graphic Design",
        "description": "Signature brand identities, bespoke logos, high-impact marketing collateral, UI visual kits, and print-ready creative assets.",
        "icon": "palette",
        "active": true
      },
      {
        "id": "srv_3",
        "title": "Video Editing",
        "description": "Cinematic commercial edits, reels, YouTube production, color grading, sound design, and dynamic motion graphics that hook audiences.",
        "icon": "video",
        "active": true
      },
      {
        "id": "srv_4",
        "title": "Web Design & Development",
        "description": "Modern, responsive, ultra-fast websites, landing pages, e-commerce stores, and custom web applications engineered for performance.",
        "icon": "code",
        "active": true
      },
      {
        "id": "srv_5",
        "title": "IT Solutions",
        "description": "Custom business automation, cloud infrastructure, domain & hosting architecture, system maintenance, and strategic tech consulting.",
        "icon": "cpu",
        "active": true
      }
    ],
    "settings": {
      "publicUrl": "https://shofikulislamsamim.github.io/Digital-Visiting-Card/",
      "themeColor": "#0f172a",
      "accentColor": "#0284c7"
    }
  }'::jsonb,
  now()
)
on conflict (id) do nothing;
