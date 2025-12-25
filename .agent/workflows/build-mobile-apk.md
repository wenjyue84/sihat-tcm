---
description: Build the mobile app APK and deploy it to the web app public folder for direct download
---

This workflow guides you through building the Android APK using Expo and placing it in the web app's public directory.

1.  **Navigate to Mobile Directory**
    ```bash
    cd sihat-tcm-mobile
    ```

2.  **Trigger EAS Build**
    Run the following command to start the build process for Android:
    ```bash
    eas build -p android --profile preview
    ```
    *Note: If you are not logged in, run `eas login` first.*

3.  **Download the APK**
    *   Once the build finishes, EAS will provide a download link.
    *   Download the `.apk` file to your computer.

4.  **Deploy to Web App**
    *   Rename the downloaded file to `sihat-tcm.apk`.
    *   Move the file to the web app's public directory:
        ```bash
        mv path/to/downloaded/file.apk ../sihat-tcm/public/sihat-tcm.apk
        ```
    *   *Windows users:* manually move the file to `sihat-tcm\public\sihat-tcm.apk`.

5.  **Verify**
    *   Start the web app: `cd ../sihat-tcm && npm run dev`.
    *   Go to the landing page explicitly and check the "Direct Download" button in the footer strip.
    *   Clicking it should download the APK.
