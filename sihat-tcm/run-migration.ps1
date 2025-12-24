# Health Passport Migration Runner
# This script runs the diagnosis_sessions migration using Supabase CLI

Write-Host "🏥 Health Passport - Running Database Migration" -ForegroundColor Cyan
Write-Host ""

# Get Supabase Project details
$ProjectRef = Read-Host "Enter your Supabase Project Reference (found in your project URL)"
$Password = Read-Host "Enter your Database Password" -AsSecureString
$PasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))

Write-Host ""
Write-Host "📊 Executing migration..." -ForegroundColor Yellow

# Run the migration
$MigrationFile = "supabase/migrations/20251224_diagnosis_sessions.sql"

# Build connection string
$ConnectionString = "postgresql://postgres:${PasswordPlain}@db.${ProjectRef}.supabase.co:5432/postgres"

# Execute using psql via Supabase CLI
npx supabase db execute --db-url $ConnectionString --file $MigrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "🎉 diagnosis_sessions table created with RLS policies" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Please check the error above." -ForegroundColor Red
}

# Clear password from memory
$PasswordPlain = $null

