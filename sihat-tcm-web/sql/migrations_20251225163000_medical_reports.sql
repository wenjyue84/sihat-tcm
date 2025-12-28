-- Create medical_reports table
CREATE TABLE IF NOT EXISTS public.medical_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    size TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT,
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reports" 
    ON public.medical_reports FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" 
    ON public.medical_reports FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
    ON public.medical_reports FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
    ON public.medical_reports FOR DELETE 
    USING (auth.uid() = user_id);

-- Add update trigger for updated_at
-- (Assuming update_updated_at_column function already exists from previous migrations, 
-- but adding IF NOT EXISTS style check or just defining it if it's common practice here)

-- Create or replace the function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_reports_updated_at
    BEFORE UPDATE ON public.medical_reports
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create medical-reports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
-- Allow users to upload their own files
CREATE POLICY "Users can upload their own medical reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to view their own files
CREATE POLICY "Users can view their own medical reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own medical reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
