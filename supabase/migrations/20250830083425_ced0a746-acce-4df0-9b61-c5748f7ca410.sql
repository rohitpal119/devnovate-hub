-- Add admin emails to the whitelist
INSERT INTO public.admin_whitelist (email) VALUES 
('rohitprakashpal@gmail.com'),
('karpeasamiksha@gmail.com')
ON CONFLICT (email) DO NOTHING;