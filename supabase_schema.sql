-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text unique,
  role text check (role in ('student', 'landlord', 'broker', 'admin')) default 'student',
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create properties table
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  landlord_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  price numeric not null check (price > 0),
  location text not null,
  address text, -- Hidden from students, only general location shown
  rooms integer not null check (rooms > 0),
  bathrooms integer not null check (bathrooms > 0),
  gender_type text check (gender_type in ('male', 'female', 'any')) default 'any',
  images text[] default '{}',
  is_verified boolean default false,
  is_featured boolean default false,
  has_ac boolean default false,
  has_internet boolean default false,
  has_elevator boolean default false,
  floor integer check (floor >= 0),
  beds integer default 1 check (beds >= 0),
  status text check (status in ('available', 'rented')) default 'available',
  review_status text check (review_status in ('pending_review', 'approved', 'rejected')) default 'pending_review',
  rejection_reason text,
  views_count integer default 0,
  video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on properties
alter table public.properties enable row level security;

-- Properties policies
-- Public can only see approved properties
create policy "Approved properties are viewable by everyone" on public.properties
  for select using (review_status = 'approved');

-- Landlords can see all of their own properties (regardless of review status)
create policy "Owners can view their own properties" on public.properties
  for select using (auth.uid() = landlord_id);

-- Admins can view all properties
create policy "Admins can view all properties" on public.properties
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Landlords/Brokers can insert their own properties" on public.properties
  for insert with check (auth.uid() = landlord_id);

create policy "Landlords/Brokers can update their own properties" on public.properties
  for update using (auth.uid() = landlord_id);

-- Admins can update any property (for approve/reject)
create policy "Admins can update any property" on public.properties
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Landlords/Brokers can delete their own properties" on public.properties
  for delete using (auth.uid() = landlord_id);

create policy "Admins can delete any property" on public.properties
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Migration helper: run this if adding review_status to existing table
-- ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS review_status text check (review_status in ('pending_review', 'approved', 'rejected')) default 'pending_review';
-- ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason text;
-- ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS beds integer default 1 check (beds >= 0);
-- ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_url text;
-- UPDATE public.properties SET review_status = 'approved' WHERE review_status IS NULL;

-- Create booking_requests table for mediator bookings
create table public.booking_requests (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'contacted', 'completed', 'canceled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on booking_requests
alter table public.booking_requests enable row level security;

-- Booking Requests policies
create policy "Students can insert booking requests" on public.booking_requests
  for insert with check (auth.uid() = student_id);

create policy "Students can view their own booking requests" on public.booking_requests
  for select using (auth.uid() = student_id);

create policy "Admins and Brokers can view all booking requests" on public.booking_requests
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'broker')
    )
  );

create policy "Admins and Brokers can update booking requests" on public.booking_requests
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'broker')
    )
  );

create policy "Students can update/cancel their own booking requests" on public.booking_requests
  for update using (auth.uid() = student_id);

-- Create reports table for suspicious listings
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on reports
alter table public.reports enable row level security;

-- Reports policies
create policy "Anyone can file a report" on public.reports
  for insert with check (true);

create policy "Admins can view reports" on public.reports
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger to automatically create a profile for new auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on notifications
alter table public.notifications enable row level security;

-- Notifications policies
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Admins can insert notifications" on public.notifications
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Create password_reset_requests table
create table public.password_reset_requests (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  full_name text,
  status text check (status in ('pending', 'resolved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on password_reset_requests
alter table public.password_reset_requests enable row level security;

-- Policies for password_reset_requests
create policy "Anyone can insert password reset requests" on public.password_reset_requests
  for insert with check (true);

create policy "Admins can view reset requests" on public.password_reset_requests
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update reset requests" on public.password_reset_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Add balance column to profiles table
alter table public.profiles add column if not exists balance numeric default 0.00 not null check (balance >= 0);

-- Create withdrawal_requests table
create table public.withdrawal_requests (
  id uuid default gen_random_uuid() primary key,
  broker_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  wallet_number text not null,
  wallet_type text default 'vodafone_cash',
  status text check (status in ('pending', 'approved', 'paid', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on withdrawal_requests
alter table public.withdrawal_requests enable row level security;

-- Policies for withdrawal_requests
create policy "Brokers can insert withdrawal requests" on public.withdrawal_requests
  for insert with check (auth.uid() = broker_id);

create policy "Brokers can view their own requests" on public.withdrawal_requests
  for select using (auth.uid() = broker_id);

create policy "Admins can view all requests" on public.withdrawal_requests
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update requests" on public.withdrawal_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- BROKER VERIFICATION SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

-- Add is_broker_verified field to profiles (brokers must be verified before listing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_broker_verified boolean DEFAULT false;

-- Create broker_verification_requests table
CREATE TABLE IF NOT EXISTS public.broker_verification_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  notes text,                         -- نص تعريفي من السمسار
  document_image text,                -- صورة المستند base64 (اختياري)
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason text,              -- سبب الرفض (يُبعت كإشعار)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on broker_verification_requests
ALTER TABLE public.broker_verification_requests ENABLE ROW LEVEL SECURITY;

-- Brokers can insert their own requests
CREATE POLICY "Brokers can insert verification requests" ON public.broker_verification_requests
  FOR INSERT WITH CHECK (auth.uid() = broker_id);

-- Brokers can view their own requests
CREATE POLICY "Brokers can view their own verification requests" ON public.broker_verification_requests
  FOR SELECT USING (auth.uid() = broker_id);

-- Admins can view all verification requests
CREATE POLICY "Admins can view all verification requests" ON public.broker_verification_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update (approve/reject) verification requests
CREATE POLICY "Admins can update verification requests" ON public.broker_verification_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Migration helper (run if table already exists)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_broker_verified boolean DEFAULT false;

-- Add RLS policy to allow admins to update profiles (e.g. verify brokers or update balance)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create featured_requests table for Sell Faster property marketing
CREATE TABLE IF NOT EXISTS public.featured_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payment_method text CHECK (payment_method IN ('contact', 'wallet')) DEFAULT 'contact',
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.featured_requests ENABLE ROW LEVEL SECURITY;

-- Policies for featured_requests
CREATE POLICY "Users can insert their own featured requests" ON public.featured_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own featured requests" ON public.featured_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all featured requests" ON public.featured_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update featured requests" ON public.featured_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create wallet_transactions table for broker financial logs
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  type text CHECK (type IN ('deposit', 'withdrawal', 'withdrawal_refund', 'featured_deduction', 'admin_deduction')) NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_transactions
CREATE POLICY "Brokers can view their own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = broker_id);

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── BED SYSTEM MIGRATION ───────────────────────────────────────────────────
-- Add rent_type and available_beds columns to public.properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rent_type text CHECK (rent_type IN ('apartment', 'bed')) DEFAULT 'apartment';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS available_beds integer DEFAULT 1 CHECK (available_beds >= 0);

-- Sync available_beds with existing properties' beds count
UPDATE public.properties SET available_beds = beds WHERE available_beds IS NULL;

-- Add requested_beds column to public.booking_requests
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS requested_beds integer DEFAULT 1 CHECK (requested_beds >= 1);

