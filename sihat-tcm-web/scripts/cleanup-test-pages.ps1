# Script to move test pages to (dev) route group
# Run this from the sihat-tcm-web directory

$testDirs = @(
    "test-accessibility",
    "test-basic-info",
    "test-button-toggle",
    "test-camera",
    "test-chat",
    "test-contrast",
    "test-gemini",
    "test-glass-card",
    "test-image",
    "test-inquiry",
    "test-landing",
    "test-mobile-layout",
    "test-models",
    "test-pdf",
    "test-prompts",
    "test-pulse",
    "test-report",
    "test-report-chat",
    "test-synthesis",
    "test-welcome-sheet"
)

$sourceDir = "src\app"
$targetDir = "src\app\(dev)"

# Create (dev) directory if it doesn't exist
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "Created $targetDir" -ForegroundColor Green
}

foreach ($dir in $testDirs) {
    $sourcePath = Join-Path $sourceDir $dir
    $targetPath = Join-Path $targetDir $dir
    
    if (Test-Path $sourcePath) {
        if (Test-Path $targetPath) {
            Write-Host "⚠️  $dir already exists in (dev), skipping..." -ForegroundColor Yellow
        } else {
            Move-Item -Path $sourcePath -Destination $targetPath -Force
            Write-Host "✅ Moved $dir to (dev)" -ForegroundColor Green
        }
    } else {
        Write-Host "ℹ️  $dir not found, skipping..." -ForegroundColor Gray
    }
}

Write-Host "`n✅ Test pages cleanup complete!" -ForegroundColor Green

