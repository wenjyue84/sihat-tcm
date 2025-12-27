# Sihat TCM: AI-Powered Traditional Chinese Medicine System

## Comprehensive System Description

### 1. Executive Summary

**Sihat TCM** is a cutting-edge digital health platform that bridges ancient Traditional Chinese Medicine (TCM) wisdom with modern Artificial Intelligence. By digitizing the four classical diagnostic methods (_望 Wàng, 闻 Wén, 问 Wèn, 切 Qiè_), Sihat TCM provides accessible, personalized, and multi-lingual health consultations to users anytime, anywhere. Built on the powerful **Google Gemini AI** models, the system mimics the reasoning of expert TCM practitioners to deliver holistic health insights, dietary advice, and lifestyle recommendations.

---

### 2. Core Value Proposition

- **Access**: Democratizes access to TCM expertise, overcoming geographical and scheduling barriers.
- **Language Inclusivity**: Breaks down language barriers with native support for **English**, **Chinese (Simplified)**, and **Bahasa Malaysia**.
- **Holistic Health**: Focuses on treating the "root cause" (Ben) rather than just symptoms (Biao), promoting long-term wellness.
- **Standardization**: Uses AI to provide consistent, objective analysis while respecting the nuances of traditional diagnosis.

---

### 3. The "Four Examinations" Digitized

Sihat TCM's core innovation lies in its digital implementation of the traditional diagnostic framework:

#### 👁️ Observation (望 Wàng) - _Computer Vision_

- **Tongue Diagnosis**: Users capture photos of their tongue. The AI analyzes coating color, thickness, body shape, and moisture to identify internal organ states (e.g., Dampness, Heat, Qi Deficiency).
- **Face Diagnosis**: Analyzes facial complexion and specific zones to detect systemic imbalances.
- **Body Part Analysis**: Allows localized inspection of specific issues (e.g., skin conditions like eczema or swelling).
- **Technology**: Uses Gemini Pro Vision capabilities for high-fidelity medical image analysis.

#### 👂 Listening & Smelling (闻 Wén) - _Audio Analysis_

- **Voice Diagnosis**: Records the user's voice to analyze tonal quality (e.g., weak, hoarse, shouting).
- **Respiratory Analysis**: Listens for breathing patterns or cough characteristics.
- **Technology**: WebRTC audio capture processed by multimodal AI models to interpret auditory health markers.

#### 💬 Inquiry (问 Wèn) - _Conversational AI_

- **Smart Chat**: An interactive, knowledgeable chatbot interviews the patient about symptoms, medical history, sleep, appetite, and emotions.
- **Dynamic Questioning**: The AI adapts its questions based on previous answers, similar to a real doctor digging deeper into a problem.
- **Technology**: Large Language Models (LLM) with specialized prompt engineering to emulate TCM reasoning.

#### 👆 Palpation (切 Qiè) - _Interactive & IoT_

- **Pulse Measurement**: An interactive tapping interface allows users to measure their Heart Rate (BPM).
- **Pulse Quality Selection**: Guides users to identify qualitative pulse characteristics (e.g., Slippery, Wiry, Thready) through educational UI.
- **Smart Connect**: Integrates with wearables (via Apple Health/Google Fit APIs) and IoT devices to import objective vitals like SpO2, HRV, and Blood Pressure.

---

### 4. System Architecture

#### Frontend

- **Framework**: **Next.js 16 (App Router)** for a fast, server-rendered React application.
- **UI/UX**: **Tailwind CSS** implementation with a "Nature & Tech" aesthetic (Emerald/Stone color palette), featuring smooth animations (Framer Motion) and responsive design for mobile access.
- **State Management**: Complex "Wizard" pattern (`DiagnosisWizard`) managing multi-step data collection across the 7-stage diagnosis process.

#### Backend & AI

- **AI Engine**: **Google Gemini 2.0 & 1.5** ecosystem.
  - _Master Level_: Uses `gemini-2.5-pro` for deep, complex case synthesis.
  - _Expert Level_: Uses `gemini-2.5-flash` for rapid, efficient analysis.
  - _Physician Level_: Uses `gemini-2.0-flash` for standard checkups.
- **Orchestration**: Vercel AI SDK handles streaming responses and multimodal inputs.
- **Prompt Engineering**: A sophisticated library of System Prompts (`systemPrompts.ts`) defines the "persona" and medical knowledge base for the AI.

#### Data & Infrastructure

- **Database**: **Supabase (PostgreSQL)** for secure user profiles, consultation history, and authentication.
- **Storage**: Secure handling of medical images and audio files.
- **Security**: Role-Based Access Control (RBAC) ensuring data privacy for Patients, Doctors, and Admins.

---

### 5. Key Features

1.  **Doctor Tiers**: Users can choose their AI "Doctor" level (Master, Expert, Physician), mirroring real-world hospital hierarchies.
2.  **Comprehensive Reports**: Generates detailed PDF reports and shareable infographics summarizing the diagnosis.
3.  **Holistic Prescriptions**:
    - **Dietary Therapy**: Food as medicine (e.g., "Eat ginger for Cold patterns").
    - **Herbal Formulas**: Classic TCM prescriptions (e.g., "Gui Pi Tang").
    - **Acupressure**: Self-massage points with location guides.
    - **Lifestyle**: Sleep, exercise (Qigong/Tai Chi), and emotional wellness advice.
4.  **Report Q&A**: After receiving a diagnosis, users can chat with the report to clarify doubts (e.g., "Can I still drink coffee with this condition?").
5.  **Multi-User Roles**:
    - _Patient_: Taking consultations.
    - _Doctor_: Verifying AI reports (Hybrid AI-Human loop).
    - _Admin_: System oversight.

---

### 6. Future Roadmap (JCI CYEA & Beyond)

- **Cloud Integration**: Migration to **AWS** for scalable storage and advanced computing (Proof of Concept targeted for next year).
- **wearable Integration**: Direct Bluetooth connection to smart pulse-taking devices.
- **Community**: A "TCM Social" feature for sharing recovery stories and wellness tips.
- **Telemedicine**: One-click booking with human TCM physicians for verified online consultations.
