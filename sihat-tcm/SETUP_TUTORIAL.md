# 🏁 Sihat TCM - Setup & Quick Start Guide

Welcome to the **Sihat TCM** project! This guide will help you download the code, get it running on your local machine, and make your first edit.

## 1. Get Access & Download Code

1.  **Accept the Invitation**:
    *   Click this link: [https://github.com/wenjyue84/sihat-tcm/invitations](https://github.com/wenjyue84/sihat-tcm/invitations)
    *   Accept the invitation to join the repository.

2.  **Clone the Repository**:
    *   Open your terminal (Command Prompt, PowerShell, or Terminal in VS Code).
    *   Navigate to the folder where you want to keep your projects (e.g., `cd Desktop/Projects`).
    *   Run the following command to download the code:
        ```bash
        git clone https://github.com/wenjyue84/sihat-tcm.git
        ```
    *   Enter the project folder:
        ```bash
        cd sihat-tcm
        ```

## 2. Install Dependencies

Before running the app, you need to install the software libraries it relies on.
*   Run the following command in your terminal:
    ```bash
    npm install
    ```

## 3. Configure Environment Variables

The app needs some secret keys to work (like connecting to the AI and Database).

1.  Create a new file in the root folder named `.env.local`.
2.  Copy and paste the following template into it:
    ```env
    GOOGLE_GENERATIVE_AI_API_KEY=YOUR_KEY_HERE
    NEXT_PUBLIC_SUPABASE_URL=YOUR_URL_HERE
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY_HERE
    ```
3.  **Ask Jyue** for the actual values to fill in above. Save the file.

## 4. Run the Application

Now you are ready to start the system!

1.  Run the development server:
    ```bash
    npm run dev
    ```
2.  You should see text saying `Reference: http://localhost:3000` (or similar).
3.  Open your web browser and go to [http://localhost:3000](http://localhost:3000).
4.  You should see the Sihat TCM homepage! 🎉

## 5. How to Edit (Your First Task)

To get comfortable, let's try making a small change.

1.  **Open the Project in VS Code**:
    *   If you haven't already, run `code .` in your terminal or open the folder via "File > Open Folder".

2.  **Find the Footer**:
    *   Navigate to the file: `src/components/Footer.tsx`.

3.  **Make a Change**:
    *   Look for the text that says "Sihat TCM".
    *   Change it to something else, like "Sihat TCM (Dev Mode)".
    *   Save the file (`Ctrl + S`).

4.  **See the Result**:
    *   Go back to your browser. The page should automatically update to show your change!

---
**Need Help?**
If you get stuck, check the `DEVELOPER_MANUAL.md` or ask the team. Happy coding!
