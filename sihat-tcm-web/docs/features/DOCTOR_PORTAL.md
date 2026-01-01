# Doctor Portal Navigation Guide

**Version**: 1.0  
**Last Updated**: December 2024

## Table of Contents

1. [Navigation Structure Overview](#navigation-structure-overview)
2. [Detailed Navigation Structure](#detailed-navigation-structure)
3. [Quick Reference](#quick-reference)
4. [Visual Diagrams](#visual-diagrams)
5. [Implementation Priority](#implementation-priority)

---

## Navigation Structure Overview

```
┌─────────────────────────────────────────┐
│  🏥 Doctor Portal                       │
├─────────────────────────────────────────┤
│                                         │
│  📊 DASHBOARD                           │
│  └─ Overview & Quick Actions           │
│                                         │
│  ⚡ CRITICAL                            │
│  ├─ Safety Alerts                       │
│  ├─ Emergency Cases                    │
│  └─ Review Queue                       │
│                                         │
│  👥 PATIENTS                           │
│  ├─ Patient List                       │
│  ├─ Patient Profiles                   │
│  └─ Family Management                  │
│                                         │
│  📋 REPORTS                            │
│  ├─ All Reports                        │
│  ├─ Pending Review                     │
│  ├─ My Reports                         │
│  └─ Report Templates                   │
│                                         │
│  🔬 DIAGNOSIS                          │
│  ├─ New Diagnosis                      │
│  ├─ Diagnosis History                  │
│  └─ Pattern Library                    │
│                                         │
│  💊 TREATMENT                          │
│  ├─ Prescriptions                      │
│  ├─ Treatment Plans                    │
│  ├─ Herbal Database                    │
│  └─ Safety Checker                    │
│                                         │
│  📅 SCHEDULE                           │
│  ├─ Calendar                           │
│  ├─ Appointments                       │
│  └─ Follow-ups                         │
│                                         │
│  💬 COMMUNICATION                      │
│  ├─ Messages                           │
│  ├─ Patient Notes                      │
│  └─ Consultations                      │
│                                         │
│  📊 ANALYTICS                          │
│  ├─ Practice Stats                     │
│  ├─ Patient Trends                     │
│  └─ Quality Metrics                    │
│                                         │
│  ⚙️ SETTINGS                           │
│  ├─ Profile                            │
│  ├─ Preferences                        │
│  └─ Notifications                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Detailed Navigation Structure

### 1. 📊 DASHBOARD
**Route**: `/doctor`  
**Icon**: `LayoutDashboard`  
**Purpose**: Central hub with overview and quick actions

#### Features:
- **Overview Cards**
  - Total patients today
  - Pending reviews (with badge count)
  - Critical alerts (with badge count)
  - Upcoming appointments
  
- **Quick Stats**
  - Reports reviewed this week
  - Average review time
  - Quality score
  - Patient satisfaction

- **Recent Activity Feed**
  - Latest patient reports
  - Critical alerts
  - System notifications
  - Upcoming follow-ups

- **Quick Actions**
  - Start new diagnosis
  - Review pending reports
  - View critical cases
  - Check messages

- **Charts & Visualizations**
  - Daily report volume (7-day trend)
  - Most common TCM patterns
  - Treatment effectiveness
  - Peak consultation times

---

### 2. ⚡ CRITICAL (Priority Section)
**Route**: `/doctor/critical`  
**Icon**: `AlertTriangle` (with red badge)  
**Purpose**: Handle urgent and safety-critical cases

#### Sub-sections:

##### 2.1 Safety Alerts
**Route**: `/doctor/critical/alerts`  
**Features**:
- **Active Alerts Dashboard**
  - Drug-herb interaction warnings
  - Allergy conflicts
  - Contraindication alerts
  - Emergency symptom flags
  - Critical vital signs
  
- **Alert Details**
  - Patient information
  - Alert severity (Low/Medium/High/Critical)
  - Recommended actions
  - Acknowledge/Resolve workflow
  
- **Alert History**
  - Past alerts and resolutions
  - Alert patterns
  - Response time tracking

##### 2.2 Emergency Cases
**Route**: `/doctor/critical/emergencies`  
**Features**:
- **Active Emergency Dashboard**
  - Real-time emergency cases
  - Patient status
  - Emergency type (Stroke, Heart Attack, Allergic Reaction, etc.)
  - Response time tracking
  
- **Emergency Protocols**
  - Step-by-step protocols by condition
  - Hospital referral directory
  - Emergency contact information
  - Action checklist
  
- **Emergency History**
  - Past emergency cases
  - Outcome tracking
  - Response time analytics

##### 2.3 Review Queue
**Route**: `/doctor/critical/review-queue`  
**Features**:
- **Priority Queue**
  - Critical cases (red) - 2 hour deadline
  - High-risk cases (orange) - 24 hour deadline
  - Standard cases (blue) - 72 hour deadline
  
- **Queue Management**
  - Drag-and-drop prioritization
  - Assign to doctor
  - Filter by priority/status
  - Search functionality
  
- **Review Interface**
  - Report preview
  - Safety checklist
  - Approval/rejection workflow
  - Add clinical notes
  - Request second opinion

---

### 3. 👥 PATIENTS
**Route**: `/doctor/patients`  
**Icon**: `Users`  
**Purpose**: Manage patient information and relationships

#### Sub-sections:

##### 3.1 Patient List
**Route**: `/doctor/patients` (default)  
**Features**:
- **Patient Directory**
  - Searchable patient list
  - Filter by: status, risk level, last visit
  - Sort by: name, last visit, risk level
  - Quick patient cards with key info
  
- **Patient Status Indicators**
  - Active patients (green)
  - High-risk patients (red)
  - Inactive patients (gray)
  - New patients (blue badge)

##### 3.2 Patient Profile
**Route**: `/doctor/patients/[patientId]`  
**Features**:
- **Patient Overview**
  - Demographics
  - Medical history timeline
  - Current medications
  - Allergies (prominent display)
  - Emergency contacts
  
- **Health Timeline**
  - All diagnoses chronologically
  - Treatment history
  - Progress tracking
  - Health score trends
  
- **Active Issues**
  - Current conditions
  - Ongoing treatments
  - Pending follow-ups
  - Risk factors
  
- **Quick Actions**
  - Start new diagnosis
  - Schedule appointment
  - Send message
  - Add clinical note
  - View full history

##### 3.3 Family Management
**Route**: `/doctor/patients/families`  
**Features**:
- **Family Groups**
  - View family relationships
  - Family health patterns
  - Genetic risk factors
  - Family treatment history
  
- **Family Member Profiles**
  - Individual profiles within family
  - Cross-reference health data
  - Family health trends

---

### 4. 📋 REPORTS
**Route**: `/doctor/reports`  
**Icon**: `FileText`  
**Purpose**: Manage and review patient reports

#### Sub-sections:

##### 4.1 All Reports
**Route**: `/doctor/reports` (default)  
**Features**:
- **Report List**
  - All patient reports
  - Filter by: status, date, patient, pattern
  - Search functionality
  - Sort options
  
- **Report Status**
  - Draft (gray)
  - Pending Review (yellow)
  - Reviewed (green)
  - Approved (blue)
  - Rejected (red)
  
- **Report Cards**
  - Patient name
  - Diagnosis summary
  - Date created
  - Status badge
  - Quick actions

##### 4.2 Pending Review
**Route**: `/doctor/reports/pending`  
**Features**:
- **Review Queue**
  - Reports awaiting review
  - Priority indicators
  - Deadline countdown
  - Assigned doctor
  
- **Review Interface**
  - Full report view
  - Side-by-side comparison (if revision)
  - Safety validation panel
  - Edit/annotate capability
  - Approval workflow
  - Add clinical notes

##### 4.3 My Reports
**Route**: `/doctor/reports/my-reports`  
**Features**:
- **Personal Report List**
  - Reports created/reviewed by you
  - Filter by date range
  - Quality scores
  - Patient feedback
  
- **Report Analytics**
  - Reports per week/month
  - Average review time
  - Quality trends
  - Common patterns diagnosed

##### 4.4 Report Templates
**Route**: `/doctor/reports/templates`  
**Features**:
- **Template Library**
  - Common condition templates
  - Custom templates
  - Template editor
  - Template sharing

---

### 5. 🔬 DIAGNOSIS
**Route**: `/doctor/diagnosis`  
**Icon**: `Stethoscope`  
**Purpose**: Conduct and manage diagnoses

#### Sub-sections:

##### 5.1 New Diagnosis
**Route**: `/doctor/diagnosis/new`  
**Features**:
- **Diagnosis Wizard**
  - Patient selection
  - Four examinations workflow
  - AI-assisted analysis
  - Real-time safety checks
  - Report generation
  
- **Diagnosis Tools**
  - Image upload (tongue, face, body)
  - Audio recording (voice analysis)
  - Pulse measurement
  - Symptom checklist
  - Medical history integration

##### 5.2 Diagnosis History
**Route**: `/doctor/diagnosis/history`  
**Features**:
- **Historical Diagnoses**
  - All past diagnoses
  - Filter by patient, date, pattern
  - Search functionality
  - Comparison view
  
- **Pattern Tracking**
  - Pattern evolution over time
  - Treatment response
  - Recurring patterns
  - Pattern correlations

##### 5.3 Pattern Library
**Route**: `/doctor/diagnosis/patterns`  
**Features**:
- **TCM Pattern Database**
  - All TCM patterns with descriptions
  - Pattern characteristics
  - Common symptoms
  - Treatment protocols
  - Case studies
  
- **Pattern Search**
  - Search by symptoms
  - Search by organ system
  - Pattern comparison tool
  - Differential diagnosis helper

---

### 6. 💊 TREATMENT
**Route**: `/doctor/treatment`  
**Icon**: `Pill` / `Leaf`  
**Purpose**: Manage prescriptions and treatment plans

#### Sub-sections:

##### 6.1 Prescriptions
**Route**: `/doctor/treatment/prescriptions`  
**Features**:
- **Prescription Builder**
  - Herbal formula builder
  - Ingredient library
  - Dosage calculator
  - Safety validation
  - Contraindication checker
  
- **Active Prescriptions**
  - Current patient prescriptions
  - Refill management
  - Dosage adjustments
  - Treatment response tracking
  
- **Prescription History**
  - Past prescriptions
  - Effectiveness tracking
  - Patient compliance

##### 6.2 Treatment Plans
**Route**: `/doctor/treatment/plans`  
**Features**:
- **Plan Builder**
  - Multi-week treatment plans
  - Dietary therapy integration
  - Exercise prescriptions
  - Lifestyle modifications
  - Milestone tracking
  
- **Active Plans**
  - Ongoing treatment plans
  - Progress monitoring
  - Adjustment interface
  - Patient adherence tracking

##### 6.3 Herbal Database
**Route**: `/doctor/treatment/herbs`  
**Features**:
- **Herb Library**
  - Comprehensive herb database
  - Properties (nature, flavor, meridians)
  - Indications
  - Contraindications
  - Dosage guidelines
  - Drug interactions
  
- **Formula Database**
  - Classic TCM formulas
  - Formula compositions
  - Indications
  - Modifications
  - Case studies

##### 6.4 Safety Checker
**Route**: `/doctor/treatment/safety`  
**Features**:
- **Real-time Safety Validation**
  - Drug-herb interaction checker
  - Allergy verification
  - Contraindication analysis
  - Dosage safety check
  - Cumulative toxicity assessment
  
- **Safety Reports**
  - Detailed safety analysis
  - Risk level breakdown
  - Alternative suggestions
  - Evidence citations

---

### 7. 📅 SCHEDULE
**Route**: `/doctor/schedule`  
**Icon**: `Calendar`  
**Purpose**: Manage appointments and follow-ups

#### Sub-sections:

##### 7.1 Calendar
**Route**: `/doctor/schedule` (default)  
**Features**:
- **Calendar View**
  - Day/Week/Month views
  - Appointment blocks
  - Color-coded by type
  - Drag-and-drop rescheduling
  
- **Appointment Management**
  - Create new appointments
  - Edit existing appointments
  - Cancel appointments
  - Recurring appointments
  - Availability settings

##### 7.2 Appointments
**Route**: `/doctor/schedule/appointments`  
**Features**:
- **Appointment List**
  - Upcoming appointments
  - Past appointments
  - Filter by date, patient, status
  - Search functionality
  
- **Appointment Details**
  - Patient information
  - Appointment type
  - Notes
  - Follow-up requirements
  - Link to patient profile

##### 7.3 Follow-ups
**Route**: `/doctor/schedule/follow-ups`  
**Features**:
- **Follow-up Queue**
  - Scheduled follow-ups
  - Overdue follow-ups (red alert)
  - Automatic reminders
  - Follow-up templates
  
- **Follow-up Management**
  - Create follow-up tasks
  - Set reminders
  - Track completion
  - Patient response tracking

---

### 8. 💬 COMMUNICATION
**Route**: `/doctor/communication`  
**Icon**: `MessageSquare`  
**Purpose**: Communicate with patients and colleagues

#### Sub-sections:

##### 8.1 Messages
**Route**: `/doctor/communication/messages`  
**Features**:
- **Inbox**
  - Patient messages
  - Unread count badge
  - Priority messages
  - Message threads
  
- **Message Interface**
  - Secure messaging
  - File attachments
  - Message templates
  - Quick replies
  - Read receipts

##### 8.2 Patient Notes
**Route**: `/doctor/communication/notes`  
**Features**:
- **Clinical Notes**
  - Private doctor notes
  - Patient visit notes
  - Treatment observations
  - Progress notes
  - Note templates
  
- **Note Management**
  - Search notes
  - Filter by patient, date
  - Tag system
  - Note sharing (with permissions)

##### 8.3 Consultations
**Route**: `/doctor/communication/consultations`  
**Features**:
- **Video Consultations**
  - Schedule video calls
  - Join consultation
  - Consultation notes
  - Recording (with consent)
  
- **Consultation History**
  - Past consultations
  - Consultation summaries
  - Follow-up actions

---

### 9. 📊 ANALYTICS
**Route**: `/doctor/analytics`  
**Icon**: `BarChart` / `TrendingUp`  
**Purpose**: View practice insights and trends

#### Sub-sections:

##### 9.1 Practice Stats
**Route**: `/doctor/analytics` (default)  
**Features**:
- **Overview Dashboard**
  - Total patients
  - Reports reviewed
  - Average review time
  - Quality scores
  - Revenue (if applicable)
  
- **Charts & Graphs**
  - Patient volume trends
  - Report volume by day/week/month
  - Peak consultation times
  - Doctor performance metrics

##### 9.2 Patient Trends
**Route**: `/doctor/analytics/patient-trends`  
**Features**:
- **Health Pattern Analysis**
  - Most common TCM patterns
  - Pattern prevalence over time
  - Seasonal pattern correlations
  - Patient demographics analysis
  
- **Treatment Effectiveness**
  - Treatment success rates
  - Pattern resolution rates
  - Patient improvement tracking
  - Comparative analysis

##### 9.3 Quality Metrics
**Route**: `/doctor/analytics/quality`  
**Features**:
- **Quality Dashboard**
  - Report quality scores
  - Documentation completeness
  - Safety check compliance
  - Patient satisfaction scores
  
- **Performance Tracking**
  - Personal quality trends
  - Peer comparison (anonymous)
  - Improvement areas
  - Best practices

---

### 10. ⚙️ SETTINGS
**Route**: `/doctor/settings`  
**Icon**: `Settings`  
**Purpose**: Manage profile and preferences

#### Sub-sections:

##### 10.1 Profile
**Route**: `/doctor/settings/profile`  
**Features**:
- **Doctor Information**
  - Personal details
  - License information
  - Specializations
  - Qualifications
  - Years of experience
  
- **Profile Management**
  - Edit profile
  - Upload photo
  - Update credentials
  - Verification status

##### 10.2 Preferences
**Route**: `/doctor/settings/preferences`  
**Features**:
- **Display Settings**
  - Theme (light/dark)
  - Language
  - Date format
  - Time zone
  
- **Workflow Preferences**
  - Default review settings
  - Notification preferences
  - Dashboard layout
  - Quick actions

##### 10.3 Notifications
**Route**: `/doctor/settings/notifications`  
**Features**:
- **Notification Settings**
  - Email notifications
  - Push notifications
  - SMS alerts (for critical)
  - Notification frequency
  
- **Alert Preferences**
  - Critical alert settings
  - Emergency case notifications
  - Review deadline reminders
  - Patient message alerts

---

## Quick Reference

### Navigation Icons Reference

| Section | Icon | Color |
|---------|------|-------|
| Dashboard | `LayoutDashboard` | Blue |
| Critical | `AlertTriangle` | Red |
| Patients | `Users` | Green |
| Reports | `FileText` | Purple |
| Diagnosis | `Stethoscope` | Teal |
| Treatment | `Pill` / `Leaf` | Orange |
| Schedule | `Calendar` | Indigo |
| Communication | `MessageSquare` | Pink |
| Analytics | `BarChart` | Cyan |
| Settings | `Settings` | Gray |

### Badge System

- **Red Badge**: Critical alerts, emergencies, overdue items
- **Orange Badge**: High priority, pending reviews
- **Yellow Badge**: Warnings, medium priority
- **Blue Badge**: New items, notifications
- **Green Badge**: Completed, approved items

### Quick Access Features

**Top Bar Quick Actions:**
- 🔔 Notifications (with badge count)
- 🔍 Global search
- 👤 Profile menu
- 🌙 Theme toggle

**Keyboard Shortcuts:**
- `Ctrl/Cmd + K`: Global search
- `Ctrl/Cmd + N`: New diagnosis
- `Ctrl/Cmd + R`: Review queue
- `Ctrl/Cmd + M`: Messages
- `Ctrl/Cmd + ,`: Settings

### What Goes Where?

**Patient-Related:**
- View patient list → 👥 Patients → Patient List
- View patient details → 👥 Patients → Patient Profile
- Start diagnosis → 🔬 Diagnosis → New Diagnosis
- View patient history → 👥 Patients → Patient Profile → Health Timeline

**Report-Related:**
- Review reports → 📋 Reports → Pending Review
- View all reports → 📋 Reports → All Reports
- My reports → 📋 Reports → My Reports
- Create template → 📋 Reports → Report Templates

**Safety & Critical:**
- Safety alerts → ⚡ Critical → Safety Alerts
- Emergency cases → ⚡ Critical → Emergency Cases
- Review queue → ⚡ Critical → Review Queue

**Treatment:**
- Create prescription → 💊 Treatment → Prescriptions
- Check safety → 💊 Treatment → Safety Checker
- Herb database → 💊 Treatment → Herbal Database
- Treatment plan → 💊 Treatment → Treatment Plans

**Communication:**
- Patient messages → 💬 Communication → Messages
- Clinical notes → 💬 Communication → Patient Notes
- Video call → 💬 Communication → Consultations

**Management:**
- Schedule appointment → 📅 Schedule → Calendar
- View analytics → 📊 Analytics → Practice Stats
- Update profile → ⚙️ Settings → Profile

---

## Visual Diagrams

### Complete Navigation Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCTOR PORTAL                             │
│                  Left Navigation Bar                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD                                                │
│  ├─ Overview & Stats                                        │
│  ├─ Quick Actions                                           │
│  ├─ Recent Activity                                         │
│  └─ Charts & Analytics                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚡ CRITICAL (🔴 Badge: 3)                                   │
│  │                                                           │
│  ├─ 🚨 Safety Alerts                                        │
│  │   ├─ Drug-Herb Interactions                            │
│  │   ├─ Allergy Conflicts                                  │
│  │   ├─ Contraindications                                  │
│  │   └─ Emergency Symptoms                                 │
│  │                                                           │
│  ├─ 🆘 Emergency Cases                                      │
│  │   ├─ Active Emergencies                                 │
│  │   ├─ Emergency Protocols                                │
│  │   └─ Response Tracking                                  │
│  │                                                           │
│  └─ 📝 Review Queue                                         │
│      ├─ Critical (2hr deadline)                           │
│      ├─ High-Risk (24hr deadline)                         │
│      └─ Standard (72hr deadline)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  👥 PATIENTS                                                 │
│  │                                                           │
│  ├─ 📋 Patient List                                         │
│  │   ├─ Search & Filter                                   │
│  │   ├─ Status Indicators                                  │
│  │   └─ Quick Actions                                      │
│  │                                                           │
│  ├─ 👤 Patient Profile                                     │
│  │   ├─ Demographics                                       │
│  │   ├─ Medical History Timeline                           │
│  │   ├─ Health Timeline                                    │
│  │   ├─ Active Issues                                      │
│  │   └─ Quick Actions                                      │
│  │                                                           │
│  └─ 👨‍👩‍👧 Family Management                                  │
│      ├─ Family Groups                                      │
│      └─ Family Health Patterns                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📋 REPORTS                                                  │
│  │                                                           │
│  ├─ 📄 All Reports                                          │
│  │   ├─ Report List                                        │
│  │   ├─ Status Filters                                     │
│  │   └─ Search & Sort                                     │
│  │                                                           │
│  ├─ ⏳ Pending Review (🟡 Badge: 5)                       │
│  │   ├─ Review Queue                                       │
│  │   ├─ Review Interface                                   │
│  │   └─ Approval Workflow                                 │
│  │                                                           │
│  ├─ 📊 My Reports                                           │
│  │   ├─ Personal Report List                              │
│  │   └─ Report Analytics                                   │
│  │                                                           │
│  └─ 📝 Report Templates                                     │
│      └─ Template Library                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔬 DIAGNOSIS                                                │
│  │                                                           │
│  ├─ ➕ New Diagnosis                                        │
│  │   ├─ Diagnosis Wizard                                  │
│  │   ├─ Four Examinations                                 │
│  │   └─ AI-Assisted Analysis                               │
│  │                                                           │
│  ├─ 📚 Diagnosis History                                   │
│  │   ├─ Historical Diagnoses                               │
│  │   └─ Pattern Tracking                                  │
│  │                                                           │
│  └─ 📖 Pattern Library                                     │
│      ├─ TCM Pattern Database                               │
│      └─ Pattern Search & Comparison                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💊 TREATMENT                                                │
│  │                                                           │
│  ├─ 💉 Prescriptions                                        │
│  │   ├─ Prescription Builder                              │
│  │   ├─ Active Prescriptions                               │
│  │   └─ Prescription History                               │
│  │                                                           │
│  ├─ 📋 Treatment Plans                                     │
│  │   ├─ Plan Builder                                       │
│  │   └─ Active Plans                                       │
│  │                                                           │
│  ├─ 🌿 Herbal Database                                     │
│  │   ├─ Herb Library                                       │
│  │   └─ Formula Database                                  │
│  │                                                           │
│  └─ ✅ Safety Checker                                      │
│      ├─ Real-time Validation                              │
│      └─ Safety Reports                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📅 SCHEDULE                                                 │
│  │                                                           │
│  ├─ 📆 Calendar                                            │
│  │   ├─ Day/Week/Month Views                              │
│  │   └─ Appointment Management                             │
│  │                                                           │
│  ├─ 📝 Appointments                                         │
│  │   ├─ Appointment List                                   │
│  │   └─ Appointment Details                                │
│  │                                                           │
│  └─ 🔔 Follow-ups                                           │
│      ├─ Follow-up Queue                                    │
│      └─ Follow-up Management                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💬 COMMUNICATION (🔵 Badge: 2)                             │
│  │                                                           │
│  ├─ ✉️ Messages                                            │
│  │   ├─ Inbox                                              │
│  │   └─ Message Interface                                   │
│  │                                                           │
│  ├─ 📝 Patient Notes                                        │
│  │   ├─ Clinical Notes                                     │
│  │   └─ Note Management                                    │
│  │                                                           │
│  └─ 🎥 Consultations                                       │
│      ├─ Video Consultations                                │
│      └─ Consultation History                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 ANALYTICS                                                │
│  │                                                           │
│  ├─ 📈 Practice Stats                                       │
│  │   ├─ Overview Dashboard                                 │
│  │   └─ Charts & Graphs                                    │
│  │                                                           │
│  ├─ 📉 Patient Trends                                      │
│  │   ├─ Health Pattern Analysis                            │
│  │   └─ Treatment Effectiveness                            │
│  │                                                           │
│  └─ ⭐ Quality Metrics                                     │
│      ├─ Quality Dashboard                                 │
│      └─ Performance Tracking                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚙️ SETTINGS                                                 │
│  │                                                           │
│  ├─ 👤 Profile                                             │
│  │   ├─ Doctor Information                                 │
│  │   └─ Profile Management                                 │
│  │                                                           │
│  ├─ ⚙️ Preferences                                         │
│  │   ├─ Display Settings                                   │
│  │   └─ Workflow Preferences                              │
│  │                                                           │
│  └─ 🔔 Notifications                                        │
│      ├─ Notification Settings                             │
│      └─ Alert Preferences                                  │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Structure Table

| Tab | Icon | Route | Badge | Key Features | Priority |
|-----|------|-------|-------|--------------|----------|
| **Dashboard** | 📊 | `/doctor` | - | Overview, stats, quick actions | High |
| **Critical** | ⚡ | `/doctor/critical` | 🔴 | Safety alerts, emergencies, review queue | **Critical** |
| **Patients** | 👥 | `/doctor/patients` | - | Patient list, profiles, families | High |
| **Reports** | 📋 | `/doctor/reports` | 🟡 | All reports, pending review, templates | High |
| **Diagnosis** | 🔬 | `/doctor/diagnosis` | - | New diagnosis, history, patterns | Medium |
| **Treatment** | 💊 | `/doctor/treatment` | - | Prescriptions, plans, herbs, safety | Medium |
| **Schedule** | 📅 | `/doctor/schedule` | - | Calendar, appointments, follow-ups | Medium |
| **Communication** | 💬 | `/doctor/communication` | 🔵 | Messages, notes, consultations | Low |
| **Analytics** | 📊 | `/doctor/analytics` | - | Stats, trends, quality metrics | Low |
| **Settings** | ⚙️ | `/doctor/settings` | - | Profile, preferences, notifications | Low |

---

## Implementation Priority

### Phase 1 (Core Navigation)
1. Dashboard
2. Critical (Safety Alerts, Review Queue)
3. Patients (List, Profile)
4. Reports (All Reports, Pending Review)

### Phase 2 (Clinical Tools)
5. Diagnosis (New, History)
6. Treatment (Prescriptions, Safety Checker)
7. Schedule (Calendar, Appointments)

### Phase 3 (Communication & Analytics)
8. Communication (Messages, Notes)
9. Analytics (Practice Stats, Quality Metrics)
10. Settings (Profile, Preferences)

---

## Mobile Navigation

For mobile devices, the navigation should:
- Collapse to a hamburger menu
- Show only active section
- Bottom navigation bar for quick access to:
  - Dashboard
  - Critical (with badge)
  - Patients
  - Messages (with badge)
  - More (settings, etc.)

---

## Notes

- All routes should be protected with doctor role authentication
- Badge counts should update in real-time
- Navigation should persist state (remember last visited section)
- Breadcrumbs should show current location
- Each section should have a "Help" button linking to documentation

---

**Last Updated**: December 2024  
**Version**: 1.0


