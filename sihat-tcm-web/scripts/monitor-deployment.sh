#!/bin/bash

# Sihat TCM Deployment Monitoring Script
# Usage: ./scripts/monitor-deployment.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
TIMEOUT=300  # 5 minutes timeout
INTERVAL=10  # Check every 10 seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Set URL based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://sihat-tcm.com"
else
    BASE_URL="https://staging.sihat-tcm.com"
fi

log "Starting deployment monitoring for $ENVIRONMENT environment"
log "Base URL: $BASE_URL"
log "Timeout: ${TIMEOUT}s, Check interval: ${INTERVAL}s"

# Health check function
check_health() {
    local endpoint="$1"
    local expected_status="$2"
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Check if service is responding
check_service_availability() {
    log "Checking service availability..."
    
    start_time=$(date +%s)
    
    while true; do
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $TIMEOUT ]; then
            error "Timeout reached. Service not available after ${TIMEOUT}s"
            return 1
        fi
        
        if check_health "/api/health" "200"; then
            success "Service is responding (${elapsed}s)"
            return 0
        fi
        
        log "Service not ready yet... (${elapsed}s elapsed)"
        sleep $INTERVAL
    done
}

# Check critical endpoints
check_critical_endpoints() {
    log "Checking critical endpoints..."
    
    local endpoints=(
        "/api/health:200"
        "/:200"
        "/api/analyze-image:405"  # Should return 405 for GET request
        "/api/chat:405"           # Should return 405 for GET request
        "/api/consult:405"        # Should return 405 for GET request
    )
    
    for endpoint_check in "${endpoints[@]}"; do
        IFS=':' read -r endpoint expected_status <<< "$endpoint_check"
        
        if check_health "$endpoint" "$expected_status"; then
            success "✓ $endpoint (HTTP $expected_status)"
        else
            error "✗ $endpoint (Expected HTTP $expected_status)"
            return 1
        fi
    done
    
    success "All critical endpoints are healthy"
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    # Test database through health endpoint with detailed check
    response=$(curl -s "$BASE_URL/api/health" | grep -o '"database":"healthy"' || echo "")
    
    if [ -n "$response" ]; then
        success "Database connectivity confirmed"
    else
        error "Database connectivity issue detected"
        return 1
    fi
}

# Check AI services
check_ai_services() {
    log "Checking AI services..."
    
    # Test Gemini API connectivity (this might require authentication)
    response=$(curl -s -X POST "$BASE_URL/api/test-gemini" \
        -H "Content-Type: application/json" \
        -d '{"test": true}' || echo "")
    
    if echo "$response" | grep -q "success\|healthy"; then
        success "AI services are operational"
    else
        warning "AI services check inconclusive (may require authentication)"
    fi
}

# Performance check
check_performance() {
    log "Checking performance metrics..."
    
    # Measure response time for main page
    start_time=$(date +%s%3N)
    curl -s "$BASE_URL" > /dev/null
    end_time=$(date +%s%3N)
    
    response_time=$((end_time - start_time))
    
    if [ $response_time -lt 2000 ]; then
        success "Response time: ${response_time}ms (Good)"
    elif [ $response_time -lt 5000 ]; then
        warning "Response time: ${response_time}ms (Acceptable)"
    else
        error "Response time: ${response_time}ms (Poor)"
        return 1
    fi
}

# Check SSL certificate
check_ssl() {
    log "Checking SSL certificate..."
    
    if echo | openssl s_client -servername "${BASE_URL#https://}" -connect "${BASE_URL#https://}:443" 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
        expiry=$(echo | openssl s_client -servername "${BASE_URL#https://}" -connect "${BASE_URL#https://}:443" 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
        success "SSL certificate valid until: $expiry"
    else
        error "SSL certificate check failed"
        return 1
    fi
}

# Check security headers
check_security_headers() {
    log "Checking security headers..."
    
    headers=$(curl -s -I "$BASE_URL")
    
    local security_checks=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "Strict-Transport-Security"
    )
    
    for header in "${security_checks[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            success "✓ $header header present"
        else
            warning "✗ $header header missing"
        fi
    done
}

# Generate monitoring report
generate_report() {
    log "Generating monitoring report..."
    
    local report_file="deployment_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Sihat TCM Deployment Monitoring Report
=====================================

Environment: $ENVIRONMENT
URL: $BASE_URL
Timestamp: $(date)
Monitoring Duration: ${TIMEOUT}s

Service Status: $(check_health "/api/health" "200" && echo "HEALTHY" || echo "UNHEALTHY")
Database Status: $(curl -s "$BASE_URL/api/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
Response Time: $(date +%s%3N; curl -s "$BASE_URL" > /dev/null; date +%s%3N) | awk '{print $2-$1"ms"}'

Critical Endpoints:
- Health Check: $(check_health "/api/health" "200" && echo "✓" || echo "✗")
- Main Page: $(check_health "/" "200" && echo "✓" || echo "✗")
- API Endpoints: $(check_health "/api/analyze-image" "405" && echo "✓" || echo "✗")

Security:
- SSL Certificate: $(echo | openssl s_client -servername "${BASE_URL#https://}" -connect "${BASE_URL#https://}:443" 2>/dev/null | openssl x509 -noout -dates >/dev/null 2>&1 && echo "Valid" || echo "Invalid")
- Security Headers: $(curl -s -I "$BASE_URL" | grep -qi "X-Frame-Options" && echo "Present" || echo "Missing")

Recommendations:
- Monitor response times over the next 24 hours
- Verify all user flows are working correctly
- Check error logs for any issues
- Monitor database performance metrics

EOF

    success "Report generated: $report_file"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"Deployment Monitoring - $ENVIRONMENT\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "success" ] && echo "good" || echo "danger")\",
                    \"fields\": [{
                        \"title\": \"Status\",
                        \"value\": \"$status\",
                        \"short\": true
                    }, {
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"URL\",
                        \"value\": \"$BASE_URL\",
                        \"short\": false
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }]
                }]
            }" > /dev/null 2>&1
    fi
}

# Main monitoring function
main() {
    log "=== Deployment Monitoring Started ==="
    
    local overall_status="success"
    local issues=()
    
    # Run all checks
    if ! check_service_availability; then
        overall_status="failed"
        issues+=("Service not available")
    fi
    
    if ! check_critical_endpoints; then
        overall_status="failed"
        issues+=("Critical endpoint failures")
    fi
    
    if ! check_database; then
        overall_status="failed"
        issues+=("Database connectivity issues")
    fi
    
    check_ai_services  # Non-critical
    
    if ! check_performance; then
        overall_status="warning"
        issues+=("Performance issues")
    fi
    
    if ! check_ssl; then
        overall_status="warning"
        issues+=("SSL certificate issues")
    fi
    
    check_security_headers  # Non-critical
    
    # Generate report
    generate_report
    
    # Send notification
    if [ "$overall_status" = "success" ]; then
        success "=== All monitoring checks passed ==="
        send_notification "success" "Deployment monitoring completed successfully. All systems operational."
    elif [ "$overall_status" = "warning" ]; then
        warning "=== Monitoring completed with warnings ==="
        send_notification "warning" "Deployment monitoring completed with warnings: ${issues[*]}"
    else
        error "=== Monitoring detected critical issues ==="
        send_notification "failed" "Deployment monitoring failed: ${issues[*]}"
        exit 1
    fi
}

# Run main function
main "$@"