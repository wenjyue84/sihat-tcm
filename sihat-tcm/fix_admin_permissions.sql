/*
  Fix for Admin Permissions
  Run this in your Supabase Dashboard SQL Editor to allow Admins to edit and delete users.
*/

-- 1. Allow Admins to UPDATE any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. Allow Admins to DELETE any profile
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Allow Admins to DELETE any inquiry (required when deleting a user)
CREATE POLICY "Admins can delete any inquiry" ON public.inquiries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
