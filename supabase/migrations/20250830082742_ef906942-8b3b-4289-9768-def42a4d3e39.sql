-- 1) Create admin whitelist table
create table if not exists public.admin_whitelist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- 2) Update handle_new_user to ignore client-provided role and set from whitelist
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    case
      when exists (select 1 from public.admin_whitelist w where lower(w.email) = lower(new.email)) then 'admin'
      else 'blogger'
    end
  );
  return new;
end;
$$;

-- 3) Ensure trigger exists on auth.users to populate profiles on signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END$$;