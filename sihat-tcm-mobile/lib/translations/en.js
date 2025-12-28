/**
 * English Translations for Sihat TCM Mobile
 * 
 * Adapted from web app translations with mobile-specific optimizations.
 * Shorter strings where appropriate for mobile UI constraints.
 */

export const en = {
    // Language code for PDF generation
    langCode: 'en',

    // Common UI strings
    common: {
        appName: 'Sihat TCM',
        appTagline: 'AI-Powered TCM',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        save: 'Save',
        cancel: 'Cancel',
        submit: 'Submit',
        next: 'Next',
        previous: 'Previous',
        back: 'Back',
        continue: 'Continue',
        skip: 'Skip',
        close: 'Close',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        search: 'Search',
        filter: 'Filter',
        reset: 'Reset',
        retry: 'Retry',
        yes: 'Yes',
        no: 'No',
        or: 'or',
        and: 'and',
        all: 'All',
        none: 'None',
        required: 'Required',
        optional: 'Optional',
        done: 'Done',
        select: 'Select',
        selected: 'Selected',
        filled: 'Filled!',
        analyzing: 'Analyzing...',
    },

    // Language selector
    language: {
        title: 'Language',
        selectLanguage: 'Select Language',
        changeLanguage: 'Change Language',
        english: 'English',
        chinese: '中文',
        malay: 'Bahasa Malaysia',
    },

    // Navigation
    nav: {
        home: 'Home',
        history: 'History',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
    },

    // Login & Auth
    login: {
        title: 'Sihat TCM',
        chineseTitle: '思和中医',
        subtitle: 'Select Your Role',
        welcome: 'Welcome Back',
        email: 'Email',
        password: 'Password',
        fullName: 'Full Name',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        orContinueWith: 'Or continue with',
        google: 'Google',
        apple: 'Apple',
        biometric: 'Face ID / Fingerprint',
        forgotPassword: 'Forgot Password?',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        quickAccess: 'Quick Access (Demo)',
        roles: {
            patient: 'Patient',
            doctor: 'Doctor',
            admin: 'Admin',
            developer: 'Developer',
        },
        roleDescriptions: {
            patient: 'Begin your healing journey',
            doctor: 'Practice the ancient art',
            admin: 'Oversee the practice',
        },
    },

    // Basic Info Form
    basicInfo: {
        title: 'Patient Profile',
        subtitle: 'Tell us about yourself',
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter your name',
        gender: 'Gender',
        selectGender: 'Select Gender',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        age: 'Age',
        agePlaceholder: 'Your age',
        weight: 'Weight (kg)',
        weightPlaceholder: 'kg',
        height: 'Height (cm)',
        heightPlaceholder: 'cm',
        bmi: 'BMI',
        bmiCategories: {
            underweight: 'Underweight',
            normal: 'Normal',
            overweight: 'Overweight',
            obese: 'Obese',
        },
        bmiExplanation: {
            title: 'Your BMI',
            description: 'Body Mass Index (BMI) is a measure of body fat based on your height and weight.',
            yourBmi: 'Your BMI',
            howItIsCalculated: 'How is it calculated?',
            underweight: 'Underweight',
            normal: 'Normal',
            overweight: 'Overweight',
            obese: 'Obese',
        },
        mainConcern: 'Main Complaint',
        mainConcernPlaceholder: 'Describe your main concern...',
        otherSymptoms: 'Other Symptoms',
        otherSymptomsPlaceholder: 'Any additional symptoms...',
        duration: 'Duration',
        durationPlaceholder: 'How long?',
        durationOptions: {
            lessThan1Day: 'Less than 1 day',
            '1-3days': '1-3 days',
            '4-7days': '4-7 days',
            '1-2weeks': '1-2 weeks',
            '2-4weeks': '2-4 weeks',
            '1-3months': '1-3 months',
            '3-6months': '3-6 months',
            '6-12months': '6-12 months',
            over1Year: 'Over 1 year',
            chronic: 'Chronic',
        },
        commonSymptoms: 'Common Symptoms',
        symptoms: {
            fever: 'Fever',
            cough: 'Cough',
            headache: 'Headache',
            fatigue: 'Fatigue',
            stomachPain: 'Stomach Pain',
            soreThroat: 'Sore Throat',
            shortnessOfBreath: 'Shortness of Breath',
            highBloodPressure: 'High Blood Pressure',
            diabetes: 'Diabetes',
            insomnia: 'Insomnia',
            anxiety: 'Anxiety',
            backPain: 'Back Pain',
        },
    },

    // Symptoms Step
    symptoms: {
        title: 'Symptoms',
        subtitle: 'Select your symptoms',
        searchPlaceholder: 'Search symptoms...',
        selectedSymptoms: 'Selected Symptoms',
        noSymptomsSelected: 'No symptoms selected',
        tapToRemove: 'Tap to remove',
    },

    // Choose Doctor
    chooseDoctor: {
        title: 'Choose Your Doctor',
        subtitle: 'Select consultation level',
        physician: {
            name: 'Doctor',
            nameZh: '医师',
            description: 'Standard consultation',
        },
        seniorPhysician: {
            name: 'Senior Doctor',
            nameZh: '主任医师',
            description: 'Advanced analysis',
        },
        masterPhysician: {
            name: 'TCM Master',
            nameZh: '国医大师',
            description: 'Expert consultation',
        },
    },

    // Diagnosis Steps
    steps: {
        welcome: 'Welcome',
        basicInfo: 'Basic Info',
        symptoms: 'Symptoms',
        chooseDoctor: 'Doctor',
        uploadDocuments: 'Documents',
        uploadMedicine: 'Medicine',
        inquiry: 'Inquiry',
        tongue: 'Tongue',
        face: 'Face',
        audio: 'Voice',
        pulse: 'Pulse',
        smartConnect: 'Devices',
        analysis: 'Analysis',
        results: 'Results',
    },

    // Welcome Step
    welcome: {
        title: 'Welcome to Sihat TCM',
        subtitle: 'AI-Powered Traditional Chinese Medicine',
        description: 'Experience the wisdom of ancient healing combined with modern AI technology.',
        startDiagnosis: 'Start Diagnosis',
        features: {
            fourPillars: 'Four Pillars Diagnosis',
            aiAnalysis: 'AI-Powered Analysis',
            personalized: 'Personalized Advice',
        },
    },

    // Upload Reports
    uploadDocuments: {
        title: 'Documents',
        subtitle: 'Medical documents',
        uploadButton: 'Upload Document',
        takePhoto: 'Take Photo',
        chooseFromLibrary: 'Choose from Library',
        noFilesYet: 'No files uploaded yet',
        analyzing: 'Analyzing document...',
        analysisComplete: 'Analysis complete',
        removeFile: 'Remove',
        supportedFormats: 'PDF, JPG, PNG supported',
        optional: 'Optional',
    },

    // Upload Medicine
    uploadMedicine: {
        title: 'Current Medications',
        subtitle: 'Upload photos of your medicines',
        uploadButton: 'Add Medicine Photo',
        noMedicinesYet: 'No medicines added yet',
        analyzing: 'Identifying medicine...',
        identifiedAs: 'Identified as',
        optional: 'Optional',
    },

    // Inquiry Step
    inquiry: {
        title: 'TCM Inquiry',
        titleZh: '问诊',
        subtitle: 'Chat with AI Doctor',
        chatTitle: 'Health Consultation',
        inputPlaceholder: 'Type your answer...',
        send: 'Send',
        doctorThinking: 'Doctor is thinking...',
        finishChat: 'Finish Consultation',
        consultationComplete: 'Consultation Complete',
        proceedToNext: 'Continue',
        quickReplies: {
            yes: 'Yes',
            no: 'No',
            sometimes: 'Sometimes',
            notSure: 'Not sure',
        },
    },

    // Tongue Diagnosis
    tongue: {
        title: 'Tongue Diagnosis',
        titleZh: '舌诊',
        subtitle: 'Capture your tongue for analysis',
        instructions: 'Stick out your tongue and take a clear photo',
        tips: [
            'Use natural lighting',
            'Avoid eating 30 min before',
            'Relax your tongue naturally',
        ],
        takePhoto: 'Take Photo',
        retake: 'Retake',
        analyzing: 'Analyzing tongue...',
        analysisComplete: 'Analysis complete',
        skip: 'Skip',
    },

    // Face Diagnosis
    face: {
        title: 'Face Diagnosis',
        titleZh: '面诊',
        subtitle: 'Capture your face for analysis',
        instructions: 'Take a front-facing photo',
        tips: [
            'Use natural lighting',
            'Remove makeup if possible',
            'Neutral expression',
        ],
        takePhoto: 'Take Photo',
        retake: 'Retake',
        analyzing: 'Analyzing face...',
        analysisComplete: 'Analysis complete',
        skip: 'Skip',
    },

    // Audio/Voice Diagnosis
    audio: {
        title: 'Voice Analysis',
        titleZh: '闻诊',
        subtitle: 'Record your voice for analysis',
        instructions: 'Say "Ahhh" for 5-10 seconds',
        startRecording: 'Start Recording',
        stopRecording: 'Stop',
        recording: 'Recording...',
        recordAgain: 'Record Again',
        analyzing: 'Analyzing voice...',
        analysisComplete: 'Analysis complete',
        tips: [
            'Find a quiet place',
            'Speak naturally',
            'Hold phone steady',
        ],
        skip: 'Skip',
        permissionDenied: 'Microphone access denied',
        enableMicrophone: 'Please enable microphone in settings',
    },

    // Pulse Diagnosis
    pulse: {
        title: 'Pulse Check',
        titleZh: '切诊',
        subtitle: 'Measure your pulse rate',
        bpm: 'BPM',
        bpmLabel: 'Beats Per Minute',
        enterBpm: 'Enter BPM',
        manualEntry: 'Manual Entry',
        tapToMeasure: 'Tap to Measure',
        guideTitle: 'How to Measure',
        guideSteps: [
            { title: 'Find Pulse Point', desc: 'Place fingers on wrist below thumb' },
            { title: 'Feel the Beat', desc: 'Press gently until you feel the pulse' },
            { title: 'Count Beats', desc: 'Count for 60 seconds' },
        ],
        normalRange: 'Normal: 60-100 BPM',
        categories: {
            low: 'Low',
            normal: 'Normal',
            high: 'High',
        },
        tcmQualities: 'TCM Pulse Qualities',
        tcmQualitiesDesc: 'Optional - For TCM practitioners',
        pulseTypes: {
            hua: { name: 'Slippery', zh: '滑脉' },
            se: { name: 'Rough', zh: '涩脉' },
            xian: { name: 'Wiry', zh: '弦脉' },
            jin: { name: 'Tight', zh: '紧脉' },
            xi: { name: 'Thin', zh: '细脉' },
            hong: { name: 'Surging', zh: '洪脉' },
            ruo: { name: 'Weak', zh: '弱脉' },
            chen: { name: 'Deep', zh: '沉脉' },
            fu: { name: 'Floating', zh: '浮脉' },
            chi: { name: 'Slow', zh: '迟脉' },
            shuo: { name: 'Rapid', zh: '数脉' },
            normal: { name: 'Normal', zh: '平脉' },
        },
        // Camera PPG Measurement
        measureWithCamera: 'Measure with Camera',
        cameraMeasurement: {
            title: 'Measuring Heart Rate',
            placeFingerInstruction: 'Place your finger over the camera lens',
            coverFlash: 'Cover the flash completely with your fingertip',
            holdStill: 'Hold still for 10 seconds',
            detectingPulse: 'Detecting pulse...',
            signalQuality: 'Signal Quality',
            weak: 'Weak',
            good: 'Good',
            excellent: 'Excellent',
            stable: 'Stable',
            useThisReading: 'Use This Reading',
            flashUnavailable: 'Flash unavailable',
            initializing: 'Initializing camera...',
            pressFingerHarder: 'Press finger harder',
            detected: 'Detected!',
            permissionRequired: 'Camera permission required',
            grantPermission: 'Grant Permission',
        },
    },

    // Smart Connect
    smartConnect: {
        title: 'Smart Connect',
        subtitle: 'Connect health devices',
        description: 'Import data from smart devices',
        pulseRate: 'Pulse Rate',
        bloodPressure: 'Blood Pressure',
        bloodOxygen: 'Blood Oxygen',
        temperature: 'Temperature',
        connect: 'Connect',
        connected: 'Connected',
        importHealth: 'Import Health Data',
        healthApps: 'Health Apps',
        samsung: 'Samsung Health',
        apple: 'Apple Health',
        google: 'Google Fit',
        skip: 'Skip',
        metricsConnected: 'Metrics Connected',
        dataTypes: {
            steps: 'Steps',
            sleep: 'Sleep',
            heartRate: 'Avg HR',
            activity: 'Activity',
            stress: 'Stress',
        },
    },

    // Analysis Loading
    analysis: {
        title: 'Analyzing...',
        subtitle: 'AI is synthesizing your health data',
        pleaseWait: 'This may take a moment',
        steps: [
            'Collecting data...',
            'Analyzing symptoms...',
            'Processing observations...',
            'Generating diagnosis...',
            'Preparing recommendations...',
        ],
        didYouKnow: 'Did you know?',
        facts: [
            'TCM has been practiced for over 2,000 years',
            'The tongue reveals internal organ health',
            'Pulse diagnosis can detect 28 different qualities',
            'Balance of Yin and Yang is essential for health',
        ],
    },

    // Results / Report
    report: {
        title: 'Diagnosis Report',
        generatedOn: 'Generated on',
        patientInfo: 'Patient Info',
        constitution: 'Constitution',
        diagnosis: 'Diagnosis',
        recommendations: 'Recommendations',
        dietaryAdvice: 'Dietary Advice',
        foodsToEat: 'Foods to Eat',
        foodsToAvoid: 'Foods to Avoid',
        lifestyle: 'Lifestyle',
        herbalFormula: 'Herbal Formula',
        acupoints: 'Acupoints',
        share: 'Share',
        saveToHistory: 'Save to History',
        newDiagnosis: 'New Diagnosis',
        askQuestion: 'Ask a Question',
        chatAboutReport: 'Chat About Report',
        disclaimer: 'This report is for reference only. Please consult a licensed TCM practitioner for medical advice.',
        sections: {
            overview: 'Overview',
            tcmAnalysis: 'TCM Analysis',
            dietary: 'Dietary',
            lifestyle: 'Lifestyle',
            treatment: 'Treatment',
        },
        pdf: {
            download: 'PDF',
            generating: 'Creating PDF...',
            success: 'PDF created successfully',
            error: 'Failed to create PDF',
        },
    },

    // Report Chat
    reportChat: {
        title: 'Ask About Your Report',
        subtitle: 'AI-powered TCM assistant',
        inputPlaceholder: 'Ask about your diagnosis...',
        suggestions: [
            'What does my diagnosis mean?',
            'Why avoid certain foods?',
            'How can I improve?',
            'Explain the acupoints',
        ],
    },

    // Dashboard
    dashboard: {
        greeting: {
            morning: 'Good Morning',
            afternoon: 'Good Afternoon',
            evening: 'Good Evening',
        },
        welcome: 'Welcome',
        startDiagnosis: 'Start Diagnosis',
        recentHistory: 'Recent History',
        viewAll: 'View All',
        noHistory: 'No diagnosis history yet',
        noHistoryDesc: 'Start your first TCM diagnosis',
        tabs: {
            home: 'Home',
            history: 'History',
            documents: 'Documents',
            profile: 'Profile',
        },
    },

    // Documents
    documents: {
        title: 'Your Documents',
        subtitle: 'Access your uploaded medical records',
        noRecords: 'No documents uploaded yet',
        upload: 'Upload Document',
        deleteConfirm: 'Are you sure you want to delete this document?',
    },

    // History
    history: {
        title: 'History',
        subtitle: 'Your diagnosis records',
        noRecords: 'No records yet',
        viewReport: 'View Report',
        deleteRecord: 'Delete',
        confirmDelete: 'Delete this record?',
    },

    // View Report Screen
    viewReport: {
        title: 'View Report',
        noReport: 'No report to display',
        share: 'Share',
        sharing: 'Sharing...',
        shareSuccess: 'Report shared successfully',
        shareError: 'Failed to share report',
        medicalReport: 'Medical Report',
        generatedBy: 'Generated by Sihat TCM',
    },

    // Profile
    profile: {
        title: 'Profile',
        personalInfo: 'Personal Information',
        healthInfo: 'Health Information',
        preferences: 'Preferences',
        language: 'Language',
        theme: 'Theme',
        notifications: 'Notifications',
        about: 'About',
        version: 'Version',
        logout: 'Logout',
        confirmLogout: 'Are you sure you want to logout?',
        editProfile: 'Edit Profile',
        saveChanges: 'Save Changes',
    },

    // Errors
    errors: {
        generic: 'Something went wrong',
        network: 'Network error',
        timeout: 'Request timed out',
        unauthorized: 'Please login again',
        notFound: 'Not found',
        tryAgain: 'Try Again',
        goBack: 'Go Back',
        permissionDenied: 'Permission denied',
        cameraError: 'Camera error',
        microphoneError: 'Microphone error',
        analysisError: 'Analysis failed',
    },

    // Success messages
    success: {
        saved: 'Saved successfully',
        updated: 'Updated successfully',
        deleted: 'Deleted successfully',
        copied: 'Copied to clipboard',
        shared: 'Shared successfully',
    },

    // Profile Summary Step
    profileSummary: {
        title: 'Profile Summary',
        subtitle: 'Please confirm your information',
        anonymous: 'Patient',
        yearsOld: 'yrs',
        profileReady: 'Profile information is complete',
        profileIncomplete: 'Please complete your profile',
        missingFields: 'Some information is missing',
        continueToSymptoms: 'Continue to Symptoms',
        completeProfile: 'Complete My Profile',
        editProfile: 'Edit Profile',
        wantToEdit: 'Want to update your profile?',
    },

    // Confirmation dialogs
    confirm: {
        delete: 'Are you sure?',
        logout: 'Logout?',
        discard: 'Discard changes?',
        exitDiagnosis: 'Exit diagnosis? Progress will be lost.',
    },

    // Infographic
    infographic: {
        title: 'Create Infographic',
        subtitle: 'Transform your report into visual content',
        selectStyle: 'Select Style',
        selectContent: 'Select Content',
        generating: 'Generating...',
        generated: 'Infographic Ready!',
        save: 'Save to Photos',
        share: 'Share',
        close: 'Close',
        generate: 'Generate',
        tip: '💡 Infographics are great for sharing with family!',
        error: 'Generation failed. Please try again.',
        saved: 'Saved to Photos!',
        permissionDenied: 'Permission required to save photos',
        styles: {
            modern: 'Modern',
            modernDesc: 'Clean, professional',
            traditional: 'Traditional',
            traditionalDesc: 'Classic TCM aesthetic',
            minimal: 'Minimal',
            minimalDesc: 'Simple, elegant',
            colorful: 'Colorful',
            colorfulDesc: 'Vibrant, engaging',
        },
        content: {
            diagnosis: 'Diagnosis & Constitution',
            dietary: 'Dietary Advice',
            lifestyle: 'Lifestyle Tips',
            acupoints: 'Acupoints',
            exercise: 'Exercise',
            metrics: 'Health Metrics',
        },
    },

    // Doctor Verification
    verification: {
        buttonLabel: 'Verify',
        modalTitle: 'Request Doctor Verification',
        modalSubtitle: 'Have a licensed TCM practitioner review your AI diagnosis',
        selectDoctor: 'Select Practitioner',
        noSelection: 'Skip - Send to Any Available Doctor',
        specialties: 'Specialties',
        experience: 'Experience',
        confirmTitle: 'Confirm Verification Request',
        confirmMessage: 'Your complete diagnosis report will be sent for professional review. You will be notified once verified.',
        sendRequest: 'Send Request',
        cancel: 'Cancel',
        successTitle: 'Request Sent!',
        successMessage: 'Your diagnosis has been sent for verification. You will receive a notification once reviewed.',
        errorTitle: 'Error',
        errorMessage: 'Could not send verification request. Please try again.',
        noPractitioners: 'No practitioners available at this time.',
    },

    // Western Doctor Chat
    westernChat: {
        title: 'Western MD Opinion',
        subtitle: 'Evidence-Based Perspective',
        intro: 'Hello. I am Dr. Smith. I have reviewed your TCM report. From a Western medical perspective, I can help translate these findings into physiological terms and suggest standard evaluations. How can I assist you?',
        placeholder: 'Ask Dr. Smith...',
        error: "I apologize, but I'm having trouble connecting at the moment.",
        questions: {
            opinion: "What is the Western medical view?",
            tests: "What lab tests should I take?",
            science: "Is there scientific backing for this?",
            redFlags: "Are there any warning signs?",
        },
    },
};

