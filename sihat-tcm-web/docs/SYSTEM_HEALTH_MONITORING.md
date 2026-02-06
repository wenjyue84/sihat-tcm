# System Health Monitoring Guide

This document describes the enhanced error logging and monitoring system implemented for Sihat TCM.

## Overview

The system health monitoring feature provides comprehensive error tracking, performance monitoring, and system health insights for administrators. It includes:

- **Automated Error Logging**: Captures JavaScript errors, network failures, and application exceptions
- **Admin Dashboard**: Real-time monitoring interface for system health and error analysis
- **Error Categorization**: Automatic severity classification and component tracking
- **Performance Metrics**: System performance and response time monitoring
- **Alert System**: Notifications for critical errors and system issues

## Features

### 1. Error Logging System

#### Automatic Error Capture

- Unhandled JavaScript errors
- Promise rejections
- Network request failures
- React component errors (via Error Boundary)

#### Manual Error Logging

```typescript
import { logError, logUserActionError, logNetworkError } from "@/lib/errorLogger";

// Log a general error
await logError(new Error("Something went wrong"), {
  component: "UserProfile",
  action: "UPDATE_PROFILE",
  severity: "medium",
});

// Log user action error
await logUserActionError("SUBMIT_FORM", error, {
  component: "ContactForm",
  metadata: { formData: sanitizedData },
});

// Log network error
await logNetworkError("/api/users", error, {
  severity: "high",
});
```

### 2. Admin Dashboard

Access the system health dashboard at `/admin/system-health` (admin access required).

#### Dashboard Sections

**Overview Metrics**

- Total errors in last 24 hours
- Critical error count
- Database response time
- Memory usage

**Error Monitoring**

- Error breakdown by severity
- Recent errors list with details
- Error resolution tracking
- Component-wise error analysis

**System Health**

- Database health status
- API service status
- Memory usage monitoring
- Alert status

**Performance Metrics**

- Page load times
- User interaction performance
- Diagnosis completion metrics

### 3. Error Severity Levels

| Severity     | Description                      | Examples                                                           |
| ------------ | -------------------------------- | ------------------------------------------------------------------ |
| **Critical** | System-breaking errors           | Authentication failures, database connection errors, syntax errors |
| **High**     | Significant functionality issues | Type errors, permission denied, undefined function calls           |
| **Medium**   | Moderate issues                  | Validation errors, timeouts, invalid inputs                        |
| **Low**      | Minor issues                     | UI glitches, non-critical warnings                                 |

### 4. Error Boundary Integration

Wrap components with error boundaries to automatically capture and log React errors:

```tsx
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === "development"}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## Setup Instructions

### 1. Database Migration

Run the database migration to create the system_errors table:

```bash
# Using Supabase CLI
supabase db push

# Or run the migration file directly
psql -d your_database -f supabase/migrations/20251227000004_system_errors_table.sql
```

### 2. Initialize Error Logger

Add error logger initialization to your app:

```typescript
// In your main app file or layout
import { initializeErrorLogger } from "@/lib/errorLogger";

// Initialize with default settings
initializeErrorLogger();

// Or with custom configuration
initializeErrorLogger({
  enableConsoleLog: process.env.NODE_ENV === "development",
  enableAutoCapture: true,
  maxRetries: 3,
});
```

### 3. Environment Variables

Add these optional environment variables for enhanced monitoring:

```env
# Enable performance monitoring
ENABLE_PERFORMANCE_MONITORING=true

# Alert configurations (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
ALERT_EMAIL=admin@yourcompany.com

# External monitoring services (optional)
DATADOG_API_KEY=your_datadog_key
NEW_RELIC_LICENSE_KEY=your_newrelic_key
MONITORING_WEBHOOK=your_custom_webhook_url
```

## API Endpoints

### GET /api/admin/system-health

Retrieve comprehensive system health dashboard data.

**Response:**

```json
{
  "timestamp": "2024-12-27T10:00:00Z",
  "overall_status": "healthy",
  "error_statistics": {
    "total_errors": 5,
    "critical_errors": 0,
    "high_errors": 1,
    "medium_errors": 3,
    "low_errors": 1,
    "resolved_errors": 2,
    "unresolved_errors": 3
  },
  "health_metrics": {
    "database": {
      "status": "healthy",
      "response_time": 45
    },
    "memory": {
      "usage_percentage": 68,
      "used_mb": 512,
      "total_mb": 1024
    }
  },
  "recent_errors": [...],
  "system_info": {...}
}
```

### POST /api/admin/system-health

Log a new system error.

**Request:**

```json
{
  "error_type": "ValidationError",
  "message": "Invalid email format",
  "component": "UserRegistration",
  "severity": "medium",
  "metadata": {
    "field": "email",
    "value": "invalid-email"
  }
}
```

## Database Schema

### system_errors Table

| Column      | Type         | Description                           |
| ----------- | ------------ | ------------------------------------- |
| id          | UUID         | Primary key                           |
| timestamp   | TIMESTAMPTZ  | When the error occurred               |
| error_type  | VARCHAR(100) | Type of error (e.g., ValidationError) |
| message     | TEXT         | Error message                         |
| stack_trace | TEXT         | Stack trace (optional)                |
| component   | VARCHAR(200) | Component where error occurred        |
| user_id     | UUID         | User who encountered the error        |
| session_id  | VARCHAR(255) | Session identifier                    |
| url         | TEXT         | URL where error occurred              |
| user_agent  | TEXT         | Browser user agent                    |
| severity    | VARCHAR(20)  | Error severity level                  |
| resolved    | BOOLEAN      | Whether error has been resolved       |
| resolved_at | TIMESTAMPTZ  | When error was resolved               |
| resolved_by | UUID         | Admin who resolved the error          |
| metadata    | JSONB        | Additional error context              |

## Best Practices

### 1. Error Logging

- Use appropriate severity levels
- Include relevant context in metadata
- Avoid logging sensitive information
- Use descriptive error messages

### 2. Performance

- Error logging is asynchronous and won't block user interactions
- Failed error logs are retried automatically
- Old error logs are automatically cleaned up (30-day retention)

### 3. Security

- Admin-only access to monitoring dashboard
- Row-level security on error data
- No sensitive data in error logs
- Secure API endpoints with authentication

### 4. Monitoring

- Check the dashboard regularly for system health
- Set up alerts for critical errors
- Monitor error trends and patterns
- Resolve errors promptly to maintain system health

## Troubleshooting

### Common Issues

**Dashboard not loading**

- Verify admin access permissions
- Check database connectivity
- Ensure migration has been run

**Errors not being logged**

- Verify error logger initialization
- Check network connectivity to API
- Review browser console for client-side errors

**High memory usage**

- Monitor error log retention
- Check for memory leaks in application code
- Review system resource allocation

### Support

For technical support or questions about the monitoring system:

1. Check the error logs in the admin dashboard
2. Review the browser console for client-side issues
3. Contact the development team with specific error IDs

## Future Enhancements

Planned improvements for the monitoring system:

- Real-time error notifications
- Advanced analytics and reporting
- Integration with external monitoring services
- Automated error resolution suggestions
- Performance optimization recommendations
