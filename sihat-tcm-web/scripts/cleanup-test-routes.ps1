# Script to move test API routes to (dev) route group
# Run this from the sihat-tcm-web directory

$testRoutes = @(
    "test-gemini",
    "test-image"
)

$sourceDir = "src\app\api"
$targetDir = "src\app\api\(dev)"

# Create (dev) directory if it doesn't exist
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "Created $targetDir" -ForegroundColor Green
}

foreach ($route in $testRoutes) {
    $sourcePath = Join-Path $sourceDir $route
    $targetPath = Join-Path $targetDir $route
    
    if (Test-Path $sourcePath) {
        if (Test-Path $targetPath) {
            Write-Host "⚠️  $route already exists in (dev), skipping..." -ForegroundColor Yellow
        } else {
            Move-Item -Path $sourcePath -Destination $targetPath -Force
            Write-Host "✅ Moved $route to (dev)" -ForegroundColor Green
        }
    } else {
        Write-Host "ℹ️  $route not found, skipping..." -ForegroundColor Gray
    }
}

Write-Host "`n✅ Test routes cleanup complete!" -ForegroundColor Green

