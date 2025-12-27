# Sihat TCM API Documentation

**Version**: 4.0 (Enhanced)  
**Last Updated**: December 2024  
**Base URL**: `https://your-domain.com/api` or `http://localhost:3100/api`

## Enhanced Features (v4.0)

This version includes comprehensive enhancements for improved AI diagnostics, safety validation, personalization, and system monitoring:

- **Enhanced AI Diagnostic Engine**: Intelligent model routing with fallback mechanisms
- **Medical Safety Validator**: Comprehensive safety checking for all recommendations
- **Personalization Engine**: AI-powered personalized recommendations
- **Cross-Platform Synchronization**: Real-time sync between web and mobile
- **Advanced Health Tracking**: Time-series health data with trend analysis
- **IoT Device Integration**: Support for wearables and health devices
- **Accessibility Features**: WCAG 2.1 AA compliant interfaces
- **Voice Command Support**: Hands-free operation capabilities
- **Gamification System**: Qi Garden and achievement tracking
- **Community Features**: Constitution-based support groups

## Table of Contents

1. [Authentication](#authentication)
2. [Enhanced AI Diagnostic APIs](#enhanced-ai-diagnostic-apis)
3. [Core Diagnostic APIs](#core-diagnostic-apis)
4. [AI Analysis APIs](#ai-analysis-apis)
5. [Patient Management APIs](#patient-management-apis)
6. [Health Tracking APIs](#health-tracking-apis)
7. [IoT Integration APIs](#iot-integration-apis)
8. [Personalization APIs](#personalization-apis)
9. [Safety Validation APIs](#safety-validation-apis)
10. [Cross-Platform Sync APIs](#cross-platform-sync-apis)
11. [Gamification APIs](#gamification-apis)
12. [Community APIs](#community-apis)
13. [Admin APIs](#admin-apis)
14. [Notification APIs](#notification-apis)
15. [Monitoring APIs](#monitoring-apis)
16. [Utility APIs](#utility-apis)
17. [Error Handling](#error-handling)
18. [Rate Limiting](#rate-limiting)
19. [Data Models](#data-models)
20. [SDK Examples](#sdk-examples)

## Authentication

All API endpoints use Supabase authentication. Include the user's JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Authentication Levels

- **Public**: No authentication required
- **User**: Requires valid user authentication
- **Admin**: Requires admin role
- **Doctor**: Requires doctor/practitioner role

## Enhanced AI Diagnostic APIs

### POST /api/v2/enhanced-diagnosis

**Purpose**: Advanced diagnosis processing with AI model routing, personalization, and safety validation.

**Authentication**: User

**Request Body**:

```json
{
  "userId": "string",
  "doctorLevel": "physician|expert|master",
  "language": "en|zh|ms",
  "messages": [
    {
      "role": "user|assistant",
      "content": "string",
      "timestamp": "string"
    }
  ],
  "images": [
    {
      "type": "tongue|face|body",
      "data": "string (base64)",
      "metadata": "object"
    }
  ],
  "basicInfo": {
    "name": "string",
    "age": "number",
    "gender": "string",
    "height": "number",
    "weight": "number",
    "medicalHistory": "string"
  },
  "requiresPersonalization": "boolean",
  "requiresSafetyValidation": "boolean",
  "preferredModel": "string (optional)"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "diagnosis": {
      "tcmDiagnosis": "object",
      "pathomechanism": "string",
      "recommendations": "object"
    },
    "modelUsed": "string",
    "responseTime": "number",
    "confidenceScore": "number",
    "personalizedRecommendations": {
      "dietary": [
        {
          "item": "string",
          "reason": "string",
          "priority": "high|medium|low",
          "culturalAdaptation": "string"
        }
      ],
      "lifestyle": [
        {
          "recommendation": "string",
          "personalizationReason": "string",
          "difficulty": "easy|moderate|challenging"
        }
      ]
    },
    "safetyValidation": {
      "is_safe": "boolean",
      "risk_level": "low|medium|high|critical",
      "concerns": [
        {
          "type": "allergy|drug_interaction|contraindication",
          "severity": "low|medium|high|critical",
          "description": "string",
          "action_required": "string"
        }
      ],
      "emergency_flags": ["object"],
      "alternative_suggestions": ["string"]
    },
    "complexity": {
      "type": "simple|moderate|complex|advanced",
      "score": "number"
    },
    "processingMetadata": {
      "modelSelection": "string",
      "personalizationApplied": "boolean",
      "safetyValidated": "boolean",
      "totalProcessingTime": "number"
    }
  }
}
```

### POST /api/v2/ai-model-route

**Purpose**: Intelligent AI model selection and routing for optimal responses.

**Authentication**: User

**Request Body**:

```json
{
  "requestType": "diagnosis|chat|analysis",
  "complexity": {
    "hasImages": "boolean",
    "hasMultipleFiles": "boolean",
    "requiresAnalysis": "boolean"
  },
  "doctorLevel": "physician|expert|master",
  "preferredModel": "string (optional)",
  "requiresVision": "boolean",
  "requiresStreaming": "boolean"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "selectedModel": "string",
    "fallbackModels": ["string"],
    "reasoning": "string",
    "estimatedResponseTime": "number",
    "modelCapabilities": {
      "supportsVision": "boolean",
      "supportsStreaming": "boolean",
      "maxTokens": "number"
    }
  }
}
```

## Health Tracking APIs

### POST /api/v2/health-data/ingest

**Purpose**: Ingest health data from various sources including IoT devices and manual entry.

**Authentication**: User

**Request Body**:

```json
{
  "userId": "string",
  "source": "manual|wearable|iot|app_integration",
  "dataType": "heart_rate|blood_pressure|weight|sleep|steps|temperature",
  "measurements": [
    {
      "timestamp": "string (ISO)",
      "value": "number|object",
      "unit": "string",
      "confidence": "number (0-1)",
      "deviceId": "string (optional)",
      "metadata": "object (optional)"
    }
  ],
  "deviceInfo": {
    "deviceType": "string",
    "manufacturer": "string",
    "model": "string",
    "firmwareVersion": "string"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "recordsProcessed": "number",
    "recordsStored": "number",
    "duplicatesSkipped": "number",
    "validationErrors": ["string"],
    "tcmCorrelations": [
      {
        "dataPoint": "object",
        "tcmPattern": "string",
        "significance": "string"
      }
    ]
  }
}
```

### GET /api/v2/health-data/trends

**Purpose**: Get health trend analysis and pattern recognition.

**Authentication**: User

**Query Parameters**:

- `userId`: string (required)
- `dataType`: string (optional, filter by data type)
- `startDate`: ISO date string
- `endDate`: ISO date string
- `granularity`: daily|weekly|monthly
- `includeTCMAnalysis`: boolean

**Response**:

```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "dataType": "string",
        "trend": "improving|stable|declining",
        "changeRate": "number",
        "significance": "string",
        "tcmInterpretation": "string"
      }
    ],
    "patterns": [
      {
        "type": "seasonal|circadian|weekly",
        "description": "string",
        "strength": "number (0-1)",
        "recommendations": ["string"]
      }
    ],
    "predictions": [
      {
        "dataType": "string",
        "predictedValue": "number",
        "confidence": "number",
        "timeframe": "string"
      }
    ],
    "alerts": [
      {
        "type": "anomaly|threshold|pattern_break",
        "severity": "low|medium|high",
        "description": "string",
        "recommendedAction": "string"
      }
    ]
  }
}
```

## IoT Integration APIs

### POST /api/v2/iot/device/register

**Purpose**: Register IoT devices for health data collection.

**Authentication**: User

**Request Body**:

```json
{
  "userId": "string",
  "deviceInfo": {
    "deviceId": "string",
    "deviceType": "smartwatch|blood_pressure_monitor|scale|thermometer|pulse_oximeter",
    "manufacturer": "string",
    "model": "string",
    "capabilities": ["heart_rate", "blood_pressure", "temperature"],
    "connectionType": "bluetooth|wifi|cellular"
  },
  "authenticationData": {
    "apiKey": "string (optional)",
    "oauth_token": "string (optional)",
    "pairing_code": "string (optional)"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "deviceRegistrationId": "string",
    "status": "registered|pending_verification|failed",
    "syncSchedule": {
      "frequency": "real_time|hourly|daily",
      "nextSync": "string (ISO)"
    },
    "supportedDataTypes": ["string"],
    "tcmMappings": [
      {
        "deviceMetric": "string",
        "tcmCorrelation": "string",
        "interpretation": "string"
      }
    ]
  }
}
```

### GET /api/v2/iot/device/status

**Purpose**: Get status of registered IoT devices.

**Authentication**: User

**Query Parameters**:

- `userId`: string (required)
- `deviceId`: string (optional, specific device)

**Response**:

```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "deviceId": "string",
        "status": "online|offline|syncing|error",
        "lastSync": "string (ISO)",
        "batteryLevel": "number (0-100)",
        "dataQuality": "excellent|good|fair|poor",
        "recentData": [
          {
            "timestamp": "string",
            "dataType": "string",
            "value": "number",
            "quality": "string"
          }
        ]
      }
    ]
  }
}
```

## Personalization APIs

### GET /api/v2/personalization/profile

**Purpose**: Get user's personalization profile and learning data.

**Authentication**: User

**Query Parameters**:

- `userId`: string (required)

**Response**:

```json
{
  "success": true,
  "data": {
    "personalizationFactors": {
      "cultural_background": "string",
      "dietary_preferences": "object",
      "lifestyle_constraints": ["string"],
      "health_goals": ["string"],
      "constitution_history": ["string"],
      "treatment_responses": "object"
    },
    "learningProfile": {
      "preferences_learned": "object",
      "effectiveness_patterns": "object",
      "adaptation_suggestions": ["string"]
    },
    "recommendationHistory": [
      {
        "type": "dietary|lifestyle|herbal",
        "recommendation": "string",
        "followed": "boolean",
        "effectiveness": "number (1-5)",
        "feedback": "string"
      }
    ]
  }
}
```

### POST /api/v2/personalization/feedback

**Purpose**: Submit feedback on recommendation effectiveness for learning.

**Authentication**: User

**Request Body**:

```json
{
  "userId": "string",
  "recommendationId": "string",
  "feedback": {
    "followed": "boolean",
    "effectiveness": "number (1-5)",
    "sideEffects": ["string"],
    "difficulty": "number (1-5)",
    "culturalFit": "number (1-5)",
    "comments": "string"
  },
  "outcomes": {
    "symptomImprovement": "number (1-5)",
    "overallSatisfaction": "number (1-5)",
    "wouldRecommendToOthers": "boolean"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "feedbackRecorded": "boolean",
    "learningUpdated": "boolean",
    "futureRecommendationAdjustments": ["string"],
    "thanksMessage": "string"
  }
}
```

## Safety Validation APIs

### POST /api/v2/safety/validate-recommendations

**Purpose**: Comprehensive safety validation for TCM recommendations.

**Authentication**: User

**Request Body**:

```json
{
  "recommendations": {
    "dietary": ["string"],
    "herbal": ["string"],
    "lifestyle": ["string"],
    "acupressure": ["string"]
  },
  "medicalContext": {
    "current_medications": ["string"],
    "allergies": ["string"],
    "medical_conditions": ["string"],
    "pregnancy_status": "pregnant|breastfeeding|trying_to_conceive|none",
    "age": "number",
    "weight": "number"
  },
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "is_safe": "boolean",
    "risk_level": "low|medium|high|critical",
    "concerns": [
      {
        "type": "allergy|drug_interaction|contraindication|pregnancy|age_related",
        "severity": "low|medium|high|critical",
        "description": "string",
        "affected_recommendation": "string",
        "action_required": "monitor|modify_dosage|avoid_completely|seek_medical_advice|emergency_care"
      }
    ],
    "emergency_flags": [
      {
        "condition": "string",
        "urgency": "immediate|urgent|semi_urgent",
        "recommended_action": "string",
        "emergency_contacts": ["string"]
      }
    ],
    "drug_interactions": [
      {
        "herb_or_food": "string",
        "medication": "string",
        "severity": "minor|moderate|major|severe",
        "mechanism": "string",
        "management": "string"
      }
    ],
    "alternative_suggestions": ["string"],
    "safety_guidelines": ["string"]
  }
}
```

### POST /api/v2/safety/check-interaction

**Purpose**: Check specific herb-drug interactions.

**Authentication**: User

**Request Body**:

```json
{
  "herb": "string",
  "medication": "string",
  "patientContext": {
    "age": "number",
    "weight": "number",
    "medical_conditions": ["string"]
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "has_interaction": "boolean",
    "interaction": {
      "type": "synergistic|antagonistic|toxic|absorption_interference",
      "severity": "minor|moderate|major|severe",
      "mechanism": "string",
      "clinical_significance": "string",
      "management": "string",
      "evidence_level": "clinical_study|case_report|theoretical"
    },
    "recommendations": ["string"],
    "monitoring_required": "boolean"
  }
}
```

## Cross-Platform Sync APIs

### POST /api/v2/sync/session

**Purpose**: Synchronize diagnosis session data across platforms.

**Authentication**: User

**Request Body**:

```json
{
  "sessionId": "string",
  "platform": "web|ios|android",
  "syncData": {
    "lastModified": "string (ISO)",
    "sessionData": "object",
    "completionStatus": "in_progress|completed|cancelled",
    "deviceInfo": "object"
  },
  "conflictResolution": "client_wins|server_wins|merge|manual"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "syncStatus": "success|conflict|error",
    "resolvedData": "object",
    "conflicts": [
      {
        "field": "string",
        "clientValue": "any",
        "serverValue": "any",
        "resolution": "string"
      }
    ],
    "nextSyncToken": "string"
  }
}
```

### GET /api/v2/sync/status

**Purpose**: Get synchronization status across all user devices.

**Authentication**: User

**Query Parameters**:

- `userId`: string (required)

**Response**:

```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "deviceId": "string",
        "platform": "web|ios|android",
        "lastSync": "string (ISO)",
        "syncStatus": "up_to_date|pending|error",
        "pendingChanges": "number"
      }
    ],
    "globalSyncStatus": "synchronized|syncing|conflicts|offline",
    "lastGlobalSync": "string (ISO)"
  }
}
```

## Gamification APIs

### GET /api/v2/gamification/qi-garden

**Purpose**: Get user's Qi Garden status and virtual herbs.

**Authentication**: User

**Query Parameters**:

- `userId`: string (required)

**Response**:

```json
{
  "success": true,
  "data": {
    "garden": {
      "level": "number",
      "totalEssence": "number",
      "totalWaterDroplets": "number",
      "danTianFilling": "number (0-100)",
      "currentStreak": "number",
      "longestStreak": "number"
    },
    "herbs": [
      {
        "id": "string",
        "type": "ginseng|reishi|goji_berry|chrysanthemum|ginger",
        "stage": "seed|sprout|growing|mature|flowering",
        "health": "number (0-100)",
        "waterLevel": "number (0-100)",
        "plantedAt": "string (ISO)",
        "harvestableAt": "string (ISO)"
      }
    ],
    "achievements": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "rarity": "common|rare|epic|legendary",
        "unlockedAt": "string (ISO)",
        "progress": "number",
        "maxProgress": "number"
      }
    ],
    "dailyTasks": [
      {
        "task": "string",
        "completed": "boolean",
        "reward": "number",
        "type": "essence|water_droplets"
      }
    ]
  }
}
```

### POST /api/v2/gamification/action

**Purpose**: Record gamification actions and award points.

**Authentication**: User

**Request Body**:

```json
{
  "userId": "string",
  "action": "complete_diagnosis|qi_exercise|meal_log|daily_checkin|herb_water",
  "actionData": {
    "exerciseType": "string (optional)",
    "duration": "number (optional)",
    "quality": "number (optional)"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "pointsAwarded": {
      "essence": "number",
      "waterDroplets": "number"
    },
    "newAchievements": ["object"],
    "streakUpdated": "boolean",
    "levelUp": "boolean",
    "herbsAffected": ["string"],
    "nextMilestone": {
      "type": "string",
      "progress": "number",
      "target": "number"
    }
  }
}
```

## Community APIs

### GET /api/v2/community/circles

**Purpose**: Get available health circles based on user's constitution.

**Authentication**: User

**Query Parameters**:

- `userId`: string (required)
- `constitution`: string (optional, filter by constitution)

**Response**:

```json
{
  "success": true,
  "data": {
    "recommendedCircles": [
      {
        "id": "string",
        "name": "string",
        "constitution": "string",
        "memberCount": "number",
        "description": "string",
        "activityLevel": "high|medium|low",
        "recentTopics": ["string"]
      }
    ],
    "joinedCircles": ["object"],
    "communityGuidelines": ["string"]
  }
}
```

### POST /api/v2/community/post

**Purpose**: Create a new community post.

**Authentication**: User

**Request Body**:

```json
{
  "circleId": "string",
  "type": "text|image|recipe|progress|question",
  "content": "string",
  "images": ["string (base64)"],
  "tags": ["string"],
  "isAnonymous": "boolean",
  "constitution": "string (optional)"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "postId": "string",
    "status": "published|pending_moderation",
    "anonymousId": "string",
    "moderationNote": "string (if pending)",
    "estimatedApprovalTime": "string (if pending)"
  }
}
```

## Monitoring APIs

### GET /api/monitoring/health

**Purpose**: System health check with detailed component status.

**Authentication**: Public

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "healthy|degraded|down",
    "timestamp": "string (ISO)",
    "version": "string",
    "uptime": "number (seconds)",
    "components": {
      "database": {
        "status": "healthy|degraded|down",
        "responseTime": "number (ms)",
        "connections": "number"
      },
      "ai_services": {
        "status": "healthy|degraded|down",
        "models_available": ["string"],
        "average_response_time": "number (ms)"
      },
      "storage": {
        "status": "healthy|degraded|down",
        "available_space": "string",
        "usage_percentage": "number"
      },
      "external_apis": {
        "status": "healthy|degraded|down",
        "services": ["string"]
      }
    },
    "performance_metrics": {
      "requests_per_minute": "number",
      "average_response_time": "number (ms)",
      "error_rate": "number (percentage)"
    }
  }
}
```

### GET /api/monitoring/metrics

**Purpose**: Detailed system performance metrics.

**Authentication**: Admin

**Query Parameters**:

- `timeRange`: 1h|6h|24h|7d|30d
- `metrics`: cpu|memory|requests|errors|ai_usage

**Response**:

```json
{
  "success": true,
  "data": {
    "timeRange": "string",
    "metrics": {
      "system_performance": {
        "cpu_usage": [
          {
            "timestamp": "string",
            "value": "number (percentage)"
          }
        ],
        "memory_usage": ["object"],
        "disk_usage": ["object"]
      },
      "api_performance": {
        "request_volume": ["object"],
        "response_times": ["object"],
        "error_rates": ["object"]
      },
      "ai_usage": {
        "model_usage": ["object"],
        "token_consumption": ["object"],
        "success_rates": ["object"]
      },
      "user_activity": {
        "active_users": ["object"],
        "feature_usage": ["object"],
        "session_duration": ["object"]
      }
    },
    "alerts": [
      {
        "type": "performance|error|capacity",
        "severity": "low|medium|high|critical",
        "message": "string",
        "timestamp": "string"
      }
    ]
  }
}
```

## Core Diagnostic APIs

### POST /api/consult

**Purpose**: Main diagnosis synthesis endpoint that processes all collected diagnostic data and generates a comprehensive TCM report.

**Authentication**: User

**Request Body**:

```json
{
  "patientInfo": {
    "name": "string",
    "age": "number",
    "gender": "string",
    "height": "number",
    "weight": "number",
    "mainConcern": "string",
    "symptoms": ["string"],
    "medicalHistory": "string"
  },
  "inquiryData": {
    "chatHistory": [
      {
        "role": "user|assistant",
        "content": "string",
        "timestamp": "string"
      }
    ],
    "summary": "string"
  },
  "tongueAnalysis": {
    "imageUrl": "string",
    "analysis": "object",
    "tags": ["string"]
  },
  "faceAnalysis": {
    "imageUrl": "string",
    "analysis": "object",
    "tags": ["string"]
  },
  "audioAnalysis": {
    "audioUrl": "string",
    "analysis": "object",
    "voiceQuality": "string"
  },
  "pulseData": {
    "bpm": "number",
    "quality": "string",
    "method": "tap|manual|camera"
  },
  "smartConnectData": {
    "steps": "number",
    "heartRate": "number",
    "sleepHours": "number",
    "calories": "number"
  },
  "reportOptions": {
    "includeDemographics": "boolean",
    "includeVitalSigns": "boolean",
    "includeMedicalHistory": "boolean",
    "includeTCMRecommendations": "boolean"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "diagnosisId": "string",
    "report": {
      "tcmDiagnosis": {
        "primaryPattern": "string",
        "constitutionType": "string",
        "secondaryPatterns": ["string"],
        "affectedOrgans": ["string"]
      },
      "pathomechanism": "string",
      "analysisSummary": "string",
      "recommendations": {
        "dietary": {
          "foodsToEat": ["string"],
          "foodsToAvoid": ["string"],
          "cookingMethods": ["string"],
          "mealTiming": "string"
        },
        "herbalFormulas": [
          {
            "name": "string",
            "ingredients": ["string"],
            "preparation": "string",
            "dosage": "string"
          }
        ],
        "lifestyle": {
          "sleep": "string",
          "exercise": "string",
          "stressManagement": "string",
          "dailyRoutine": "string"
        },
        "acupressure": [
          {
            "pointName": "string",
            "location": "string",
            "technique": "string",
            "frequency": "string"
          }
        ]
      },
      "overallScore": "number",
      "confidence": "number"
    }
  }
}
```

### POST /api/chat

**Purpose**: Interactive TCM inquiry chat for symptom collection and medical history.

**Authentication**: Public

**Request Body**:

```json
{
  "messages": [
    {
      "role": "user|assistant",
      "content": "string"
    }
  ],
  "patientContext": {
    "age": "number",
    "gender": "string",
    "mainConcern": "string",
    "previousSymptoms": ["string"]
  },
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "response": "string",
    "isComplete": "boolean",
    "nextQuestions": ["string"],
    "summary": "string"
  }
}
```

## AI Analysis APIs

### POST /api/analyze-image

**Purpose**: Analyze tongue, face, or body part images for TCM diagnostic insights.

**Authentication**: Public

**Request Body**:

```json
{
  "image": "string (base64)",
  "type": "tongue|face|body",
  "patientInfo": {
    "age": "number",
    "gender": "string"
  },
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "tongueBody": {
        "color": "string",
        "shape": "string",
        "size": "string",
        "moisture": "string"
      },
      "tongueCoating": {
        "color": "string",
        "thickness": "string",
        "distribution": "string"
      },
      "tcmInterpretation": "string",
      "tags": ["string"],
      "confidence": "number"
    },
    "imageUrl": "string"
  }
}
```

### POST /api/analyze-audio

**Purpose**: Analyze voice recordings for TCM diagnostic insights.

**Authentication**: Public

**Request Body**:

```json
{
  "audio": "string (base64)",
  "patientInfo": {
    "age": "number",
    "gender": "string"
  },
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "voiceStrength": "weak|normal|strong",
      "toneQuality": "string",
      "breathingPattern": "string",
      "tcmInterpretation": "string",
      "confidence": "number"
    },
    "audioUrl": "string"
  }
}
```

### POST /api/analyze-snore

**Purpose**: Analyze sleep audio recordings for snoring patterns and TCM correlations.

**Authentication**: User

**Request Body**:

```json
{
  "audio": "string (base64)",
  "duration": "number",
  "patientInfo": {
    "age": "number",
    "gender": "string",
    "weight": "number",
    "height": "number"
  },
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "snoreAnalysis": {
      "severity": "none|mild|moderate|severe",
      "frequency": "number",
      "patterns": ["string"],
      "sleepApneaRisk": "low|medium|high"
    },
    "tcmCorrelation": {
      "constitution": "string",
      "patterns": ["string"],
      "recommendations": ["string"]
    },
    "audioUrl": "string"
  }
}
```

### POST /api/report-chat

**Purpose**: Interactive Q&A with specific diagnosis reports.

**Authentication**: User

**Request Body**:

```json
{
  "reportId": "string",
  "messages": [
    {
      "role": "user|assistant",
      "content": "string"
    }
  ],
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "response": "string",
    "relatedSections": ["string"],
    "confidence": "number"
  }
}
```

### POST /api/western-chat

**Purpose**: AI-powered Western medicine "second opinion" consultation.

**Authentication**: User

**Request Body**:

```json
{
  "tcmDiagnosis": "object",
  "messages": [
    {
      "role": "user|assistant",
      "content": "string"
    }
  ],
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "response": "string",
    "westernPerspective": "string",
    "recommendations": ["string"]
  }
}
```

## Patient Management APIs

### POST /api/ask-dietary-advice

**Purpose**: Get personalized dietary advice based on TCM constitution.

**Authentication**: User

**Request Body**:

```json
{
  "constitution": "string",
  "foodQuery": "string",
  "allergies": ["string"],
  "dietaryType": "vegetarian|vegan|pescatarian|halal|kosher|none",
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "advice": "string",
    "suitability": "suitable|moderate|avoid",
    "alternatives": ["string"],
    "tcmProperties": {
      "thermalNature": "hot|warm|neutral|cool|cold",
      "flavors": ["string"],
      "organAffinity": ["string"]
    }
  }
}
```

### POST /api/generate-infographic

**Purpose**: Generate shareable health infographics from diagnosis reports.

**Authentication**: User

**Request Body**:

```json
{
  "reportId": "string",
  "style": "modern|traditional|minimal",
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "infographicUrl": "string",
    "downloadUrl": "string"
  }
}
```

### POST /api/extract-text

**Purpose**: OCR text extraction from medical documents.

**Authentication**: User

**Request Body**:

```json
{
  "image": "string (base64)",
  "documentType": "medical_report|prescription|lab_result|other",
  "language": "en|zh|ms"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "extractedText": "string",
    "confidence": "number",
    "documentStructure": {
      "sections": ["string"],
      "keyFindings": ["string"]
    }
  }
}
```

### POST /api/validate-medicine

**Purpose**: Validate TCM herbal formulas and check for interactions.

**Authentication**: User

**Request Body**:

```json
{
  "herbs": ["string"],
  "currentMedications": ["string"],
  "allergies": ["string"],
  "patientInfo": {
    "age": "number",
    "gender": "string",
    "conditions": ["string"]
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": "boolean",
      "warnings": ["string"],
      "interactions": ["string"],
      "contraindications": ["string"]
    },
    "recommendations": ["string"]
  }
}
```

## Admin APIs

### GET /api/admin/settings

**Purpose**: Retrieve system configuration settings.

**Authentication**: Admin

**Response**:

```json
{
  "success": true,
  "data": {
    "defaultModel": "string",
    "systemPrompts": "object",
    "featureFlags": "object",
    "apiLimits": "object"
  }
}
```

### POST /api/admin/settings

**Purpose**: Update system configuration settings.

**Authentication**: Admin

**Request Body**:

```json
{
  "defaultModel": "string",
  "systemPrompts": "object",
  "featureFlags": "object",
  "apiLimits": "object"
}
```

### GET /api/admin/db-status

**Purpose**: Check database connection and health status.

**Authentication**: Admin

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "healthy|degraded|down",
    "connections": "number",
    "responseTime": "number",
    "lastCheck": "string"
  }
}
```

### POST /api/admin/test-api-key

**Purpose**: Test Gemini API key validity.

**Authentication**: Admin

**Request Body**:

```json
{
  "apiKey": "string"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "isValid": "boolean",
    "model": "string",
    "quotaRemaining": "number"
  }
}
```

## Notification APIs

### POST /api/notifications/register-device

**Purpose**: Register device for push notifications.

**Authentication**: User

**Request Body**:

```json
{
  "deviceToken": "string",
  "platform": "web|ios|android",
  "preferences": {
    "reminders": "boolean",
    "updates": "boolean",
    "community": "boolean"
  }
}
```

### POST /api/notifications/schedule

**Purpose**: Schedule personalized health reminders.

**Authentication**: User

**Request Body**:

```json
{
  "type": "medication|exercise|meal|checkup",
  "title": "string",
  "message": "string",
  "scheduledTime": "string",
  "recurring": "boolean",
  "frequency": "daily|weekly|monthly"
}
```

### GET /api/notifications/preferences

**Purpose**: Get user notification preferences.

**Authentication**: User

### POST /api/notifications/preferences

**Purpose**: Update user notification preferences.

**Authentication**: User

### POST /api/notifications/sync

**Purpose**: Sync notifications across devices.

**Authentication**: User

## Utility APIs

### GET /api/health

**Purpose**: System health check endpoint.

**Authentication**: Public

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "string",
    "version": "string",
    "uptime": "number"
  }
}
```

### POST /api/summarize-inquiry

**Purpose**: Summarize chat inquiry for final diagnosis.

**Authentication**: Public

**Request Body**:

```json
{
  "chatHistory": [
    {
      "role": "user|assistant",
      "content": "string",
      "timestamp": "string"
    }
  ],
  "language": "en|zh|ms"
}
```

### POST /api/summarize-medical-history

**Purpose**: Summarize uploaded medical documents.

**Authentication**: User

**Request Body**:

```json
{
  "documents": [
    {
      "type": "string",
      "content": "string",
      "date": "string"
    }
  ],
  "language": "en|zh|ms"
}
```

### GET /api/logs

**Purpose**: Retrieve system logs (admin only).

**Authentication**: Admin

**Query Parameters**:

- `level`: error|warn|info|debug
- `limit`: number (default: 100)
- `offset`: number (default: 0)
- `startDate`: ISO date string
- `endDate`: ISO date string

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Malformed request body or parameters
- `UNAUTHORIZED`: Authentication required or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `AI_SERVICE_ERROR`: AI model processing error
- `VALIDATION_ERROR`: Input validation failed

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Public endpoints**: 100 requests per hour per IP
- **Authenticated endpoints**: 1000 requests per hour per user
- **AI analysis endpoints**: 50 requests per hour per user
- **Admin endpoints**: 500 requests per hour per admin

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Models

### Patient Profile

```typescript
interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number; // cm
  weight: number; // kg
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Diagnosis Session

```typescript
interface DiagnosisSession {
  id: string;
  patientId: string;
  practitionerId?: string;
  status: "in_progress" | "completed" | "cancelled";
  data: {
    patientInfo: PatientInfo;
    inquiryData?: InquiryData;
    tongueAnalysis?: ImageAnalysis;
    faceAnalysis?: ImageAnalysis;
    audioAnalysis?: AudioAnalysis;
    pulseData?: PulseData;
    smartConnectData?: HealthMetrics;
  };
  overallScore?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

### TCM Diagnosis

```typescript
interface TCMDiagnosis {
  primaryPattern: string;
  constitutionType: ConstitutionType;
  secondaryPatterns: string[];
  affectedOrgans: OrganSystem[];
  pathomechanism: string;
  confidence: number;
}

type ConstitutionType =
  | "balanced"
  | "qi_deficiency"
  | "yang_deficiency"
  | "yin_deficiency"
  | "phlegm_dampness"
  | "damp_heat"
  | "blood_stasis"
  | "qi_stagnation"
  | "special_diathesis";

type OrganSystem =
  | "heart"
  | "liver"
  | "spleen"
  | "lung"
  | "kidney"
  | "gallbladder"
  | "stomach"
  | "small_intestine"
  | "large_intestine"
  | "bladder"
  | "triple_burner"
  | "pericardium";
```

### Medical Report

```typescript
interface MedicalReport {
  id: string;
  diagnosisId: string;
  patientId: string;
  practitionerId?: string;
  content: {
    tcmDiagnosis: TCMDiagnosis;
    recommendations: TreatmentRecommendations;
    analysisSummary: string;
  };
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Treatment Recommendations

```typescript
interface TreatmentRecommendations {
  dietary: {
    foodsToEat: string[];
    foodsToAvoid: string[];
    cookingMethods: string[];
    mealTiming: string;
  };
  herbalFormulas?: HerbalFormula[];
  lifestyle: {
    sleep: string;
    exercise: string;
    stressManagement: string;
    dailyRoutine: string;
  };
  acupressure: AcupressurePoint[];
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize client
const client = new SihatTCMClient({
  baseUrl: "https://your-domain.com/api",
  apiKey: "your-api-key", // if required
});

// Start diagnosis
const diagnosis = await client.consult({
  patientInfo: {
    name: "John Doe",
    age: 35,
    gender: "male",
    height: 175,
    weight: 70,
    mainConcern: "Fatigue and digestive issues",
  },
  // ... other diagnostic data
});

// Analyze image
const tongueAnalysis = await client.analyzeImage({
  image: base64Image,
  type: "tongue",
  patientInfo: { age: 35, gender: "male" },
});

// Chat with report
const chatResponse = await client.reportChat({
  reportId: "report-123",
  messages: [{ role: "user", content: "What does my diagnosis mean?" }],
});
```

### Python

```python
import requests

class SihatTCMClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.headers = {'Content-Type': 'application/json'}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'

    def consult(self, data):
        response = requests.post(
            f'{self.base_url}/consult',
            json=data,
            headers=self.headers
        )
        return response.json()

    def analyze_image(self, image_data):
        response = requests.post(
            f'{self.base_url}/analyze-image',
            json=image_data,
            headers=self.headers
        )
        return response.json()

# Usage
client = SihatTCMClient('https://your-domain.com/api')
result = client.consult({
    'patientInfo': {
        'name': 'John Doe',
        'age': 35,
        'gender': 'male'
    }
})
```

---

**For more information or support, please contact the development team or refer to the [Developer Manual](./DEVELOPER_MANUAL.md).**
