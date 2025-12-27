# 🎓 Onboarding Plan for Lene - Sihat TCM

Welcome to the **Sihat TCM** team, Lene! 👋

This guide is designed to help you get up to speed with our AI-powered Traditional Chinese Medicine diagnosis platform. We will start with small, manageable tasks and gradually move towards building new features.

Our immediate goal is to prepare for the **JCI CYEA Malaysia competition**, and next year, we aim to apply for an **AWS POC** (Proof of Concept). Your contributions will be vital to these milestones!

---

## 🚀 Phase 1: Environment & Exploration (Days 1-2)

**Goal:** Get the project running and understand the core structure.

1.  **Read the Documentation**:
    - Start with `DEVELOPER_MANUAL.md`. It covers the "Four Examinations" logic, our AI integration, and the project architecture.
    - Review `package.json` to understand our tech stack: **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Google Gemini AI**.

2.  **Setup & Run**:
    - Clone the repository.
    - Run `npm install` to install dependencies.
    - Run `npm run dev` to start the local server.
    - Open `http://localhost:3000` and click through the "Start Diagnosis" flow to see how it works.

3.  **Codebase Tour**:
    - **Pages**: `src/app/` (Check `page.tsx` for the homepage).
    - **Components**: `src/components/` (UI and Diagnosis logic).
    - **Logic**: `src/components/diagnosis/DiagnosisWizard.tsx` is the brain of the app.

---

## 🛠 Phase 2: First Contributions (Days 3-5)

**Goal:** Make small, safe changes to build confidence.

### Task 1: UI Polish (The "Footer" Fix)

**Objective**: Update the footer copyright year or add a small link.

- **File**: `src/components/Footer.tsx`
- **Task**: Change the copyright year to dynamically show the current year (if hardcoded) or add a "Team" link that points to `#`.
- **Skill**: JSX, Tailwind CSS.

### Task 2: Translation Update

**Objective**: Fix a typo or improve a translation.

- **File**: `src/lib/translations/en.ts` (or `zh.ts`)
- **Task**: Find a string (e.g., in the Basic Info form) and change the wording slightly. Verify the change by switching languages in the app.
- **Skill**: i18n structure.

---

## 🏗 Phase 3: Component Basics (Week 2)

**Goal:** Create a new component and use it.

### Task 3: "About Team" Component

**Objective**: Create a reusable static card for team members (for our future "About Us" page for JCI CYEA).

- **New File**: `src/components/ui/TeamMemberCard.tsx`
- **Task**:
  - Create a component that accepts `name`, `role`, and `image` as props.
  - Style it using Tailwind CSS (make it look premium!).
  - Import and display it temporarily on `src/app/page.tsx` to test it.
- **Skill**: React Components, Props, TypeScript interfaces.

---

## 🧠 Phase 4: Logic & State (Week 3)

**Goal:** Interact with the "Diagnosis Wizard" logic.

### Task 4: Add a "Skip" Confirmation

**Objective**: Add a confirmation dialog when skipping a step.

- **Context**: In the diagnosis flow (e.g., Camera or Audio step), there is often a "Skip" button.
- **Task**:
  - Locate the "Skip" button in `src/components/diagnosis/CameraCapture.tsx`.
  - Add a simple browser `confirm("Are you sure?")` check before proceeding.
  - (Bonus) Replace the browser alert with our custom `Dialog` component from `src/components/ui/dialog.tsx`.
- **Skill**: Event handling, State management.

---

## 🌟 Phase 5: Feature Development (Week 4+)

**Goal:** Work on real features for the JCI CYEA competition submission.

### Task 5: Competition Banner

**Objective**: Add a dismissible banner to the homepage announcing our JCI CYEA participation.

- **Files**: `src/app/page.tsx`
- **Task**:
  - Create a `CompetitionBanner` component.
  - Use `useState` to handle the "dismiss" (close) action.
  - Use `useEffect` to remember if the user closed it (using `localStorage`).

### Task 6: AWS POC Prep (Research)

**Objective**: Prepare for cloud integration.

- **Task**: Research how to upload our generated PDF reports to an AWS S3 bucket instead of just downloading them. Write a small plan/doc on how this could be implemented in `src/app/api/upload`.

---

## 💡 Tips for Lene

- **Ask Questions**: The `DEVELOPER_MANUAL.md` is your best friend, but don't hesitate to ask if something is unclear.
- **Test Often**: Use `npm run dev` to see your changes instantly.
- **Follow the Style**: Look at existing components to match the coding style (naming conventions, Tailwind patterns).

Let's build the future of TCM digitization together! 🚀
