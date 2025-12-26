-- Verification Query: Check if guest_diagnosis_sessions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'guest_diagnosis_sessions'
) as table_exists;

-- Also check the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'guest_diagnosis_sessions'
ORDER BY ordinal_position;

