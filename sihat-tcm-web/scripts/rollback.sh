#!/bin/bash

# Sihat TCM Rollback Script
# Usage: ./scripts/rollback.sh [staging|production] [commit_sha]

set -e

ENVIRONMENT=${1:-production}
TARGET_COMMIT=${2}
PROJECT_ROOT=$(dirname "$(dirname "$(realpath "$0")")")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Validate inputs
validate_inputs() {
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        error "Invalid environment. Use 'staging' or 'production'"
        exit 1
    fi
    
    if [ -z "$TARGET_COMMIT" ]; then
        error "Target commit SHA is required"
        echo "Usage: $0 [staging|production] [commit_sha]"
        echo "Example: $0 production abc123def456"
        exit 1
    fi
    
    # Validate commit exists
    if ! git rev-parse --verify "$TARGET_COMMIT" >/dev/null 2>&1; then
        error "Commit $TARGET_COMMIT does not exist"
        exit 1
    fi
}

# Confirm rollback
confirm_rollback() {
    local current_commit=$(git rev-parse HEAD)
    local target_info=$(git log --oneline -1 "$TARGET_COMMIT")
    local current_info=$(git log --oneline -1 "$current_commit")
    
    warning "=== ROLLBACK CONFIRMATION ==="
    echo "Environment: $ENVIRONMENT"
    echo "Current commit: $current_info"
    echo "Target commit:  $target_info"
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        warning "⚠️  THIS IS A PRODUCTION ROLLBACK ⚠️"
        echo "This action will:"
        echo "1. Create a backup of current state"
        echo "2. Rollback code to commit $TARGET_COMMIT"
        echo "3. Rebuild and redeploy the application"
        echo "4. Run health checks"
        echo ""
    fi
    
    read -p "Are you sure you want to proceed? (type 'ROLLBACK' to confirm): " confirmation
    
    if [ "$confirmation" != "ROLLBACK" ]; then
        log "Rollback cancelled by user"
        exit 0
    fi
}

# Create emergency backup
create_emergency_backup() {
    log "Creating emergency backup before rollback..."
    
    local backup_dir="$PROJECT_ROOT/emergency_backups"
    mkdir -p "$backup_dir"
    
    # Code backup
    local current_commit=$(git rev-parse HEAD)
    git archive --format=tar.gz --output="$backup_dir/emergency_backup_${current_commit}_$TIMESTAMP.tar.gz" HEAD
    
    # Database backup (if possible)
    if command -v supabase >/dev/null 2>&1; then
        log "Creating database backup..."
        supabase db dump --file "$backup_dir/emergency_db_backup_$TIMESTAMP.sql" || warning "Database backup failed"
    fi
    
    success "Emergency backup created in $backup_dir"
}

# Perform rollback
perform_rollback() {
    log "Performing rollback to commit $TARGET_COMMIT..."
    
    cd "$PROJECT_ROOT"
    
    # Stash any uncommitted changes
    if ! git diff --quiet; then
        log "Stashing uncommitted changes..."
        git stash push -m "Emergency stash before rollback $TIMESTAMP"
    fi
    
    # Create rollback branch
    local rollback_branch="rollback-$ENVIRONMENT-$TIMESTAMP"
    git checkout -b "$rollback_branch" "$TARGET_COMMIT"
    
    success "Checked out rollback branch: $rollback_branch"
}

# Update environment configuration
update_environment() {
    log "Updating environment configuration..."
    
    # Load appropriate environment file
    if [ "$ENVIRONMENT" = "production" ]; then
        ENV_FILE=".env.production"
    else
        ENV_FILE=".env.staging"
    fi
    
    if [ -f "$PROJECT_ROOT/$ENV_FILE" ]; then
        source "$PROJECT_ROOT/$ENV_FILE"
        success "Environment configuration loaded"
    else
        warning "Environment file $ENV_FILE not found"
    fi
}

# Rebuild application
rebuild_application() {
    log "Rebuilding application..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous build
    rm -rf .next node_modules/.cache
    
    # Install dependencies (use npm ci for faster, reliable installs)
    log "Installing dependencies..."
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
    else
        npm ci
    fi
    
    # Build application
    log "Building application..."
    if [ "$ENVIRONMENT" = "production" ]; then
        NODE_ENV=production pnpm run build
    else
        NODE_ENV=staging pnpm run build
    fi
    
    success "Application rebuilt successfully"
}

# Deploy rollback
deploy_rollback() {
    log "Deploying rollback to $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    if command -v vercel >/dev/null 2>&1; then
        if [ "$ENVIRONMENT" = "production" ]; then
            vercel --prod --yes --force
        else
            vercel --yes --force
        fi
        
        success "Rollback deployed"
    else
        error "Vercel CLI not found. Manual deployment required."
        exit 1
    fi
}

# Verify rollback
verify_rollback() {
    log "Verifying rollback deployment..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        URL="https://sihat-tcm.com"
    else
        URL="https://staging.sihat-tcm.com"
    fi
    
    # Wait for deployment
    sleep 60
    
    # Health check
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        if curl -f "$URL/api/health" >/dev/null 2>&1; then
            success "Health check passed"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Health check failed after $max_attempts attempts"
            return 1
        fi
        
        sleep 30
        ((attempt++))
    done
    
    # Verify main page
    if curl -f "$URL" | grep -q "Sihat TCM" >/dev/null 2>&1; then
        success "Main page verification passed"
    else
        error "Main page verification failed"
        return 1
    fi
    
    # Check current deployment commit
    local deployed_commit=$(curl -s "$URL/api/health" | grep -o '"commit":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    log "Deployed commit: $deployed_commit"
    
    success "Rollback verification completed"
}

# Send notifications
send_notifications() {
    local status="$1"
    local message="$2"
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="danger"
        if [ "$status" = "success" ]; then
            color="warning"  # Rollbacks are always concerning, even if successful
        fi
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"🔄 ROLLBACK EXECUTED - $ENVIRONMENT\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"Target Commit\",
                        \"value\": \"$TARGET_COMMIT\",
                        \"short\": true
                    }, {
                        \"title\": \"Status\",
                        \"value\": \"$status\",
                        \"short\": true
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }]
                }]
            }" > /dev/null 2>&1
    fi
    
    # Email notification (if configured)
    if [ -n "$ALERT_EMAIL" ]; then
        echo "Rollback executed on $ENVIRONMENT to commit $TARGET_COMMIT. Status: $status. $message" | \
        mail -s "URGENT: Rollback Executed - Sihat TCM $ENVIRONMENT" "$ALERT_EMAIL" || true
    fi
}

# Cleanup rollback artifacts
cleanup() {
    log "Cleaning up rollback artifacts..."
    
    # Remove old emergency backups (keep last 5)
    local backup_dir="$PROJECT_ROOT/emergency_backups"
    if [ -d "$backup_dir" ]; then
        find "$backup_dir" -name "emergency_backup_*.tar.gz" -type f | sort -r | tail -n +6 | xargs rm -f || true
        find "$backup_dir" -name "emergency_db_backup_*.sql" -type f | sort -r | tail -n +6 | xargs rm -f || true
    fi
    
    success "Cleanup completed"
}

# Main rollback process
main() {
    log "=== SIHAT TCM ROLLBACK INITIATED ==="
    log "Environment: $ENVIRONMENT"
    log "Target Commit: $TARGET_COMMIT"
    log "Timestamp: $TIMESTAMP"
    
    validate_inputs
    confirm_rollback
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    local rollback_status="success"
    local error_message=""
    
    # Execute rollback steps
    if ! create_emergency_backup; then
        rollback_status="failed"
        error_message="Failed to create emergency backup"
    elif ! perform_rollback; then
        rollback_status="failed"
        error_message="Failed to perform code rollback"
    elif ! update_environment; then
        rollback_status="failed"
        error_message="Failed to update environment"
    elif ! rebuild_application; then
        rollback_status="failed"
        error_message="Failed to rebuild application"
    elif ! deploy_rollback; then
        rollback_status="failed"
        error_message="Failed to deploy rollback"
    elif ! verify_rollback; then
        rollback_status="failed"
        error_message="Rollback deployment verification failed"
    fi
    
    # Send notifications
    if [ "$rollback_status" = "success" ]; then
        success "=== ROLLBACK COMPLETED SUCCESSFULLY ==="
        send_notifications "success" "Rollback to commit $TARGET_COMMIT completed successfully. Please verify all functionality."
        
        warning "POST-ROLLBACK CHECKLIST:"
        echo "1. Verify all critical user flows are working"
        echo "2. Check error logs for any issues"
        echo "3. Monitor system performance"
        echo "4. Communicate rollback to stakeholders"
        echo "5. Plan forward fix if needed"
        
    else
        error "=== ROLLBACK FAILED ==="
        error "$error_message"
        send_notifications "failed" "Rollback failed: $error_message. Manual intervention required."
        
        error "IMMEDIATE ACTIONS REQUIRED:"
        echo "1. Check system status immediately"
        echo "2. Consider manual deployment"
        echo "3. Escalate to senior team members"
        echo "4. Prepare incident response"
        
        exit 1
    fi
}

# Execute main function
main "$@"