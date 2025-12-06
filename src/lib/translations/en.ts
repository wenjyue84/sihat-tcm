// English translations for Sihat TCM
export const en = {
    // Common
    common: {
        appName: 'Sihat TCM',
        appTagline: 'AI-Powered Traditional Chinese Medicine',
        appDescription: 'Experience the wisdom of ancient healing combined with modern AI technology. Get a personalized diagnosis based on the four pillars of TCM: Inspection, Listening, Inquiry, and Pulse.',
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
        copyright: '© {year} Sihat TCM. All rights reserved.',
        developedBy: 'Developed by Prisma Technology Solution Sdn Bhd',
        companyProfile: 'Company Profile',
    },

    // Language selector
    language: {
        title: 'Language',
        english: 'English',
        chinese: '中文',
        malay: 'Bahasa Malaysia',
        selectLanguage: 'Select Language',
        changeLanguage: 'Change Language',
    },

    // Navigation & Header
    nav: {
        home: 'Home',
        about: 'About',
        login: 'Login / Sign up',
        logout: 'Logout',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        test: 'Test',
    },

    // Login page
    login: {
        title: 'Sihat TCM',
        chineseTitle: '思和中医',
        subtitle: 'Select Your Role',
        chineseSubtitle: '选择登录身份',
        quote: '"上工治未病" — The superior physician prevents illness',
        devMode: 'Development Mode',
        devModeZh: '开发模式',
        balance: 'Balance',
        balanceZh: '平衡',
        harmony: 'Harmony',
        harmonyZh: '和谐',
        roles: {
            patient: {
                title: 'Patient',
                titleZh: '患者',
                description: 'Begin your healing journey',
            },
            doctor: {
                title: 'Physician',
                titleZh: '医师',
                description: 'Practice the ancient art',
            },
            admin: {
                title: 'Administrator',
                titleZh: '管理',
                description: 'Oversee the practice',
            },
        },
    },

    // Basic Info Form
    basicInfo: {
        title: 'Patient Profile',
        subtitle: 'Please provide your basic details to help us diagnose you accurately.',
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter your name',
        gender: 'Gender',
        selectGender: 'Select Gender',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        age: 'Age',
        agePlaceholder: 'Age',
        weight: 'Weight (kg)',
        weightPlaceholder: 'kg',
        height: 'Height (cm)',
        heightPlaceholder: 'cm',
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
            chronic: 'Chronic (ongoing)',
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
        },
        detailedSymptoms: 'Detailed Symptoms / Concerns',
        detailedSymptomsPlaceholder: 'Please describe your main complaints, feelings, and any other relevant details...',
        chooseTcmDoctor: 'Choose Your TCM Doctor',
        startDiagnosis: 'Start Diagnosis',
    },

    // Doctor levels
    doctorLevels: {
        physician: {
            name: 'Physician',
            nameZh: '医师',
            description: 'Standard consultation for common ailments',
        },
        seniorPhysician: {
            name: 'Senior Physician',
            nameZh: '主任医师',
            description: 'Advanced consultation with deeper analysis',
        },
        masterPhysician: {
            name: 'Master Physician',
            nameZh: '国医大师',
            description: 'Expert consultation with comprehensive insights',
        },
    },

    // Diagnosis Wizard Steps
    steps: {
        basics: 'Basics',
        inquiry: 'Inquiry',
        tongue: 'Tongue',
        face: 'Face',
        audio: 'Audio',
        pulse: 'Pulse',
        bodyPart: 'Body Part',
    },

    // Inquiry Step
    inquiry: {
        title: 'TCM Inquiry (问诊)',
        subtitle: 'Our AI physician will ask you questions based on your symptoms.',
        chatTitle: 'Chat with TCM Doctor',
        chatDescription: 'Answer the doctor\'s questions to help with your diagnosis.',
        inputPlaceholder: 'Type your answer...',
        send: 'Send',
        finishChat: 'Finish Consultation',
        endChat: 'End Chat',
        startingConversation: 'Starting conversation...',
        doctorThinking: 'Doctor is thinking...',
        consultationComplete: 'Consultation Complete',
        consultationCompleteDesc: 'Thank you for answering the questions. Click below to proceed to the next step.',
        proceedToNext: 'Proceed to Next Step',
        aiQuestion: 'AI Doctor',
        yourAnswer: 'You',
    },

    // Camera Capture
    camera: {
        takePhoto: 'Take Photo',
        retake: 'Retake',
        usePhoto: 'Use Photo',
        switchCamera: 'Switch Camera',
        uploadPhoto: 'Upload Photo',
        dragDropPhoto: 'Drag & drop an image here',
        orClickToUpload: 'or click to upload',
        cameraAccessDenied: 'Camera access denied',
        cameraNotFound: 'No camera found',
        preparingCamera: 'Preparing camera...',
    },

    // Tongue diagnosis
    tongue: {
        title: 'Tongue Diagnosis (舌诊)',
        subtitle: 'Capture or upload a photo of your tongue for analysis.',
        instructions: 'Please stick out your tongue and take a clear photo.',
        tips: [
            'Use natural lighting',
            'Avoid eating or drinking 30 minutes before',
            'Relax your tongue naturally',
        ],
        analyzing: 'Analyzing tongue...',
        analysisComplete: 'Tongue analysis complete',
        noObservation: 'No tongue observation recorded',
    },

    // Face diagnosis
    face: {
        title: 'Face Diagnosis (面诊)',
        subtitle: 'Capture or upload a photo of your face for analysis.',
        instructions: 'Please take a clear front-facing photo of your face.',
        tips: [
            'Use natural lighting',
            'Remove makeup if possible',
            'Maintain neutral expression',
        ],
        analyzing: 'Analyzing face...',
        analysisComplete: 'Face analysis complete',
        noObservation: 'No face observation recorded',
    },

    // Body part diagnosis
    bodyPart: {
        title: 'Body Area Examination',
        subtitle: 'Capture or upload a photo of the affected body area.',
        instructions: 'Please take a clear photo of the specific area you want examined.',
        tips: [
            'Use good lighting',
            'Focus on the specific area',
            'Include surrounding area for context',
        ],
        analyzing: 'Analyzing body area...',
        analysisComplete: 'Body area analysis complete',
        noObservation: 'No body area observation recorded',
        selectArea: 'Select Body Area',
    },

    // Audio recording
    audio: {
        title: 'Voice Analysis (闻诊)',
        subtitle: 'Record your voice reading the text below for analysis.',
        instructions: 'Please read the following passage clearly:',
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        recordAgain: 'Record Again',
        playRecording: 'Play Recording',
        pausePlayback: 'Pause',
        recording: 'Recording...',
        recorded: 'Recorded',
        noRecording: 'No recording yet',
        readingPassage: 'The morning sun rises over the mountains, bringing warmth and light to the valley below. Birds sing their songs as the gentle breeze carries the fragrance of spring flowers.',
        readingPassageZh: '晨曦初升，阳光洒满山间，温暖的光芒照亮了山下的村庄。鸟儿欢唱，微风轻拂，春花的芬芳弥漫在空气中。',
    },

    // Pulse check
    pulse: {
        title: 'Pulse Measurement (切诊)',
        subtitle: 'Measure your pulse to complete your diagnosis.',
        instructions: 'Place your finger on your wrist and count your pulse for 30 seconds.',
        bpm: 'BPM',
        bpmLabel: 'Beats Per Minute',
        inputBpm: 'Enter your pulse rate',
        measuring: 'Measuring...',
        measured: 'Pulse measured',
        noMeasurement: 'No pulse measurement',
        manualEntry: 'Manual Entry',
        useDevice: 'Use Device',
        startMeasurement: 'Start Measurement',
        normalRange: 'Normal range: 60-100 BPM',
        pulseCategories: {
            slow: 'Slow (Bradycardia)',
            normal: 'Normal',
            fast: 'Fast (Tachycardia)',
        },
    },

    // Image Analysis
    imageAnalysis: {
        analyzing: 'Analyzing image...',
        processingWithAI: 'Processing with AI...',
        tryingDifferentModel: 'Trying a different analysis method...',
        analysisComplete: 'Analysis complete',
        analysisFailed: 'Analysis failed',
        retryAnalysis: 'Retry Analysis',
        skipAnalysis: 'Skip & Continue',
        waitingForAnalysis: 'Please wait while we analyze your image...',
        tips: [
            'Clear, focused images provide better results',
            'Good lighting helps the AI analyze more accurately',
            'Analysis typically takes 10-30 seconds',
        ],
        confidence: 'Confidence',
        invalidImage: 'Invalid or unclear image',
        pleaseRetake: 'Please retake the photo with better lighting and focus.',
    },

    // Diagnosis Report
    report: {
        title: 'TCM Diagnosis Report',
        generatedOn: 'Generated on',
        patientInfo: 'Patient Information',
        name: 'Name',
        age: 'Age',
        gender: 'Gender',
        weight: 'Weight',
        height: 'Height',
        bmi: 'BMI',
        symptoms: 'Reported Symptoms',
        duration: 'Duration',

        // Four pillars
        fourPillars: 'Four Pillars of Diagnosis',
        wang: 'Looking (望)',
        wangDesc: 'Visual Observation',
        wen: 'Listening/Smelling (闻)',
        wenDesc: 'Audio & Olfactory',
        wen2: 'Inquiry (问)',
        wen2Desc: 'Questioning',
        qie: 'Palpation (切)',
        qieDesc: 'Pulse Taking',

        // TCM analysis
        tcmDiagnosis: 'TCM Diagnosis',
        constitution: 'Constitution Type',
        patternDifferentiation: 'Pattern Differentiation',
        rootCause: 'Root Cause Analysis',

        // Recommendations
        recommendations: 'Recommendations',
        dietaryAdvice: 'Dietary Advice',
        foodsToEat: 'Foods to Eat',
        foodsToAvoid: 'Foods to Avoid',
        lifestyle: 'Lifestyle Suggestions',
        herbalSuggestions: 'Herbal Suggestions',
        acupuncture: 'Acupuncture Points',

        // Actions
        downloadPdf: 'Download PDF',
        printReport: 'Print Report',
        shareReport: 'Share Report',
        saveToHistory: 'Save to History',
        newDiagnosis: 'New Diagnosis',

        // Disclaimer
        disclaimer: 'This report is generated by AI for reference purposes only. Please consult a licensed TCM practitioner for professional medical advice.',
    },

    // Analysis loading screen
    analysisLoading: {
        title: 'Analyzing Your Health Profile',
        subtitle: 'Our AI is processing your information using traditional Chinese medicine principles.',
        steps: [
            'Collecting patient data...',
            'Analyzing symptoms...',
            'Processing visual observations...',
            'Evaluating pulse data...',
            'Identifying patterns...',
            'Generating diagnosis...',
            'Preparing recommendations...',
            'Finalizing report...',
        ],
        tips: [
            'TCM diagnosis considers the whole person, not just symptoms',
            'The Five Elements (五行) relate organs to seasons and emotions',
            'Qi (气) is the vital life force that flows through meridians',
            'Yin and Yang balance is essential for good health',
            'Diet and lifestyle are key pillars of TCM wellness',
        ],
        almostDone: 'Almost done...',
        pleaseWait: 'Please wait while we complete your analysis',
    },

    // Dashboard - Patient
    patientDashboard: {
        title: 'Patient Dashboard',
        welcome: 'Welcome',
        startNewDiagnosis: 'Start New Diagnosis',
        myInquiries: 'My Inquiries',
        viewHistory: 'View History',
        noInquiries: 'No diagnosis history yet',
        noInquiriesDesc: 'Start your first TCM diagnosis to see your health journey here.',
        recentDiagnosis: 'Recent Diagnosis',
        viewReport: 'View Report',
    },

    // Dashboard - Doctor
    doctorDashboard: {
        title: 'Doctor Dashboard',
        welcome: 'Welcome, Dr.',
        patientHistory: 'Patient History',
        searchPatients: 'Search Patients',
        totalPatients: 'Total Patients',
        totalInquiries: 'Total Inquiries',
        recentPatients: 'Recent Patients',
        viewDetails: 'View Details',
        noPatients: 'No patient records yet',
        filters: {
            dateFrom: 'From Date',
            dateTo: 'To Date',
            patientName: 'Patient Name',
            symptoms: 'Symptoms',
            search: 'Search',
            reset: 'Reset',
        },
    },

    // Dashboard - Admin
    adminDashboard: {
        title: 'Admin Dashboard',
        welcome: 'Welcome, Administrator',
        systemPrompts: 'System Prompts',
        userManagement: 'User Management',
        settings: 'Settings',
        saveChanges: 'Save Changes',
        promptSaved: 'Prompt saved successfully',
        promptSaveFailed: 'Failed to save prompt',
        doctorLevel: 'Doctor Level',
        defaultLevel: 'Default Level',
        chatPrompt: 'Chat Prompt',
        imageAnalysisPrompt: 'Image Analysis Prompt',
        finalAnalysisPrompt: 'Final Analysis Prompt',
    },

    // Observation Result
    observation: {
        title: 'Observation Result',
        noObservation: 'No observation recorded',
        pendingAnalysis: 'Analysis pending...',
        confidence: 'Confidence',
        potentialIssues: 'Potential Indications',
        viewDetails: 'View Details',
        hideDetails: 'Hide Details',
    },

    // Errors and Warnings
    errors: {
        genericError: 'Something went wrong. Please try again.',
        networkError: 'Network error. Please check your connection.',
        sessionExpired: 'Session expired. Please log in again.',
        unauthorized: 'You are not authorized to access this page.',
        notFound: 'Page not found.',
        serverError: 'Server error. Please try again later.',
        validationError: 'Please check your input and try again.',
        requiredField: 'This field is required',
        invalidEmail: 'Please enter a valid email address',
        invalidAge: 'Please enter a valid age',
        fileTooBig: 'File is too large. Maximum size is {size}MB.',
        unsupportedFormat: 'Unsupported file format',
        cameraError: 'Camera error. Please try again.',
        microphoneError: 'Microphone error. Please try again.',
        analysisError: 'Analysis failed. Please retry.',
    },

    // Success messages
    success: {
        saved: 'Saved successfully',
        updated: 'Updated successfully',
        deleted: 'Deleted successfully',
        copied: 'Copied to clipboard',
        downloaded: 'Downloaded successfully',
        uploaded: 'Uploaded successfully',
        sent: 'Sent successfully',
    },

    // Confirmation dialogs
    confirm: {
        delete: 'Are you sure you want to delete this?',
        logout: 'Are you sure you want to log out?',
        discard: 'Are you sure you want to discard changes?',
        leave: 'Are you sure you want to leave? Unsaved changes will be lost.',
    },
};

export type TranslationKeys = typeof en;
