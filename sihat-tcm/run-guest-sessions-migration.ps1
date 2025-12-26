# Guest Diagnosis Sessions Migration Runner
# This script runs the guest_diagnosis_sessions migration using Supabase CLI

Write-Host "🏥 Sihat TCM - Running Guest Diagnosis Sessions Migration" -ForegroundColor Cyan
Write-Host ""

# Get Supabase Project details
$ProjectRef = Read-Host "Enter your Supabase Project Reference (found in your project URL)"
$Password = Read-Host "Enter your Database Password" -AsSecureString
$PasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))

Write-Host ""
Write-Host "📊 Executing migration..." -ForegroundColor Yellow

# Run the migration
$MigrationFile = "supabase/migrations/20250102000001_add_diagnosis_input_data.sql"

# Build connection string
$ConnectionString = "postgresql://postgres:${PasswordPlain}@db.${ProjectRef}.supabase.co:5432/postgres"

# Execute using Supabase CLI
Write-Host "Running migration: $MigrationFile" -ForegroundColor Gray
npx supabase db execute --db-url $ConnectionString --file $MigrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "🎉 guest_diagnosis_sessions table created with RLS policies" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying table creation..." -ForegroundColor Yellow
    
    # Verify table exists
    $VerifyQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guest_diagnosis_sessions');"
    $VerifyFile = [System.IO.Path]::GetTempFileName()
    $VerifyQuery | Out-File -FilePath $VerifyFile -Encoding utf8
    
    npx supabase db execute --db-url $ConnectionString --file $VerifyFile
    
    Remove-Item $VerifyFile
    
    Write-Host ""
    Write-Host "✅ Setup complete! You can now use guest diagnosis sessions." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Please check the error above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Run the migration manually via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor Gray
    Write-Host "2. Select your project" -ForegroundColor Gray
    Write-Host "3. Go to SQL Editor" -ForegroundColor Gray
    Write-Host "4. Copy contents of: $MigrationFile" -ForegroundColor Gray
    Write-Host "5. Paste and run the SQL" -ForegroundColor Gray
}

# Clear password from memory
$PasswordPlain = $null

