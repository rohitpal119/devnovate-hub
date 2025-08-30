-- Enable RLS on admin_whitelist table
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only admins can manage the whitelist
CREATE POLICY "Only admins can manage admin whitelist"
ON public.admin_whitelist
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));