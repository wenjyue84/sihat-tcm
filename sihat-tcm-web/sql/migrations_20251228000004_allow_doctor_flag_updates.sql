-- Migration: Allow doctors to update profile flags
-- Description: Adds RLS policy to allow doctors to update the 'flag' column in the profiles table

CREATE POLICY "Doctors can update profile flags" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('doctor', 'admin')
        )
    );
