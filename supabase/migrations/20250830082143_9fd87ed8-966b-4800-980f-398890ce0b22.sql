-- Add RLS policy to allow admins to view all blogs for review
CREATE POLICY "Admins can view all blogs" 
ON public.blogs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));