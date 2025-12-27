# Seed Test Patient Data Script
# This script provides instructions for seeding comprehensive mock data for the Test Patient account

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sihat TCM - Test Patient Data Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "There are TWO ways to seed mock data for the Test Patient account:" -ForegroundColor Yellow
Write-Host ""

Write-Host "METHOD 1: Via Dashboard UI (Recommended)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "1. Log in as the Test Patient at http://localhost:3000/login"
Write-Host "2. Go to the Patient Dashboard (/patient)"
Write-Host "3. In the 'Health Journey' tab, click 'Restore Mock Data' button"
Write-Host "4. This will create 8 comprehensive diagnosis sessions"
Write-Host ""

Write-Host "METHOD 2: Via Supabase SQL Editor" -ForegroundColor Blue
Write-Host "===================================" -ForegroundColor Blue
Write-Host "1. Open your Supabase project dashboard"
Write-Host "2. Go to 'SQL Editor'"
Write-Host "3. Copy and paste the contents of:"
Write-Host "   supabase/seed_test_patient.sql"
Write-Host "4. Execute the SQL"
Write-Host ""

Write-Host "MOCK DATA INCLUDES:" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta
Write-Host "- 8 diagnosis sessions spanning 12 weeks"
Write-Host "- Various TCM patterns:"
Write-Host "  * Yin Deficiency with Empty Heat (2 days ago)"
Write-Host "  * Liver Qi Stagnation (1 week ago)"
Write-Host "  * Spleen Qi Deficiency (2 weeks ago)"
Write-Host "  * Damp Heat in Lower Jiao (3 weeks ago)"
Write-Host "  * Blood Deficiency (5 weeks ago)"
Write-Host "  * Kidney Yang Deficiency (7 weeks ago)"
Write-Host "  * Phlegm-Damp Obstruction (9 weeks ago)"
Write-Host "  * Wind-Cold Invasion (12 weeks ago)"
Write-Host ""
Write-Host "- Each session includes:"
Write-Host "  * Full diagnosis with primary/secondary patterns"
Write-Host "  * Affected organs and pathomechanism"
Write-Host "  * Key findings from inquiry, visual, and pulse analysis"
Write-Host "  * Food and lifestyle recommendations"
Write-Host "  * Herbal formula suggestions"
Write-Host "  * Acupoint recommendations"
Write-Host "  * Patient notes"
Write-Host ""

Write-Host "FEATURES TO TEST:" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host "1. Health Journey - View diagnosis history cards"
Write-Host "2. TrendWidget - See vitality score trends and averages"
Write-Host "3. History Detail - Click any card to view full report"
Write-Host "4. Personal Notes - Edit notes on any session"
Write-Host "5. AI Meal Planner - Generate meal plans based on latest diagnosis"
Write-Host "6. Delete Session - Test deletion functionality"
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
