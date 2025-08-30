-- Update your own profile to admin role (replace with your user email)
-- First, find your profile ID and then update the role
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@domain.com'  -- Replace with your actual email
) 
AND role = 'blogger';

-- You can also manually set any profile to admin by profile ID:
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-profile-uuid';