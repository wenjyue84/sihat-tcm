# 🧪 Sihat TCM: User Experience Testing Guide for Lene

## 👋 Welcome to the QA Phase!
As part of your onboarding, we want you to use **Sihat TCM** exactly like a real patient would. Your goal is to break things, find confusing UI elements, and suggest improvements.

Please follow the test scenarios below. For each scenario, take notes of:
1.  **Bugs**: Things that produced an error or didn't work.
2.  **UX Friction**: Steps that felt slow, confusing, or unnecessary.
3.  **Visual Glitches**: Misaligned text, weird colors, or broken icons.

---

## 📋 Reporting Template
Create a file named `QA_FINDINGS.md` and use this format to log your feedback:

| Type | Priority | Description | Steps to Reproduce | Suggestion |
|------|----------|-------------|--------------------|------------|
| 🐛 Bug | High | App crashes on Camera step | Click 'Start' > Deny Permission | Handle error gracefully |
| 🎨 UI | Low | 'Next' button color is off | Basic Info Step | Match theme color |
| 🧠 UX | Medium | Pulse check is confusing | Pulse Step | Add an instructional GIF |

---

## 🧪 Test Scenarios

###  Scenario 1: The "First-Time User" (Happy Path)
**Goal**: Complete a full diagnosis without skipping any steps.
**Role**: A 30-year-old user with "mild insomnia".

1.  **Start**: Go to the Homepage and click "Start Consultation".
2.  **Basic Info**: Fill in the form. Try using the sliders.
3.  **Inquiry**:
    *   Chat with the AI. Answer at least 3 questions.
    *   Upload a dummy file when asked for "Medical Reports" (use any image).
4.  **Observation**:
    *   **Tongue/Face**: Use the camera. If you don't have a webcam, use the "Upload" fallback.
    *   Critique the instructions: Are they clear?
5.  **Listening**: Record your voice for 10 seconds.
6.  **Pulse**: Use the "Tap BPM" feature. Try to get a believable heart rate (60-100 BPM).
7.  **Result**: Wait for the report. Read the "Dietary Recommendations".
    *   *Check*: Does the advice match "insomnia"?

### Scenario 2: The "Non-English Speaker"
**Goal**: Test localization and layout stability.

1.  **Switch Language**: Change the app language to **Chinese (中文)** or **Malay (Bahasa)** via the top-right selector.
2.  **Navigation**: Click through the "Basic Info" and "Inquiry" steps again.
    *   *Check*: Is any text cut off?
    *   *Check*: Do the AI questions come in the selected language?
    *   *Check*: Are the buttons translated?

### Scenario 3: The "Edge Case" & Error Handling
**Goal**: Try to break the system.

1.  **Invalid Inputs**:
    *   Enter an age of "150" or "-5".
    *   Enter a weight of "0".
    *   See if the system warns you.
2.  **Hardware Denial**:
    *   When the browser asks for Camera/Microphone permission, click **Block/Deny**.
    *   *Check*: Does the app crash? Does it show a helpful error message? Can you switch to "Upload Mode"?
3.  **Skip Logic**:
    *   Try to skip every optional step (Voice, Pulse, Uploads).
    *   Verify that the Final Report still generates successfully, even with less data.

### Scenario 4: Post-Diagnosis Interaction
**Goal**: Test the Report features.

1.  **PDF Download**: Click "Download Report".
    *   *Check*: Does the PDF open? Is the formatting correct? Does it handle Chinese characters?
2.  **Report Chat**: Use the chat window *inside* the report page.
    *   Ask: "What soup should I drink?"
    *   *Check*: Does the answer reference your specific diagnosis?
3.  **Share**: Click result share button or try to copy the link (if applicable).

### Scenario 5: Mobile Responsiveness
**Goal**: Ensure the app works on phones.

1.  **Dev Tools**: Press `F12` -> Toggle Device Toolbar -> Select "iPhone 12" or "Pixel 5".
2.  **Review**:
    *   Check the Navbar and Footer.
    *   Check the "Pulse Tapping" button size (is it easy to tap?).
    *   Check the Chat window (is the text readable?).

---

## 🕵️‍♂️ Focus Areas for Improvement
While testing, pay special attention to these specific areas for our upcoming competition:

1.  **"Wow" Factor**: Is the design impressive? Where can we add more animations?
2.  **Speed**: Does the AI take too long? Is the "Thinking..." animation engaging enough to make the wait feel shorter?
3.  **Clarity**: Did you ever feel lost? "What do I do next?"

Happy Testing! 🚀
