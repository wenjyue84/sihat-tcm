-- Add BMI column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bmi FLOAT;

-- Add a comment to the column
COMMENT ON COLUMN public.profiles.bmi IS 'Body Mass Index calculated from height and weight';
