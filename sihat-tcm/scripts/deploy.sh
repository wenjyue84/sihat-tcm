#!/bin/bash

# Enhanced Sihat TCM Deployment Script
# Usage: ./scripts/deploy.sh [staging|production] [--rollback commit_sha] [--skip-tests]

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_ROOT=$(dirname "$(dirname "$(realpath "$0")")")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_ROOT/backups"
DEPLOYMENT_ID="deploy_${ENVIRONMENT}_${TIMESTAMP}"

# Parse additional arguments
ROLLBACK_COMMIT=""
SKIP_TESTS=false

while [[ $# -gt 1 ]]; do
    case $2 in
        --rollback)
            ROLLBACK_COMMIT="$3"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Deployment tracking functions
track_deployment_start() {
    log "Tracking deployment start..."
    
    local deployment_type="deployment"
    local commit_sha="$GITHUB_SHA"
    
    if [ -n "$ROLLBACK_COMMIT" ]; then
        deployment_type="rollback"
        commit_sha="$ROLLBACK_COMMIT"
    fi
    
    # Record deployment start
    curl -X POST "${BASE_URL}/api/deployment/status" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -d "{
            \"environment\": \"$ENVIRONMENT\",
            \"version\": \"$(cat package.json | grep version | cut -d'\"' -f4)\",
            \"commit\": \"$commit_sha\",
            \"status\": \"in_progress\",
            \"type\": \"$deployment_type\",
            \"metadata\": {
                \"deployment_id\": \"$DEPLOYMENT_ID\",
                \"started_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"skip_tests\": $SKIP_TESTS
            }
        }" || warning "Failed to track deployment start"
}

track_deployment_end() {
    local status="$1"
    local duration="$2"
    
    log "Tracking deployment end: $status"
    
    local deployment_type="deployment"
    local commit_sha="$GITHUB_SHA"
    
    if [ -n "$ROLLBACK_COMMIT" ]; then
        deployment_type="rollback"
        commit_sha="$ROLLBACK_COMMIT"
    fi
    
    # Record deployment end
    curl -X POST "${BASE_URL}/api/deployment/status" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -d "{
            \"environment\": \"$ENVIRONMENT\",
            \"version\": \"$(cat package.json | grep version | cut -d'\"' -f4)\",
            \"commit\": \"$commit_sha\",
            \"status\": \"$status\",
            \"type\": \"$deployment_type\",
            \"metadata\": {
                \"deployment_id\": \"$DEPLOYMENT_ID\",
                \"duration\": $duration,
                \"completed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }
        }" || warning "Failed to track deployment end"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Set environment-specific variables
if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://sihat-tcm.com"
    SERVICE_KEY="$PROD_SUPABASE_SERVICE_KEY"
else
    BASE_URL="https://staging.sihat-tcm.com"
    SERVICE_KEY="$STAGING_SUPABASE_SERVICE_KEY"
fi

log "Starting enhanced deployment to $ENVIRONMENT environment"
if [ -n "$ROLLBACK_COMMIT" ]; then
    log "Rollback mode: targeting commit $ROLLBACK_COMMIT"
fi

DEPLOYMENT_START_TIME=$(date +%s%3N)

# Track deployment start
track_deployment_start

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || { error "Node.js is required but not installed."; exit 1; }
    command -v pnpm >/dev/null 2>&1 || { error "pnpm is required but not installed."; exit 1; }
    command -v git >/dev/null 2>&1 || { error "Git is required but not installed."; exit 1; }
    command -v curl >/dev/null 2>&1 || { error "curl is required but not installed."; exit 1; }
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run from project root."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log "Loading environment variables for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        ENV_FILE=".env.production"
    else
        ENV_FILE=".env.staging"
    fi
    
    if [ -f "$PROJECT_ROOT/$ENV_FILE" ]; then
        source "$PROJECT_ROOT/$ENV_FILE"
        success "Environment variables loaded from $ENV_FILE"
    else
        warning "Environment file $ENV_FILE not found. Using default .env.local"
        if [ -f "$PROJECT_ROOT/.env.local" ]; then
            source "$PROJECT_ROOT/.env.local"
        fi
    fi
}

# Check deployment window for production
check_deployment_window() {
    if [ "$ENVIRONMENT" = "production" ] && [ -z "$ROLLBACK_COMMIT" ]; then
        log "Checking deployment window for production..."
        
        current_hour=$(date -u +%H)
        current_day=$(date -u +%u)  # 1=Monday, 7=Sunday
        
        # Allow deployments Monday-Friday, 9 AM - 5 PM UTC (adjust as needed)
        if [ $current_day -ge 1 ] && [ $current_day -le 5 ] && [ $current_hour -ge 9 ] && [ $current_hour -le 17 ]; then
            success "Deployment within allowed window"
        else
            warning "Production deployment outside business hours"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Deployment cancelled by user"
                exit 0
            fi
        fi
    fi
}

# Validate rollback target
validate_rollback() {
    if [ -n "$ROLLBACK_COMMIT" ]; then
        log "Validating rollback target: $ROLLBACK_COMMIT"
        
        # Check if commit exists
        if ! git rev-parse --verify "$ROLLBACK_COMMIT" >/dev/null 2>&1; then
            error "Rollback commit $ROLLBACK_COMMIT does not exist"
            exit 1
        fi
        
        # Check if commit is not too old (30 days)
        COMMIT_DATE=$(git show -s --format=%ct "$ROLLBACK_COMMIT")
        CURRENT_DATE=$(date +%s)
        DAYS_OLD=$(( (CURRENT_DATE - COMMIT_DATE) / 86400 ))
        
        if [ $DAYS_OLD -gt 30 ]; then
            warning "Rolling back to a commit that is $DAYS_OLD days old"
            read -p "Continue with rollback? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Rollback cancelled by user"
                exit 0
            fi
        fi
        
        success "Rollback target validation passed"
    fi
}

# Create backup
create_backup() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Creating backup before production deployment..."
        
        mkdir -p "$BACKUP_DIR"
        
        # Database backup
        log "Creating database backup..."
        curl -X POST "$BASE_URL/api/deployment/backup" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $SERVICE_KEY" \
            -d "{\"backup_name\": \"pre_deploy_${DEPLOYMENT_ID}\"}" || warning "Database backup failed"
        
        # Code backup
        log "Creating code backup..."
        git archive --format=tar.gz --output="$BACKUP_DIR/code_backup_$TIMESTAMP.tar.gz" HEAD
        
        success "Backup created in $BACKUP_DIR"
    fi
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        warning "Skipping tests as requested"
        return 0
    fi
    
    log "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Type checking
    log "Running TypeScript type check..."
    pnpm run type-check || { error "Type check failed"; exit 1; }
    
    # Linting
    log "Running ESLint..."
    pnpm run lint || { error "Linting failed"; exit 1; }
    
    # Unit tests
    log "Running unit tests..."
    pnpm run test:run || { error "Unit tests failed"; exit 1; }
    
    # Property-based tests
    log "Running property-based tests..."
    pnpm run test:pbt || { error "Property-based tests failed"; exit 1; }
    
    success "All tests passed"
}

# Build application
build_application() {
    log "Building application for $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    # Checkout rollback commit if specified
    if [ -n "$ROLLBACK_COMMIT" ]; then
        log "Checking out rollback commit: $ROLLBACK_COMMIT"
        git checkout "$ROLLBACK_COMMIT"
    fi
    
    # Clean previous build
    rm -rf .next
    
    # Install dependencies
    log "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Build
    log "Building Next.js application..."
    if [ "$ENVIRONMENT" = "production" ]; then
        NODE_ENV=production pnpm run build
    else
        NODE_ENV=staging pnpm run build
    fi
    
    success "Application built successfully"
}

# Database migrations
run_migrations() {
    log "Running database migrations..."
    
    if command -v supabase >/dev/null 2>&1; then
        cd "$PROJECT_ROOT"
        
        # Apply migrations
        if [ "$ENVIRONMENT" = "production" ]; then
            log "Applying production migrations..."
            supabase db push --linked --project-ref "$PROD_PROJECT_REF"
        else
            log "Applying staging migrations..."
            supabase db push --linked --project-ref "$STAGING_PROJECT_REF"
        fi
        
        success "Database migrations completed"
    else
        warning "Supabase CLI not found. Skipping migrations."
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel ($ENVIRONMENT)..."
    
    cd "$PROJECT_ROOT"
    
    if command -v vercel >/dev/null 2>&1; then
        if [ "$ENVIRONMENT" = "production" ]; then
            vercel --prod --yes --token "$VERCEL_TOKEN"
        else
            vercel --yes --token "$VERCEL_TOKEN"
        fi
        
        success "Deployed to Vercel"
    else
        error "Vercel CLI not found. Please install and configure Vercel CLI."
        exit 1
    fi
}

# Comprehensive health check
comprehensive_health_check() {
    log "Performing comprehensive health check..."
    
    # Wait for deployment to be ready
    log "Waiting for deployment to propagate..."
    if [ "$ENVIRONMENT" = "production" ]; then
        sleep 120  # Wait longer for production
    else
        sleep 60
    fi
    
    local max_retries=10
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        retry_count=$((retry_count + 1))
        log "Health check attempt $retry_count/$max_retries..."
        
        # Basic health check
        if curl -f --max-time 30 "$BASE_URL/api/monitoring/health" >/dev/null 2>&1; then
            success "Basic health check passed"
            break
        else
            warning "Health check failed on attempt $retry_count"
            if [ $retry_count -eq $max_retries ]; then
                error "Health check failed after $max_retries attempts"
                return 1
            fi
            sleep 30
        fi
    done
    
    # Extended validation
    log "Running extended validation..."
    
    # Test main page
    if curl -f --max-time 30 "$BASE_URL/" | grep -q "Sihat TCM" >/dev/null 2>&1; then
        success "Main page validation passed"
    else
        error "Main page validation failed"
        return 1
    fi
    
    # Test critical API endpoints
    local endpoints=("/api/monitoring/health" "/api/monitoring/metrics")
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f --max-time 30 "$BASE_URL$endpoint" >/dev/null 2>&1; then
            success "Endpoint $endpoint validation passed"
        else
            error "Endpoint $endpoint validation failed"
            return 1
        fi
    done
    
    # Performance test
    log "Running performance test..."
    local start_time=$(date +%s%3N)
    curl -s --max-time 10 "$BASE_URL/" >/dev/null
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    log "Response time: ${response_time}ms"
    
    if [ $response_time -gt 5000 ]; then
        warning "Response time exceeds 5 seconds"
    else
        success "Response time acceptable"
    fi
    
    success "Comprehensive health check completed"
}

# Start monitoring
start_monitoring() {
    log "Starting post-deployment monitoring..."
    
    # Start monitoring script in background
    if [ -f "$PROJECT_ROOT/scripts/monitor-deployment.sh" ]; then
        chmod +x "$PROJECT_ROOT/scripts/monitor-deployment.sh"
        nohup "$PROJECT_ROOT/scripts/monitor-deployment.sh" "$ENVIRONMENT" > "monitoring_${DEPLOYMENT_ID}.log" 2>&1 &
        echo $! > "monitoring_${DEPLOYMENT_ID}.pid"
        success "Monitoring started (PID: $(cat monitoring_${DEPLOYMENT_ID}.pid))"
    else
        warning "Monitoring script not found"
    fi
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    
    # Remove old backups (keep last 10)
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.tar.gz" -type f | sort -r | tail -n +11 | xargs rm -f
        find "$BACKUP_DIR" -name "*.sql" -type f | sort -r | tail -n +11 | xargs rm -f
    fi
    
    # Clean up old monitoring files
    find . -name "monitoring_*.log" -mtime +7 -delete 2>/dev/null || true
    find . -name "monitoring_*.pid" -mtime +7 -delete 2>/dev/null || true
    
    success "Cleanup completed"
}

# Rollback function
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    local deployment_end_time=$(date +%s%3N)
    local deployment_duration=$((deployment_end_time - DEPLOYMENT_START_TIME))
    
    # Track failed deployment
    track_deployment_end "failure" "$deployment_duration"
    
    if [ "$ENVIRONMENT" = "production" ] && [ -d "$BACKUP_DIR" ]; then
        LATEST_BACKUP=$(find "$BACKUP_DIR" -name "code_backup_*.tar.gz" | sort -r | head -n 1)
        if [ -n "$LATEST_BACKUP" ]; then
            log "Rolling back to: $LATEST_BACKUP"
            warning "Automatic rollback not fully implemented. Please use manual rollback script."
        fi
    fi
    
    # Send failure notification
    send_notification "failure" "Deployment failed and rollback initiated"
}

# Send notifications
send_notification() {
    local status="$1"
    local message="$2"
    
    log "Sending deployment notification: $status"
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        local emoji="✅"
        
        if [ "$status" = "failure" ]; then
            color="danger"
            emoji="❌"
        elif [ "$status" = "warning" ]; then
            color="warning"
            emoji="⚠️"
        fi
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"$emoji Deployment $status - $ENVIRONMENT\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"Status\",
                        \"value\": \"$status\",
                        \"short\": true
                    }, {
                        \"title\": \"Deployment ID\",
                        \"value\": \"$DEPLOYMENT_ID\",
                        \"short\": true
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }]
                }]
            }" >/dev/null 2>&1 || warning "Slack notification failed"
    fi
}

# Main deployment process
main() {
    log "=== Enhanced Sihat TCM Deployment Started ==="
    log "Environment: $ENVIRONMENT"
    log "Deployment ID: $DEPLOYMENT_ID"
    log "Timestamp: $TIMESTAMP"
    log "Project Root: $PROJECT_ROOT"
    
    if [ -n "$ROLLBACK_COMMIT" ]; then
        log "Rollback Mode: $ROLLBACK_COMMIT"
    fi
    
    # Set trap for cleanup on exit
    trap cleanup EXIT
    trap rollback ERR
    
    check_prerequisites
    load_environment
    check_deployment_window
    validate_rollback
    create_backup
    run_tests
    build_application
    run_migrations
    deploy_to_vercel
    comprehensive_health_check
    start_monitoring
    
    local deployment_end_time=$(date +%s%3N)
    local deployment_duration=$((deployment_end_time - DEPLOYMENT_START_TIME))
    
    # Track successful deployment
    track_deployment_end "success" "$deployment_duration"
    
    success "=== Deployment to $ENVIRONMENT completed successfully ==="
    success "Deployment Duration: ${deployment_duration}ms"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Production URL: https://sihat-tcm.com"
    else
        log "Staging URL: https://staging.sihat-tcm.com"
    fi
    
    # Send success notification
    send_notification "success" "Deployment completed successfully in ${deployment_duration}ms"
    
    log "Deployment ID: $DEPLOYMENT_ID"
    log "Monitor logs: monitoring_${DEPLOYMENT_ID}.log"
}

# Run main function
main "$@"