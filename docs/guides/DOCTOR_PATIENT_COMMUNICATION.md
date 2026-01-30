# Doctor-Patient Communication Feature

## Overview
This feature enables direct communication between patients/guests and doctors through a verification request system. When a patient or guest requests verification, the doctor receives a notification and can chat with them to approve their request.

## Architecture

### Database: `inquiries` Table
Verification requests are stored in the existing `inquiries` table with a special marker:

```javascript
{
  symptoms: "Request for Verification",  // Marker to identify verification requests
  diagnosis_report: {
    type: "verification_request",
    status: "pending" | "active" | "closed",
    messages: [
      {
        role: "user" | "doctor",
        content: "message text",
        timestamp: "ISO 8601 string"
      }
    ],
    patient_profile: {
      name: "Patient Name",
      email: "patient@email.com"
    },
    ai_diagnosis: "...",  // Original AI diagnosis if available
    selected_doctor: {    // Optional - if patient selected specific doctor
      id: "doctor_id",
      name: "Dr. Name",
      clinic_name: "Clinic Name"
    },
    requested_at: "ISO 8601 string"
  },
  notes: "Additional notes"
}
```

## Flow

### 1. Patient/Guest Initiates Request
**Location**: Mobile App or Web Patient Portal

- **Mobile**: `DoctorVerificationModal.js`
  - User clicks "Request for Verification" button
  - Modal shows list of available TCM practitioners
  - User selects a doctor (optional - can choose "Any Available")
  - Confirms and sends request
  - Request is created in Supabase `inquiries` table

- **Web**: `PatientCommunication.tsx` component
  - Accessed via "Communication" tab in patient dashboard
  - Click "Request Verification" button
  - Request is created automatically
  - UI shows "Pending" status until doctor responds

### 2. Doctor Receives Notification
**Location**: Web Doctor Portal - `src/app/doctor/communication/page.tsx`

- Doctor navigates to "Patient Communication" tab
- All pending verification requests appear in the inbox
- Each request shows:
  - Patient name
  - Request timestamp
  - Status badge (Pending/Active)
  - Unread indicator

### 3. Doctor Responds
**Location**: Web Doctor Portal

- Doctor clicks on a pending request
- Views patient information and request details
- Types a reply message
- On sending first message:
  - Chat status changes from "pending" → "active"
  - Patient can now see and reply to messages

### 4. Two-Way Chat
**Both Patient & Doctor can:**
- Send text messages
- View message history in chronological order
- See timestamps for each message
- Real-time updates (with manual refresh or future websocket integration)

## Components

### Mobile App
**File**: `sihat-tcm-mobile/components/DoctorVerificationModal.js`

Key features:
- Glassmorphic design
- Fetches practitioners from `tcm_practitioners` table
- Fallback to mock data if table is empty
- Creates verification request in Supabase
- 3-step flow: Select → Confirm → Success
- Haptic feedback for interactions

### Web - Patient Portal
**File**: `sihat-tcm-web/src/components/patient/PatientCommunication.tsx`

Key features:
- Lists all user's verification requests
- Shows chat interface for selected request
- Sends messages to doctor
- Status indicators (Pending/Active)
- Auto-scroll to bottom on new messages

**Integration**: Added to `UnifiedDashboard.tsx` as "Communication" tab in Account section

### Web - Doctor Portal
**File**: `sihat-tcm-web/src/app/doctor/communication/page.tsx`

Key features:
- Inbox view showing all pending/active requests
- Patient details display
- Chat interface with message history
- Send replies to activate chat
- Refresh button to fetch new messages
- Responsive design for mobile/tablet/desktop

## Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Patient   │         │   Supabase   │         │    Doctor    │
│  (Mobile/   │         │  inquiries   │         │   (Web)      │
│    Web)     │         │    Table     │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
       │                       │                         │
       │ 1. Request            │                         │
       │      Verification     │                         │
       ├──────────────────────►│                         │
       │                       │                         │
       │                       │  2. Fetch pending       │
       │                       │     requests            │
       │                       │◄────────────────────────┤
       │                       │                         │
       │                       │  3. Doctor replies      │
       │                       │     (status→active)     │
       │                       │◄────────────────────────┤
       │                       │                         │
       │ 4. Fetch messages     │                         │
       ├──────────────────────►│                         │
       │                       │                         │
       │ 5. Patient replies    │                         │
       ├──────────────────────►│                         │
       │                       │                         │
       │                       │  6. Fetch updates       │
       │                       │◄────────────────────────┤
```

## Usage

### For Patients/Guests

**On Mobile App:**
1. Complete a diagnosis session
2. On the results screen, tap "Request Doctor Verification"
3. Select a doctor from the list (or choose "Any Available")
4. Confirm and send
5. Wait for doctor response
6. Once doctor replies, chat becomes active

**On Web Portal:**
1. Log in to patient dashboard
2. Navigate to "Communication" tab (in Account section)
3. Click "Request Verification" if no active conversations
4. Wait for doctor response in the conversation view

### For Doctors

**On Web Portal:**
1. Log in to doctor dashboard
2. Navigate to "Patient Communication" tab
3. View pending requests in the inbox (marked with red indicator)
4. Click on a request to view details
5. Type a reply to approve and activate the chat
6. Continue conversation with patient

## Status Flow

```
Pending → Active → (Optional: Closed)
```

- **Pending**: Request created, waiting for doctor's first response
- **Active**: Doctor has replied, chat is now two-way
- **Closed**: (Future) Either party closes the conversation

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for instant message delivery
2. **Push Notifications**: Mobile push notifications when doctor responds
3. **File Attachments**: Allow sending images/documents in chat
4. **Voice Messages**: Record and send voice notes
5. **Chat History**: Archive and search past conversations
6. **Multiple Doctors**: Ability to consult multiple doctors on same diagnosis
7. **Rating System**: Patients can rate the verification service
8. **Automated Reminders**: Notify doctor of pending requests after X hours

## Database Requirements

### Existing Table: `inquiries`
- Already supports JSONB `diagnosis_report` column
- No schema changes required
- Uses RLS (Row Level Security) for user-specific data

### Optional Table: `tcm_practitioners`
Used by mobile app to show available doctors:

```sql
CREATE TABLE tcm_practitioners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  photo TEXT,
  clinic_name TEXT,
  specialties TEXT[],
  address TEXT,
  phone TEXT,
  experience TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

### Test Scenario 1: Mobile App Request
1. Open mobile app (guest or logged in)
2. Complete a diagnosis
3. Tap "Request Verification" on results screen
4. Select a doctor
5. Verify request appears in doctor portal
6. Doctor responds
7. Check if chat becomes active on both ends

### Test Scenario 2: Web Patient Request
1. Log in as patient
2. Go to Communication tab
3. Create verification request
4. Log in as doctor
5. Verify request appears in inbox
6. Reply to patient
7. Check bidirectional messaging works

## Notes

- Lint error `circleOfHealth` is unrelated to this feature (pre-existing translation issue)
- RLS policies should ensure users only see their own requests
- Doctors should see all pending/active requests system-wide
