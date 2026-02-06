// English translations for Sihat TCM
export const en = {
  // Common
  common: {
    appName: "Sihat TCM",
    name: "Name",
    appTagline: "AI-Powered Traditional Chinese Medicine",
    appDescription:
      "Experience the wisdom of ancient healing combined with modern AI technology. Get a personalized diagnosis based on the four pillars of TCM: Inspection, Listening, Inquiry, and Pulse.",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    noMedicinesFound: "No medicines recorded",
    next: "Next",
    previous: "Previous",
    back: "Back",
    history: "History",
    continue: "Continue",
    skip: "Skip",
    close: "Close",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    search: "Search",
    filter: "Filter",
    reset: "Reset",
    retry: "Retry",
    yes: "Yes",
    no: "No",
    or: "or",
    and: "and",
    all: "All",
    none: "None",
    required: "Required",
    optional: "Optional",
    copyright: "© {year} Sihat TCM. All rights reserved.",
    developedBy: "Developed by Prisma Technology Solution Sdn Bhd",
    companyProfile: "Company Profile",
    filled: "Filled!",
    clear: "Clear",
    cleared: "Cleared!",
  },
  celebration: {
    basics: { title: "Profile Complete!", subtitle: "Great start! Moving to inquiry..." },
    inquiry: {
      title: "Inquiry Complete!",
      subtitle: "Excellent answers! Time for visual diagnosis...",
    },
    tongue: { title: "Tongue Analysis Done!", subtitle: "Perfect! Now let's check your face..." },
    face: { title: "Face Analysis Done!", subtitle: "Looking good! Voice analysis is next..." },
    audio: { title: "Voice Recorded!", subtitle: "Clear audio! Pulse check ahead..." },
    pulse: { title: "Pulse Measured!", subtitle: "Almost there! Connect smart devices..." },
    smartConnect: { title: "Data Connected!", subtitle: "Final review coming up..." },
    summary: { title: "All Set!", subtitle: "Generating your personalized report..." },
  },

  // Language selector
  language: {
    title: "Language",
    english: "English",
    chinese: "中文",
    malay: "Bahasa Malaysia",
    selectLanguage: "Select Language",
    changeLanguage: "Change Language",
  },

  // Navigation & Header
  nav: {
    home: "Home",
    about: "About",
    login: "Login / Sign up",
    logout: "Logout",
    dashboard: "Dashboard",
    profile: "Basic Profile",
    settings: "Settings",
    test: "Test",
    loginShort: "Login",
    dashboardShort: "Dash",
    blog: "Blog",
  },

  // Patient Dashboard
  patientDashboard_v1: {
    welcomeBack: "Welcome back",
    newDiagnosis: "New Diagnosis",
    tabs: {
      healthJourney: "Health Journey",
      mealPlanner: "Meal Planner",
      snoreAnalysis: "Snore Analysis",
      qiDose: "Qi Dose",
      vitalityRhythm: "Vitality Rhythm",
      community: "Healing Garden",
      family: "Family Care",
      profile: "Basic Profile",
      documents: "Documents",
      settings: "Settings",
    },
    navigation: {
      logout: "Logout",
      home: "Home",
      groupAssessment: "Assessment",
      groupTreatment: "Treatment",
      groupCultivation: "Care Hub",
      groupAccount: "Account",
    },
    healthJourney: {
      title: "Health Journey",
      heroTitle: "Your Health Journey",
      startJourneyToday: "Start your journey today",
      noSessionsYet: "No diagnosis sessions yet",
      noSessionsDesc: "Your health journey begins with your first diagnosis.",
      startFirstDiagnosis: "Start First Diagnosis",
      sessionsCount: "{count} {sessionText} • {duration}",
      sessionSingular: "session",
      sessionPlural: "sessions",
      showingCount: "Showing {filtered} of {total} sessions",
      emptyTitle: "Begin Your Journey",
      emptyDesc:
        "Your health journey begins with your first diagnosis. Start tracking your wellness today.",
      startButton: "Start First Diagnosis",
      originMarker: "Your journey began here",
      duration: {
        zero: "0 months",
        lessThanMonth: "Less than a month",
        oneMonth: "1 month",
        months: "{count} months",
      },
      filters: {
        all: "All",
        thisYear: "This Year",
        thisMonth: "This Month",
        sortBy: "Sort by",
        date: "Date",
        score: "Score",
        diagnosis: "Diagnosis",
        ascending: "Ascending",
        descending: "Descending",
      },
      card: {
        viewReport: "View Full Report",
        inquiry: "Inquiry",
        tongue: "Tongue",
        face: "Face",
        voice: "Voice",
        pulse: "Pulse",
      },
      cantFindData: "Can't find your data?",
      restoreMockData: "Restore Data",
    },
    historyTable: {
      good: "Good",
      fair: "Fair",
      needsAttention: "Needs Attention",
      sortByDate: "Date",
      sortByScore: "Score",
      sortByDiagnosis: "Diagnosis",
    },
    documents: {
      deleteConfirm: "Are you sure you want to delete this document?",
    },
    healthPortfolio: {
      title: "Basic Profile",
      personalDetails: "Personal Details",
      healthMetrics: "Health Metrics",
      medicines: {
        title: "Medicines in Use",
        subtitle: "Medicines and supplements you are currently taking.",
        addMedicine: "Add Medicine",
        name: "Medicine / Supplement Name",
        dosage: "Dosage",
        frequency: "Frequency",
        notes: "Notes",
        active: "Currently taking",
        noMedicines:
          "No medicines recorded. Add your current medications to improve your next diagnosis.",
        saveMedicine: "Save Medicine",
        deleteConfirm: "Are you sure you want to remove this medicine?",
      },
      symptomsHistory: {
        title: "Symptoms History",
        subtitle: "A record of symptoms you've reported in past diagnoses.",
        noHistory: "No symptom history yet.",
        lastReported: "Last reported: {date}",
      },
      documents: {
        title: "Medical Reports",
        subtitle: "Your uploaded diagnostic reports and medical documents.",
      },
      useInDiagnosis: {
        title: "Default for Diagnosis",
        description: "These details will be used as default for your next diagnosis assessment.",
      },
    },
  },

  // Login page
  login: {
    title: "Sihat TCM",
    chineseTitle: "思和中医",
    subtitle: "Select Your Role",
    chineseSubtitle: "选择登录身份",
    quote: '"上工治未病" — The superior doctor prevents illness',
    devMode: "Development Mode",
    devModeZh: "开发模式",
    balance: "Balance",
    balanceZh: "平衡",
    harmony: "Harmony",
    harmonyZh: "和谐",
    roles: {
      patient: {
        title: "Patient",
        titleZh: "患者",
        description: "Begin your healing journey",
      },
      doctor: {
        title: "Doctor",
        titleZh: "医师",
        description: "Practice the ancient art",
      },
      admin: {
        title: "Administrator",
        titleZh: "管理",
        description: "Oversee the practice",
      },
      developer: {
        title: "Developer",
        titleZh: "开发",
        description: "System maintenance & debugging",
      },
    },
    signup: "Sign Up",
    signin: "Sign In",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    confirmPassword: "Confirm Password",
    or: "OR",
    quickAccess: "Quick Access (Demo)",
    benefits: {
      title: "Member Benefits",
      saveProfile: "Save your health profile",
      saveReports: "Access your medical history",
      trackProgress: "Track your health journey",
    },
    toggle: {
      toSignup: "New here? Create an account",
      toLogin: "Already have an account? Log in",
    },
    guestSessionWarning: {
      title: "Diagnosis Data Will Not Be Saved",
      message:
        "You have completed a diagnosis as a guest. If you sign in now, your diagnosis data will NOT be saved to your account. To save your diagnosis history, please sign in first before starting a new diagnosis.",
      understand: "I Understand",
      cancel: "Cancel",
    },
    guestSessionMigrated: {
      title: "Diagnosis Data Saved",
      message: "Your guest diagnosis has been successfully saved to your account!",
    },
  },

  // Basic Info Form
  basicInfo: {
    title: "Basic Profile",
    subtitle: "Please provide your basic details to help us diagnose you accurately.",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your name",
    gender: "Gender",
    selectGender: "Select Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    age: "Age",
    agePlaceholder: "Age",
    weight: "Weight (kg)",
    weightPlaceholder: "kg",
    weightUnit: "kg",
    height: "Height (cm)",
    heightPlaceholder: "cm",
    heightUnit: "cm",
    duration: "Duration",
    durationPlaceholder: "How long?",
    durationOptions: {
      lessThan1Day: "Less than 1 day",
      "1-3days": "1-3 days",
      "4-7days": "4-7 days",
      "1-2weeks": "1-2 weeks",
      "2-4weeks": "2-4 weeks",
      "1-3months": "1-3 months",
      "3-6months": "3-6 months",
      "6-12months": "6-12 months",
      over1Year: "Over 1 year",
      chronic: "Chronic (ongoing)",
    },
    lockedProfile: {
      reviewTitle: "Profile Confirmed",
      reviewSubtitle: "Your profile information is ready. Click Continue to proceed.",
      notice: "Profile auto-filled from your account",
      editInDashboard: "Edit in Dashboard",
      profileReady: "Profile information is complete and ready",
      profileIncomplete: "Please complete your profile first",
      missingFields: "Some information is missing (age, gender, height, or weight)",
      continueToSymptoms: "Continue to Symptoms",
      completeProfile: "Complete My Profile",
      wantToEdit: "Want to update your profile?",
    },
    commonSymptoms: "Common Symptoms",
    symptoms: {
      fever: "Fever",
      cough: "Cough",
      headache: "Headache",
      fatigue: "Fatigue",
      stomachPain: "Stomach Pain",
      soreThroat: "Sore Throat",
      shortnessOfBreath: "Shortness of Breath",
      highBloodPressure: "High Blood Pressure",
      diabetes: "Diabetes",
      cancer: "Cancer",
      heartDisease: "Heart Disease",
      pneumonia: "Pneumonia",
      stroke: "Stroke",
    },
    symptomDescriptions: {
      fever:
        "Body temperature higher than normal (above 37.5°C/99.5°F). You may feel hot, sweaty, or have chills.",
      cough:
        "A reflex that clears your throat and airways. Can be dry (no mucus) or wet (with phlegm).",
      headache:
        "Pain or pressure in your head. Can feel like throbbing, squeezing, or a dull ache.",
      fatigue:
        "Feeling unusually tired or exhausted, even after resting. Low energy throughout the day.",
      stomachPain:
        "Discomfort or pain in your belly area. May include cramping, bloating, or sharp pain.",
      soreThroat: "Pain, scratchiness, or irritation in your throat, especially when swallowing.",
      shortnessOfBreath:
        "Difficulty breathing or feeling like you can't get enough air. May feel like chest tightness.",
      highBloodPressure:
        "Blood pushes too hard against artery walls. Often has no symptoms but can cause headaches or dizziness.",
      diabetes:
        "Body struggles to regulate blood sugar levels. May cause increased thirst, frequent urination, and fatigue.",
      cancer:
        "Abnormal cell growth in the body. Symptoms vary widely depending on type and location.",
      heartDisease:
        "Problems affecting the heart's ability to pump blood. May include chest pain, shortness of breath.",
      pneumonia:
        "Lung infection causing inflammation. Symptoms include cough, fever, difficulty breathing.",
      stroke:
        "Brain blood supply is interrupted. Warning signs: face drooping, arm weakness, speech difficulty.",
    },
    mainConcern: "Main Concern / Complaints",
    mainConcernPlaceholder: "e.g. Severe Headache",
    mainConcernTooltip:
      "Please focus on your ONE major complaint here. This helps the AI allow for a more targeted diagnosis.",
    otherSymptoms: "Other Symptoms / Secondary Complaints",
    otherSymptomsPlaceholder: "Any other symptoms you are experiencing...",
    otherSymptomsTooltip:
      "List any additional symptoms or discomforts here. This provides a more complete picture of your health context.",
    importPrevious: "Import Previous Symptoms",
    importPreviousMedicines: "Import Previous Medicines",
    importing: "Importing...",
    importSuccess: "Symptoms imported successfully!",
    importSuccessMedicines: "Medicines imported successfully!",
    importError: "No previous symptoms found.",
    selectHistoryTitle: "Select from History",
    selectHistoryDesc: "Choose a previous diagnosis to import symptoms.",
    importButton: "Import Selected",
    noHistoryFound: "No previous diagnosis history found.",
    medicineSkipWarning:
      "You haven't added any medicines. Are you currently taking any prescription drugs or supplements?",
    detailedSymptoms: "detailedSymptoms", // Keeping for backward compat if needed or just remove references later
    detailedSymptomsPlaceholder:
      "Please describe your main complaints, feelings, and any other relevant details...",
    chooseTcmDoctor: "Choose Your TCM Doctor",
    startDiagnosis: "Start Diagnosis",
    // Wizard step translations
    wizardSteps: {
      step1Title: "Tell us about yourself",
      step1Subtitle: "Let's start with your identity",
      step2Title: "How old are you?",
      step2Subtitle: "Select your age",
      step3Title: "Body measurements",
      step3Subtitle: "Help us calculate your health metrics",
      step4Title: "What's bothering you?",
      step4Subtitle: "Describe your symptoms",
      step5Title: "Choose your doctor",
      step5Subtitle: "Select your TCM practitioner level",
      stepProgress: "Step {current} of {total}",
    },
    ageRanges: {
      under18: "Under 18",
      "18-25": "18-25",
      "26-35": "26-35",
      "36-45": "36-45",
      "46-55": "46-55",
      "56-65": "56-65",
      over65: "Over 65",
    },
    bmiExplanation: {
      title: "Understanding Your BMI",
      description:
        "Body Mass Index (BMI) is a simple index of weight-for-height that is commonly used to classify underweight, overweight and obesity in adults.",
      yourBmi: "Your BMI",
      underweight: "Underweight",
      normal: "Normal Weight",
      overweight: "Overweight",
      obese: "Obese",
      howItIsCalculated: "How it is calculated",
    },
    // Symptom Categories
    symptomCategories: {
      modes: {
        simple: "Simple View",
        western: "Body Systems",
        tcm: "TCM Elements",
      },
      simple: {
        common: "Common Symptoms",
        chronic: "Chronic / Critical",
      },
      western: {
        respiratory: "Respiratory",
        digestive: "Digestive",
        neurological: "Neurological / Pain",
        cardiovascular: "Cardiovascular",
        general: "General / Chronic",
      },
      tcm: {
        wood: "Wood (Liver)",
        fire: "Fire (Heart)",
        earth: "Earth (Spleen)",
        metal: "Metal (Lung)",
        water: "Water (Kidney)",
      },
    },
  },

  // Doctor levels
  doctorLevels: {
    physician: {
      name: "Doctor",
      nameZh: "医师",
      description:
        "Standard consultation for common ailments. Fastest processing, uses the least credits.",
    },
    seniorPhysician: {
      name: "Senior Doctor",
      nameZh: "主任医师",
      description:
        "Advanced consultation for complex conditions. Provides detailed analysis, requires more processing time.",
    },
    masterPhysician: {
      name: "Master Doctor",
      nameZh: "国医大师",
      description:
        "Expert-level consultation for rare, difficult, or chronic cases that are hard to treat. Uses more credits and requires longer processing time.",
    },
  },

  // Diagnosis Wizard Steps
  steps: {
    basics: "Basics",
    inquiry: "Inquiry",
    tongue: "Tongue",
    face: "Face",
    audio: "Audio",
    pulse: "Pulse",
    bodyPart: "Body Part",
    smartConnect: "Smart Connect",
    summary: "Summary",
  },

  // Inquiry Step
  inquiry: {
    title: "TCM Inquiry (问诊)",
    subtitle: "Our AI doctor will ask you questions based on your symptoms.",
    chatTitle: "Chat with TCM Doctor",
    chatDescription: "Answer the doctor's questions to help with your diagnosis.",
    inputPlaceholder: "Type your answer...",
    send: "Send",
    finishChat: "Finish Consultation",
    endChat: "End Chat",
    startingConversation: "Starting conversation...",
    doctorThinking: "Doctor is thinking...",
    consultationComplete: "Consultation Complete",
    consultationCompleteDesc:
      "Thank you for answering the questions. Click below to proceed to the next step.",
    proceedToNext: "Proceed to Next Step",
    aiQuestion: "AI Doctor",
    yourAnswer: "You",
  },

  // Camera Capture
  camera: {
    takePhoto: "Take Photo",
    capturePhoto: "Capture",
    retake: "Retake",
    usePhoto: "Use Photo",
    confirm: "Confirm",
    switchCamera: "Switch Camera",
    uploadPhoto: "Upload",
    uploadAudio: "Upload Audio",
    dragDropPhoto: "Drag & drop an image here",
    orClickToUpload: "or click to upload",
    or: "Or",
    skip: "Skip",
    cameraAccessDenied: "Camera access denied",
    cameraNotFound: "No camera found",
    preparingCamera: "Preparing camera...",
    initializingCamera: "Initializing Camera...",
    cameraError:
      'Could not access camera. Please ensure you have granted permission or use "Upload Photo" instead.',
    checkPermissions: "Check browser permissions for camera",
    useUploadInstead: 'Or use "Upload Photo" below',
    retryCamera: "Retry Camera",
    guideLabels: {
      tongue: "Position your tongue like this",
      face: "Position your face like this",
      body: "Position the body part like this",
    },
    referenceGuide: "Reference Guide",
    permissionRequired: "Camera access permission required",
    starting: "Starting camera...",
    startCamera: "Start camera",
    initializing: "Initializing...",
    useButtonsHint: "Use buttons below to capture or upload",
    skipDialog: {
      title: "No Photo Provided",
      titleTongue: "No Tongue Photo",
      titleFace: "No Face Photo",
      description:
        "You haven't provided a photo. Providing one ensures better diagnosis accuracy. Do you want to provide one or skip?",
      providePhoto: "Provide Photo",
      skip: "Skip",
    },
  },

  // Tongue diagnosis
  tongue: {
    title: "Tongue Diagnosis (舌诊)",
    subtitle: "Capture or upload a photo of your tongue for analysis.",
    instructions: "Please stick out your tongue and take a clear photo.",
    tips: [
      "Use natural lighting",
      "Avoid eating or drinking 30 minutes before",
      "Relax your tongue naturally",
    ],
    analyzing: "Analyzing tongue...",
    analysisComplete: "Tongue analysis complete",
    noObservation: "No tongue observation recorded",
  },

  // Face diagnosis
  face: {
    title: "Face Diagnosis (面诊)",
    subtitle: "Capture or upload a photo of your face for analysis.",
    instructions: "Please take a clear front-facing photo of your face.",
    tips: ["Use natural lighting", "Remove makeup if possible", "Maintain neutral expression"],
    analyzing: "Analyzing face...",
    analysisComplete: "Face analysis complete",
    noObservation: "No face observation recorded",
  },

  // Body part diagnosis
  bodyPart: {
    title: "Body Area Examination",
    subtitle: "Capture or upload a photo of the affected body area.",
    instructions: "Please take a clear photo of the specific area you want examined.",
    tips: [
      "Use good lighting",
      "Focus on the specific area",
      "Include surrounding area for context",
    ],
    analyzing: "Analyzing body area...",
    analysisComplete: "Body area analysis complete",
    noObservation: "No body area observation recorded",
    selectArea: "Select Body Area",
  },

  // Audio recording
  audio: {
    title: "Voice Analysis (闻诊)",
    listeningDiagnosis: "Listening Diagnosis",
    subtitle: "Record your voice reading the text below for analysis.",
    instructions: "Please read the following passage clearly:",
    instructionsShort: "Instructions:",
    sayAhhh:
      'Please say "Ahhh" for 5-10 seconds, then describe how you feel, including any breathing difficulties or cough patterns.',
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    stopAndContinue: "Stop & Continue",
    recordAgain: "Record Again",
    playRecording: "Play Recording",
    pausePlayback: "Pause",
    recording: "Recording...",
    recorded: "Recorded",
    noRecording: "No recording yet",
    readyToRecord: "Ready to record your voice",
    readingPassage:
      "The morning sun rises over the mountains, bringing warmth and light to the valley below. Birds sing their songs as the gentle breeze carries the fragrance of spring flowers.",
    readingPassageZh:
      "晨曦初升，阳光洒满山间，温暖的光芒照亮了山下的村庄。鸟儿欢唱，微风轻拂，春花的芬芳弥漫在空气中。",
    // Educational content
    educationalTitle: "Understanding Wen (聞診) - Listening & Smelling Diagnosis",
    educationalIntro:
      "Wen diagnosis is one of the Four Pillars of TCM diagnosis. It involves the practitioner listening to sounds produced by the patient and, traditionally, noting any unusual body odors. This method provides valuable insights into the patient's internal health conditions.",
    learnAboutWen: "Learn About Wen Diagnosis",
    traditionalChineseMedicine: "Traditional Chinese Medicine",
    clickToLearnMore: "Click to learn more",
    sections: [
      {
        icon: "🔊",
        title: "Voice Quality Analysis",
        content:
          "A strong, clear voice typically indicates sufficient Qi and healthy Lung function. A weak or low voice may suggest Qi deficiency, while a hoarse voice could indicate Heat affecting the Lungs or Yin deficiency.",
      },
      {
        icon: "💨",
        title: "Breathing Patterns",
        content:
          "The rhythm, depth, and sound of breathing reveal much about respiratory health. Rapid, shallow breathing may indicate Heat or anxiety, while slow, deep breathing suggests Cold patterns or Qi stagnation.",
      },
      {
        icon: "🗣️",
        title: "Speech Patterns",
        content:
          "How a person speaks—whether fast or slow, loud or soft, clear or mumbled—reflects their mental state and Qi flow. Excessive talking may indicate Heart Fire, while reluctance to speak suggests Heart Qi deficiency.",
      },
      {
        icon: "🫁",
        title: "Cough Sounds",
        content:
          "Different cough sounds indicate different conditions. A dry cough suggests Lung Yin deficiency or Heat, while a productive cough with white phlegm indicates Cold-Damp, and yellow phlegm points to Heat-Phlegm.",
      },
    ],
    tips: [
      "Speak naturally and clearly",
      'Say "Ahhh" for 5-10 seconds',
      "Describe any breathing difficulties",
      "Mention if you have a cough",
    ],
    tipsForBetterRecording: "Tips for Better Recording",
    didYouKnow: "Did You Know?",
    didYouKnowContent:
      "Wen diagnosis has been practiced for over 2,000 years. Ancient TCM practitioners developed remarkable skills in diagnosing conditions simply by listening to a patient's voice, breathing, and even the sounds of their stomach!",
    debugSkip: "Skip",
    // Error messages
    errors: {
      permissionDenied: "Microphone Access Denied",
      permissionDeniedDesc:
        "Please allow microphone access in your browser settings to record your voice.",
      permissionDeniedTip:
        "Tap the lock icon in your browser address bar and enable microphone permission.",
      notFound: "No Microphone Found",
      notFoundDesc: "We could not detect a microphone on your device.",
      notFoundTip: 'Please connect a microphone or use the "Upload Audio" option instead.',
      busy: "Microphone is Busy",
      busyDesc: "Another app is currently using your microphone.",
      busyTip:
        "Close other apps that may be using the microphone (like video calls) and try again.",
      httpsRequired: "Secure Connection Required",
      httpsRequiredDesc: "Voice recording requires a secure (HTTPS) connection.",
      httpsRequiredTip:
        'Please access this app via HTTPS or use the "Upload Audio" option instead.',
      generic: "Could Not Access Microphone",
      genericDesc: "We encountered an issue accessing your microphone.",
      genericTip: "Check your device settings and browser permissions, then try again.",
      tryAgain: "Try Again",
      uploadInstead: "Upload Audio Instead",
      skipVoiceAnalysis: "Skip Voice Analysis",
      goBack: "Go Back",
    },
  },

  // Pulse check
  pulse: {
    title: "Pulse Measurement (切诊)",
    subtitle: "Measure your pulse to complete your diagnosis.",
    pulseDiagnosis: "Pulse Diagnosis",
    instructions: "Place your finger on your wrist and count your pulse for 30 seconds.",
    bpm: "BPM",
    bpmLabel: "Beats Per Minute",
    inputBpm: "Enter your pulse rate",
    enterBpm: "Enter BPM",
    measuring: "Measuring...",
    measured: "Pulse measured",
    noMeasurement: "No pulse measurement",
    manualEntry: "Manual Entry",
    enterBpmManually: "Enter BPM Manually",
    tapToMeasure: "Tap to Measure",
    useDevice: "Use Device",
    startMeasurement: "Start Measurement",
    normalRange: "Normal range: 60-100 BPM",
    lowBpm: "Low (Bradycardia)",
    normalBpm: "Normal Range",
    highBpm: "High (Tachycardia)",
    pulseCategories: {
      slow: "Slow (Bradycardia)",
      normal: "Normal",
      fast: "Fast (Tachycardia)",
    },
    showGuide: "Show Guide",
    hideGuide: "Hide Guide",
    taps: "Taps",
    reset: "Reset",
    completePulseCheck: "Complete Pulse Check",
    afterCounting: "After counting your pulse for 60 seconds, enter your heart rate below:",
    tapInRhythm: "Tap the button in rhythm with your pulse for 10-15 seconds:",
    // Guide steps
    guideSteps: [
      {
        title: "Find Your Pulse Point",
        description:
          "Turn your palm facing up. Place your index and middle fingers on your wrist, just below the base of your thumb.",
        tip: "Don't use your thumb - it has its own pulse!",
      },
      {
        title: "Feel the Beat",
        description:
          "Press gently until you feel the rhythmic pulsing of your radial artery. This is your pulse.",
        tip: "If you can't feel it, try moving your fingers slightly or pressing a bit harder.",
      },
      {
        title: "Count for 60 Seconds",
        description:
          "Count how many beats you feel in 60 seconds. This number is your heart rate in BPM (beats per minute).",
        tip: "Alternatively, count for 15 seconds and multiply by 4 for a quick estimate.",
      },
    ],
    // IoT feature
    comingSoon: "Coming Soon",
    smartMonitor: "Smart TCM Health Monitor",
    iotDescription:
      "In the future, our IoT wristband device will automatically detect and transmit your health data:",
    pulseRate: "Pulse Rate",
    bloodPressure: "Blood Pressure",
    bloodOxygen: "Blood Oxygen",
    bodyTemperature: "Body Temperature",
    hrv: "HRV",
    stressLevel: "Stress Level",
    // TCM Pulse Qualities (脉象)
    tcmPulseQualities: "TCM Pulse Qualities",
    tcmPractitionerRequired: "TCM Practitioner Required",
    tcmPractitionerNotice:
      "The pulse qualities below require assessment by a qualified TCM practitioner. General users may skip this section.",
    optional: "Optional",
    selected: "Selected",
    pulseTypes: {
      hua: { name: "Slippery (Hua)", zh: "滑脉", desc: "Smooth and flowing" },
      se: { name: "Rough (Se)", zh: "涩脉", desc: "Unsmooth and hesitant" },
      xian: { name: "Wiry (Xian)", zh: "弦脉", desc: "Taut like a bowstring" },
      jin: { name: "Tight (Jin)", zh: "紧脉", desc: "Tight and forceful" },
      xi: { name: "Thin (Xi)", zh: "细脉", desc: "Fine like a thread" },
      hong: { name: "Surging (Hong)", zh: "洪脉", desc: "Large and forceful" },
      ruo: { name: "Weak (Ruo)", zh: "弱脉", desc: "Soft and weak" },
      chen: { name: "Deep (Chen)", zh: "沉脉", desc: "Deep, felt only with pressure" },
      fu: { name: "Floating (Fu)", zh: "浮脉", desc: "Superficial, felt with light touch" },
      chi: { name: "Slow (Chi)", zh: "迟脉", desc: "Slow rate" },
      shuo: { name: "Rapid (Shuo)", zh: "数脉", desc: "Fast rate" },
      normal: { name: "Normal (Ping)", zh: "平脉", desc: "Normal and balanced" },
    },
    conflicts: {
      xi_hong: "Cannot select 'Thin' and 'Surging' together. These are opposing qualities.",
      hua_se: "Cannot select 'Slippery' and 'Rough' together. These are opposing qualities.",
      fu_chen: "Cannot select 'Floating' and 'Deep' together. These are opposing qualities.",
      chi_shuo: "Cannot select 'Slow' and 'Rapid' together. These are opposing qualities.",
      hong_ruo:
        "Cannot select 'Surging' and 'Weak' together. Surging pulse is large and forceful, while Weak pulse is soft and powerless - they cannot coexist.",
    },
    abnormalBpmTips: {
      title: "Measurement Tips",
      highBpmTitle: "Your heart rate is high",
      lowBpmTitle: "Your heart rate is low",
      subtitle: "To ensure accurate measurement, please confirm the following:",
      tips: [
        {
          icon: "🏃",
          title: "Avoid post-exercise",
          description: "Rest for 5-10 minutes after intense exercise before measuring",
        },
        {
          icon: "😌",
          title: "Stay relaxed",
          description: "Nervousness or anxiety can raise heart rate. Take deep breaths",
        },
        {
          icon: "🪑",
          title: "Comfortable position",
          description: "Sit comfortably and breathe calmly",
        },
        {
          icon: "☕",
          title: "Avoid stimulants",
          description: "Coffee, tea and other stimulants can affect heart rate",
        },
      ],
      remeasure: "Remeasure",
      continueAnyway: "Confirm & Continue",
      confirmMessage:
        "If you have ruled out the above factors, you may continue; otherwise, consider remeasuring.",
    },
    // Camera PPG Measurement
    measureWithCamera: "Measure with Camera",
    cameraMeasurement: {
      title: "Measuring Heart Rate",
      placeFingerInstruction: "Place your finger over the camera lens",
      coverFlash: "Cover the flash completely with your fingertip",
      holdStill: "Hold still for 10 seconds",
      detectingPulse: "Detecting pulse...",
      signalQuality: "Signal Quality",
      weak: "Weak",
      good: "Good",
      excellent: "Excellent",
      stable: "Stable",
      useThisReading: "Use This Reading",
      flashUnavailable: "Flash unavailable - please use manual mode",
      initializing: "Initializing camera...",
      pressFingerHarder: "Press finger harder on camera",
      detected: "Detected!",
      androidChromeOnly: "This feature requires Android Chrome with camera flash",
      notSupported: "Camera pulse measurement is not supported on this device",
    },
    cancel: "Cancel",
  },

  // Smart Connect Step
  smartConnect: {
    smartConnect: "Smart Connect",
    smartHealthMonitor: "Smart Health Monitor",
    manageDevices: "Manage Devices",
    description: "Connect your smart devices to sync health metrics instantly.",
    connect: "Connect",
    pulseRate: "Pulse Rate",
    bloodPressure: "Blood Pressure",
    bloodOxygen: "Blood Oxygen",
    temperature: "Temperature",
    hrv: "HRV",
    stressLevel: "Stress Level",
    healthAppData: "Health App Data",
    optional: "Optional",
    importFromHealthApp: "Import from Health App (Samsung/Apple/Google)",
    importHealthData: "Import Health Data",
    importedFrom: "Imported from",
    update: "Update",
    steps: "steps",
    sleep: "sleep",
    metricsConnected: "Metrics Connected",
    tapToConnect: "Tap any metric to connect a smart device or import health app data",
    allConnected: "All metrics connected!",
    continueConnecting: "Continue connecting more devices or proceed",
    continueWithData: "Continue with Data",
    skipForNow: "Skip for Now",
    useAllData: "Use All Available Data",
    // New multi-section wizard translations
    overview: "Overview",
    iotDevices: "IoT Devices",
    summary: "Summary",
    welcomeTitle: "Connect Your Health Devices",
    welcomeDescription:
      "Sync data from your smart devices and health apps for a more comprehensive health analysis.",
    customSetup: "Custom Setup",
    skipThisStep: "Skip this step",
    connectDevices: "Connect IoT Devices",
    tapToConnectDescription: "Tap each card to connect a device",
    importDescription: "Import data from your favorite health apps",
    dataReady: "Your Data Summary",
    noDevicesConnected: "No devices connected",
    editDevices: "Edit devices",
    addDevices: "Add devices",
    noHealthData: "No health app connected",
    editHealthApp: "Edit health app",
    addHealthApp: "Add health app",
    skipConfirmationTitle: "No Health Data Entered",
    skipConfirmationMessage:
      "You haven't entered any health readings. Inputting this data helps provide a more accurate diagnosis. Would you like to enter data or skip this step?",
    enterData: "Enter Data",
  },

  // Image Analysis
  imageAnalysis: {
    analyzing: "Analyzing image...",
    processingWithAI: "Processing with AI...",
    tryingDifferentModel: "Trying a different analysis method...",
    analysisComplete: "Analysis complete",
    analysisFailed: "Analysis failed",
    retryAnalysis: "Retry Analysis",
    skipAnalysis: "Skip & Continue",
    waitingForAnalysis: "Please wait while we analyze your image...",
    tips: [
      "Clear, focused images provide better results",
      "Good lighting helps the AI analyze more accurately",
      "Analysis typically takes 10-30 seconds",
    ],
    confidence: "Confidence",
    invalidImage: "Invalid or unclear image",
    pleaseRetake: "Please retake the photo with better lighting and focus.",
  },

  // Diagnosis Report
  report: {
    title: "TCM Diagnosis Report",
    generatedOn: "Generated on",
    patientInfo: "Patient Information",
    name: "Name",
    age: "Age",
    gender: "Gender",
    weight: "Weight",
    height: "Height",
    bmi: "BMI",
    symptoms: "Reported Symptoms",
    duration: "Duration",

    // Four pillars
    fourPillars: "Four Pillars of Diagnosis",
    wang: "Looking",
    wangDesc: "Visual Observation",
    wen: "Listening/Smelling",
    wenDesc: "Audio & Olfactory",
    wen2: "Inquiry",
    wen2Desc: "Questioning",
    qie: "Palpation",
    qieDesc: "Pulse Taking",
    analyzedBy: "Analyzed by",
    comprehensiveReport: "Comprehensive TCM Report",
    basedOnFourPillars: "Based on Four Pillars Diagnosis",
    affectedOrgans: "Affected Organs",
    secondaryPatterns: "Secondary Patterns",
    keyFindings: "Key Findings",
    fromInquiry: "From Inquiry",
    fromVisual: "From Visual",
    fromPulse: "From Pulse",
    askAboutReport: "Ask About Report",
    infographics: "Infographics",
    requestDoctorVerification: "Request Doctor Verification",
    backToHome: "Back to Home",
    recommendedPractitioners: "Recommended TCM Practitioners in Malaysia",
    clickToViewDetails: "Click to view contact details",
    detailedAnalysis: "Detailed Analysis",
    chiefComplaint: "Chief Complaint",
    therapeuticRecipes: "Therapeutic Recipes",
    practitionerDetails: "Practitioner Details",
    bookAppointment: "Book Appointment",
    experience: "Experience",
    acupressurePoints: "Acupressure Points",
    massageTip: "Massage each point for 1-2 minutes, 2-3 times daily",
    exercise: "Exercise",
    restAndWellness: "Rest & Wellness",
    sleepGuidance: "Sleep Guidance",
    emotionalWellness: "Emotional Wellness",
    herbalFormulas: "Herbal Formulas",
    professionalConsultation: "Professional Consultation",
    precautionsAndWarnings: "Precautions & Warnings",
    warningSigns: "Warning Signs (Seek Medical Attention):",
    contraindications: "Contraindications:",
    followUpGuidance: "Follow-up Guidance",
    timeline: "Timeline",
    expectedImprovement: "Expected Improvement",
    nextSteps: "Next Steps",
    ingredients: "Ingredients:",
    dosage: "Dosage:",
    requestPhysicianApproval: "Request sent - pending doctor approval",
    requestFormulaDetails: "Request Full Formula Details",
    showDetails: "Show details →",
    summary: "TCM Report Summary",
    chatReference: "Reference while chatting",
    viewFullReport: "View Full Report",
    diagnosis: "Diagnosis",
    yearsShort: "yrs",
    foodsCount: "foods",
    lifestyleTipsCount: "lifestyle tips",

    // TCM analysis
    tcmDiagnosis: "TCM Diagnosis",
    constitution: "Constitution Type",
    patternDifferentiation: "Pattern Differentiation",
    rootCause: "Root Cause Analysis",

    // Recommendations
    recommendations: "Recommendations",
    dietaryAdvice: "Dietary Advice",
    foodsToEat: "Foods to Eat",
    foodsToAvoid: "Foods to Avoid",
    lifestyle: "Lifestyle Suggestions",
    herbalSuggestions: "Herbal Suggestions",
    acupuncture: "Acupuncture Points",
    actionAlerts: {
      saved: "Saved!",
      requestSent: "Request Sent!",
      copied: "Report link copied to clipboard!",
    },

    // Actions
    downloadPdf: "Download PDF",
    printReport: "Print Report",
    shareReport: "Share Report",
    saveToHistory: "Save to History",
    newDiagnosis: "New Diagnosis",

    // Disclaimer
    disclaimer:
      "This report is generated by AI for reference purposes only. Please consult a licensed TCM practitioner for professional medical advice.",

    // TCM analysis
  },

  // Analysis loading screen
  analysisLoading: {
    title: "Analyzing Your Constitution",
    subtitle: "Our AI practitioner is synthesizing your symptoms, observations, and pulse data...",
    didYouKnow: "Did you know?",
    analysisProgress: "ANALYSIS PROGRESS",
    step: "Step",
    takingLonger: "(taking longer than usual)",
    takingLongerWarning: "Taking longer than expected.",
    aiAnalysisMayTakeMoment: " AI analysis may take a moment. Please wait...",
    responseStreaming: " Response is streaming, please wait...",
    timeoutWarning:
      "Timeout likely. Check: 1) API key valid? 2) Network connection? 3) Console errors?",
    yearsOld: "years old",
    // Patient info cards
    patientInfo: {
      patient: "Patient",
      age: "Age",
      weightBmi: "Weight & BMI",
      mainConcerns: "Main Concerns",
      anonymous: "Anonymous",
      notAvailable: "N/A",
      generalConsultation: "General consultation",
    },
    // Analysis steps
    debugSteps: {
      dataCollected: "Data Collected",
      gatheringInfo: "Gathering your information",
      preparingAnalysis: "Preparing Analysis",
      organizingData: "Organizing your data",
      connecting: "Connecting",
      establishingConnection: "Establishing connection...",
      processing: "Processing",
      preparingConsultation: "Preparing consultation",
      aiAnalysis: "AI Analysis",
      generatingInsights: "Generating insights...",
      receivingResults: "Receiving Results",
      retrievingAnalysis: "Retrieving analysis...",
      validating: "Validating",
      checkingResults: "Checking results",
      renderingReport: "Rendering Report",
      creatingReport: "Creating your report",
    },
    // TCM Facts
    tcmFacts: {
      observation: {
        title: "望 (Wàng) - Observation",
        description:
          "TCM practitioners examine your facial complexion, tongue coating, and body posture to understand your internal health condition.",
      },
      listening: {
        title: "聞 (Wén) - Listening & Smelling",
        description:
          "The practitioner listens to your voice, breathing patterns, and cough sounds to detect imbalances in your Qi and organ systems.",
      },
      inquiry: {
        title: "問 (Wèn) - Inquiry",
        description:
          "Through detailed questioning about your symptoms, lifestyle, and medical history, TCM builds a comprehensive picture of your health.",
      },
      palpation: {
        title: "切 (Qiè) - Palpation",
        description:
          "Pulse diagnosis reveals the state of your organs and Qi flow. A skilled practitioner can detect up to 28 different pulse qualities.",
      },
      yinYang: {
        title: "Yin-Yang Balance",
        description:
          "TCM seeks to restore balance between opposing forces. Symptoms often indicate excess or deficiency in either Yin or Yang energy.",
      },
      fiveElements: {
        title: "Five Elements Theory",
        description:
          "Wood, Fire, Earth, Metal, and Water represent different organs and emotions. Their harmony is essential for wellbeing.",
      },
      qiBlood: {
        title: "Qi & Blood Flow",
        description:
          "Qi is your life force energy. When Qi flows smoothly through your meridians, health follows. Blockages lead to pain and illness.",
      },
    },
    steps: [
      "Collecting patient data...",
      "Analyzing symptoms...",
      "Processing visual observations...",
      "Evaluating pulse data...",
      "Identifying patterns...",
      "Generating diagnosis...",
      "Preparing recommendations...",
      "Finalizing report...",
    ],
    tips: [
      "TCM diagnosis considers the whole person, not just symptoms",
      "The Five Elements (五行) relate organs to seasons and emotions",
      "Qi (气) is the vital life force that flows through meridians",
      "Yin and Yang balance is essential for good health",
      "Diet and lifestyle are key pillars of TCM wellness",
    ],
    almostDone: "Almost done...",
    pleaseWait: "Please wait while we complete your analysis",
  },

  // Dashboard - Patient
  patientDashboard: {
    // Header
    title: "Patient Dashboard",
    welcomeBack: "Welcome back",
    newDiagnosis: "New Diagnosis",
    actions: {
      hide: "Hide",
      delete: "Delete",
    },
    messages: {
      sessionHidden: "Session hidden successfully",
      sessionDeleted: "Session deleted successfully",
    },
    deleteDialog: {
      title: "Are you absolutely sure?",
      description:
        "This action cannot be undone. This will permanently delete your session record from our servers.",
      cancel: "Cancel",
      confirm: "Delete",
    },

    // Constitution Card
    constitutionCard: {
      title: "My Constitution",
      learnMore: "Learn More",
      hideDetails: "Hide Details",
      noDiagnosisTitle: "Discover Your TCM Constitution",
      noDiagnosisDesc:
        "Start your TCM diagnosis journey to understand your unique body constitution and receive personalized health recommendations.",
      startAssessment: "Start Constitution Assessment",
      dietaryAdvice: "Dietary Advice",
      foodsToEat: "Foods to Eat",
      foodsToAvoid: "Foods to Avoid",
      lifestyleAdvice: "Lifestyle Recommendations",
      lastAssessed: "Last assessed",
      getNewAssessment: "Get New Assessment",
    },

    // Daily Health Tip
    dailyTip: {
      badge: "Daily Health Tip",
      detailsTitle: "Details",
      ingredientsTitle: "Ingredients",
      methodTitle: "Method",
    },

    // Navigation tabs
    tabs: {
      healthJourney: "Health Journey",
      mealPlanner: "Dietary Therapy",
      snoreAnalysis: "Sleep Cultivation",
      vitalityRhythm: "Meridian Clock",
      community: "Healing Garden",
      qiDose: "Guided Exercise",
      soundscape: "Soundscape",
      family: "Family Care",
      profile: "Basic Profile",
      documents: "Documents",
      settings: "Settings",
      fiveElements: "Circle of Health",
      heartCompanion: "Heart Companion",
    },

    // Health Journey section
    healthJourney: {
      title: "Health Journey",
      heroTitle: "Your Health Journey",
      vitalityTitle: "Your Health Vitality",
      subtitle: "Track your wellness journey over time",
      totalSessions: "Total Sessions",
      journeyDuration: "Journey",
      averageScore: "Average Score",
      progress: "Progress",
      points: "points",
      mostCommonPattern: "Most Common Pattern",
      time: "time",
      times: "times",
      sessionRecorded: "session recorded",
      sessionsRecorded: "sessions recorded",
      startJourneyToday: "Start your wellness journey today",
      noSessionsYet: "Your wellness journey starts here",
      noSessionsDesc: "Your health journey begins with your first diagnosis.",
      startFirstDiagnosis: "Start First Diagnosis",
      sessionsCount: "{count} {sessionText} • {duration}",
      sessionSingular: "session",
      sessionPlural: "sessions",
      showingCount: "Showing {filtered} of {total} sessions",
      emptyTitle: "Begin Your Journey",
      emptyDesc:
        "Your health journey begins with your first diagnosis. Start tracking your wellness today.",
      startButton: "Start First Diagnosis",
      originMarker: "Your journey began here",
      duration: {
        zero: "0 months",
        lessThanMonth: "Less than a month",
        oneMonth: "1 month",
        months: "{count} months",
      },
      filters: {
        all: "All",
        thisYear: "This Year",
        thisMonth: "This Month",
        sortBy: "Sort by",
        date: "Date",
        score: "Score",
        diagnosis: "Diagnosis",
        ascending: "Ascending",
        descending: "Descending",
      },
      card: {
        viewReport: "View Full Report",
        inquiry: "Inquiry",
        tongue: "Tongue",
        face: "Face",
        voice: "Voice",
        pulse: "Pulse",
      },
      cantFindData: "Can't find your data?",
      restoreMockData: "Restore Data",
    },

    // Profile section
    profile: {
      title: "My Profile",
      subtitle: "Manage your personal information",
      personalInfo: "Personal Information",
      yourProfileDetails: "Your profile details",
      name: "Name",
      age: "Age",
      gender: "Gender",
      height: "Height",
      weight: "Weight",
      medicalHistory: "Medical History",
      notSet: "Not set",
      saveChanges: "Save Changes",
      saving: "Saving...",
      male: "Male",
      female: "Female",
      other: "Other",
      fullName: "Full Name",
    },

    // Documents section
    documents: {
      title: "Medical Documents",
      subtitle: "Upload and manage your medical reports and documents",
      yourDocuments: "Your Documents",
      filesUploaded: "files uploaded",
      upload: "Upload",
      noDocumentsYet: "No documents uploaded yet",
      deleteConfirm: "Are you sure you want to delete this document?",
    },

    // Settings section
    settings: {
      title: "Settings",
      dashboardSettings: "Dashboard Settings",
      subtitle: "Manage your preferences and account settings",
      languagePreference: "Language Preference",
      chooseLanguage: "Choose your preferred language for the app",
      languageSaved: "Your language preference is automatically saved",
      accountInfo: "Account Information",
      accountDetails: "Your account details",
      email: "Email",
      accountType: "Account Type",
      memberSince: "Member Since",
      signOut: "Sign Out",
      diagnosisMode: "Diagnosis Mode",
      diagnosisModeDesc: "Choose your preferred diagnosis experience.",
      simpleMode: "Simple Mode",
      simpleModeDesc:
        "Faster diagnosis flow. Skips detailed reviews and advanced measurements like pulse.",
      advancedMode: "Advanced Mode",
      advancedModeDesc:
        "Full diagnosis flow. Includes inquiry review, pulse measurement, and diagnostic summary.",
      modeSaved: "Diagnosis mode saved!",
      hiddenPages: "Hidden Pages (Skipped):",
      includedPages: "Included Pages:",
      stepInquirySummary: "Review Inquiry Summary",
      stepPulse: "Pulse Measurement",
      stepDiagnosisSummary: "Diagnostic Summary",
      meridianClock: "Meridian Organ Clock",
      meridianClockDesc:
        "Display the Meridian Organ Clock and seasonal solar terms on your dashboard. (Recommended for users in seasonal climates)",
    },

    // Meal Planner / Dietary Therapy (食疗方案)
    mealPlanner: {
      title: "Dietary Therapy", // 食疗方案
      subtitle: "Personalized 7-day meal plans based on your TCM constitution",
      yourMealPlan: "Your 7-Day TCM Meal Plan",
      constitution: "Constitution",
      daysCompleted: "days completed",
      shoppingList: "Shopping List",
      newPlan: "New Plan",
      tcmPrinciples: "TCM Dietary Principles for You",
      day: "Day",
      completed: "Completed",
      markComplete: "Mark Complete",
      generateNewPlanConfirm: "Generate a new meal plan? This will deactivate your current plan.",
      // Shopping List
      itemsChecked: "items checked",
      categories: "categories",
      printList: "Print List",
      doneShopping: "Done Shopping",
      // Categories
      categoryProduce: "Produce",
      categoryProteins: "Proteins",
      categoryGrains: "Grains",
      categorySpices: "Spices",
      categoryHerbs: "Herbs",
      categoryDairy: "Dairy",
      categoryPantry: "Pantry",
      categoryBeverages: "Beverages",
      categoryOther: "Other",
      // Dietary Preferences
      dietaryPreferences: "Dietary Preferences",
      allergies: "Allergies",
      dietaryType: "Dietary Type",
      dislikedFoods: "Disliked Foods",
      dislikedFoodsPlaceholder: "e.g. bitter gourd, cilantro, organ meats",
      servingSize: "Serving Size",
      servingSizePlaceholder: "Select number of people",
      savePreferences: "Save Preferences",
      preferencesSaved: "Preferences saved successfully!",
      savePreferencesError: "Failed to save preferences. Please try again.",
      editPreferences: "Edit Preferences",
      // Allergies
      allergyNuts: "Nuts",
      allergyShellfish: "Shellfish",
      allergyDairy: "Dairy",
      allergyEggs: "Eggs",
      allergyGluten: "Gluten",
      allergySoy: "Soy",
      allergySesame: "Sesame",
      // Diets
      dietNoRestrictions: "No Restrictions",
      dietVegetarian: "Vegetarian",
      dietVegan: "Vegan",
      dietPescatarian: "Pescatarian",
      dietHalal: "Halal",
      dietKosher: "Kosher",
      // Wizard specific
      readyToGenerate: "Ready to Generate Your Meal Plan",
      generateDescription:
        "Our AI nutritionist will analyze your TCM constitution ({constitution}) and dietary preferences to create a personalized 7-day plan.",
      yourPreferences: "Your Preferences",
      noRestrictions: "No restrictions",
      generatePlan: "Generate 7-Day Plan",
      completeDiagnosisFirst: "Complete a TCM diagnosis first to unlock this feature",
      person: "person",
      people: "people",
      swap: "Swap",
      swapping: "Swapping...",
      swapSuccess: "Meal swapped successfully!",
      swapError: "Failed to swap meal",
      // Food Checker
      foodChecker: {
        title: "TCM Food Checker",
        subtitle: "Check if a food is suitable for your body type",
        inputPlaceholder: "Search for a food (e.g., Watermelon, Ginger)",
        takePhoto: "Take Photo",
        checkButton: "Check Suitability",
        checking: "Analyzing food...",
        suitabilityResult: "Suitability Assessment",
        recommendation: "Recommendation",
        explanation: "TCM Explanation",
        suitable: "Suitable",
        moderate: "Eat in Moderation",
        avoid: "Avoid",
        noDiagnosisWarning: "Please complete a TCM diagnosis first to use this feature.",
        cameraLabel: "Snap a photo of the food",
        dropZoneText: "Drag & drop food photo here",
        resultScore: "Suitability Score",
        tcmProperties: "TCM Properties",
        nature: "Thermal Nature",
        flavor: "Flavors",
        betterAlternatives: "Better Alternatives for You",
        tryAnother: "Check Another Food",
        inputModeText: "Type food name",
        inputModeImage: "Take a snapshot",
      },
    },

    // Snore Analysis / Sleep Cultivation (睡眠养生)
    snoreAnalysis: {
      title: "Sleep Cultivation", // 睡眠养生 (formerly Snore Analysis)
      subtitle: "Record your sleep sounds for AI-powered snoring analysis",
      description:
        "Detect snoring patterns, assess severity, and receive personalized recommendations.",
      // Recording
      startRecording: "Start Recording",
      stopRecording: "Stop Recording",
      uploadAudio: "Upload Sleep Recording",
      recording: "Recording...",
      recordingInProgress: "Recording in progress",
      // Analysis
      analyzing: "Analyzing sleep sounds...",
      analysisComplete: "Analysis Complete",
      analyzeRecording: "Analyze Recording",
      // Results
      snoringDetected: "Snoring Detected",
      noSnoringDetected: "No Snoring Detected",
      severity: "Severity",
      severityLevels: {
        none: "None",
        mild: "Mild",
        moderate: "Moderate",
        severe: "Severe",
      },
      confidence: "Confidence",
      observations: "Observations",
      patterns: "Patterns Detected",
      apneaIndicators: "Sleep Apnea Indicators",
      recommendations: "Recommendations",
      // Actions
      saveToHistory: "Save to History",
      recordAgain: "Record Again",
      viewHistory: "View History",
      // Tips
      tips: {
        title: "Tips for Better Recording",
        items: [
          "Record in a quiet room",
          "Place phone near your bed",
          "Record for at least 30 minutes for best results",
          "Ensure phone has enough battery",
        ],
      },
      // Educational
      education: {
        title: "Understanding Snoring",
        description:
          "Snoring occurs when air flows past relaxed tissues in your throat, causing them to vibrate. While occasional snoring is common, persistent snoring may indicate underlying health conditions.",
        learnMore: "Learn More",
      },
      // Empty state
      noRecordingsYet: "No recordings yet",
      noRecordingsDesc: "Start your first sleep sound recording to receive AI-powered analysis.",
      // History
      history: {
        title: "Recording History",
        noHistory: "No analysis history yet",
      },
      // Errors
      errors: {
        microphoneDenied: "Microphone access denied",
        recordingFailed: "Recording failed. Please try again.",
        analysisFailed: "Analysis failed. Please try again.",
      },
    },

    // Health Journey Table
    historyTable: {
      diagnosis: "Diagnosis",
      date: "Date",
      symptoms: "Symptoms",
      medicines: "Medicines",
      score: "Score",
      status: "Status",
      action: "Action",
      view: "View",
      // Status labels
      good: "Good",
      fair: "Fair",
      needsAttention: "Needs Attention",
      // Sort options
      sortByDate: "Date",
      sortByScore: "Score",
      sortByDiagnosis: "Diagnosis",
    },
    // Navigation
    navigation: {
      home: "Home",
      dashboard: "Dashboard",
      patientAccount: "Patient Account",
      logout: "Logout",
      // Section Headers with TCM Quotes
      sectionDiet: "Diet & Nutrition",
      sectionRoutine: "Daily Life & Rest",
      sectionEmotions: "Emotions & Community",
      // TCM Classic Quotes
      quoteDiet: "Moderation in diet, harmony in flavors",
      quoteRoutine: "Regular routine, balanced exertion",
      quoteEmotions: "Spirit guarded within, illness cannot arise",
      // All quotes source
      quoteSource: "Huangdi Neijing · Suwen",
      // Group Headers
      groupAssessment: "Assessment",
      groupTreatment: "Treatment Plan",
      groupCultivation: "Care Hub",
      groupAccount: "Account",
    },

    // Legacy keys for backwards compatibility
    welcome: "Welcome",
    startNewDiagnosis: "Start New Diagnosis",
    myInquiries: "My Inquiries",
    viewHistory: "View History",
    noInquiries: "No diagnosis history yet",
    noInquiriesDesc: "Start your first TCM diagnosis to see your health journey here.",
    recentDiagnosis: "Recent Diagnosis",
    viewReport: "View Report",

    // Vitality Rhythm / Meridian Clock (子午流注)
    vitalityRhythm: {
      title: "Meridian Clock", // 子午流注 (formerly Vitality Rhythm)
      subtitle: "Harmonizing Your Body with Natural Cycles",
      meridianClock: "Meridian Organ Clock",
      meridianClockDesc: "TCM organ focus based on the theoretical 24-hour cycle.",
      activeOrgan: "Active Organ",
      comingNext: "Coming Next",
      previous: "Previous",
      solarTerms: "24 Solar Terms",
      currentTerm: "Current Term",
      healthWisdom: "Health Wisdom",
      healthWisdomDesc:
        "Yang energy is at its lowest. Focus on warm foods, protect back/knees, and get extra rest.",
      constitutionTracker: "Constitution Tracker",
      constitutionTrackerDesc:
        "Track how your body constitution evolves over time or with the seasons.",
      getNewAssessment: "Get New Assessment",
      didYouKnow: "Did You Know?",
      didYouKnowQuote:
        '"The wise man adapts himself to the time and the season, as the water adapts itself to the channel that guides it."',
      didYouKnowDesc:
        "TCM emphasizes <strong>Ziwu Liuzhu</strong> (The Flow of Qi through Meridians) as a way to maintain health by aligning biological rhythms with solar and lunar cycles.",
      noData: "No constitution data found yet. Start a diagnosis to begin tracking.",
      latest: "Latest",
      element: "Element",
      hour: "Hour",
      organClock: {
        gallbladder: {
          name: "Gallbladder",
          time: "11 PM - 1 AM",
          advice: "Sleep deeply for Yin restoration.",
          element: "Wood",
        },
        liver: {
          name: "Liver",
          time: "1 AM - 3 AM",
          advice: "Deep sleep is vital for blood detoxification.",
          element: "Wood",
        },
        lung: {
          name: "Lung",
          time: "3 AM - 5 AM",
          advice: "Body is detoxing the lungs. Keep warm.",
          element: "Metal",
        },
        largeIntestine: {
          name: "Large Intestine",
          time: "5 AM - 7 AM",
          advice: "Perfect time for bowel movements and drinking warm water.",
          element: "Metal",
        },
        stomach: {
          name: "Stomach",
          time: "7 AM - 9 AM",
          advice: "Eat a warm, nutrient-rich breakfast for best absorption.",
          element: "Earth",
        },
        spleen: {
          name: "Spleen",
          time: "9 AM - 11 AM",
          advice: "Mental focus is high. Good time for work/study.",
          element: "Earth",
        },
        heart: {
          name: "Heart",
          time: "11 AM - 1 PM",
          advice: "Eat a light lunch and take a short nap.",
          element: "Fire",
        },
        smallIntestine: {
          name: "Small Intestine",
          time: "1 PM - 3 PM",
          advice: "Assimilation time. Stay active but don't overwork.",
          element: "Fire",
        },
        bladder: {
          name: "Bladder",
          time: "3 PM - 5 PM",
          advice: "Good time for physical activity and hydration.",
          element: "Water",
        },
        kidney: {
          name: "Kidney",
          time: "5 PM - 7 PM",
          advice: "Restore energy. Light dinner and gentle activity.",
          element: "Water",
        },
        pericardium: {
          name: "Pericardium",
          time: "7 PM - 9 PM",
          advice: "Emotional connection and relaxation. Prepare for sleep.",
          element: "Fire",
        },
        tripleBurner: {
          name: "Triple Burner",
          time: "9 PM - 11 PM",
          advice: "Final winding down. Avoid screens; keep the body warm.",
          element: "Fire",
        },
      },
    },

    // Qi Dose / Guided Exercise (导引功法)
    qiDose: {
      title: "Guided Exercise", // 导引功法 (formerly Qi Dose)
      subtitle: "TCM-guided movement practices for your constitution",
      description:
        "Based on your constitution, practice these micro-movements to regulate inner energy",
    },
    cards: {
      currentMeridian: "Current Meridian",
      nextSuggestion: "Next Suggestion",
      lastNight: "Last Night",
      exercise: "Exercise",
      movements8: "8 Movements",
      goodSleep: "Good Sleep",
      circle: "Circle",
      joinNow: "Join Now",
    },
  },

  // Dashboard - Doctor
  doctorDashboard: {
    title: "Doctor Dashboard",
    welcome: "Welcome, Dr.",
    patientHistory: "Patient History",
    searchPatients: "Search Patients",
    totalPatients: "Total Patients",
    totalInquiries: "Total Inquiries",
    recentPatients: "Recent Patients",
    viewDetails: "View Details",
    noPatients: "No patient records yet",
    filters: {
      dateFrom: "From Date",
      dateTo: "To Date",
      patientName: "Patient Name",
      symptoms: "Symptoms",
      search: "Search",
      reset: "Reset",
    },
  },

  // Dashboard - Admin
  adminDashboard: {
    title: "Admin Dashboard",
    welcome: "Welcome, Administrator",
    systemPrompts: "System Prompts",
    userManagement: "User Management",
    settings: "Settings",
    saveChanges: "Save Changes",
    promptSaved: "Prompt saved successfully",
    promptSaveFailed: "Failed to save prompt",
    doctorLevel: "Doctor Level",
    defaultLevel: "Default Level",
    chatPrompt: "Chat Prompt",
    imageAnalysisPrompt: "Image Analysis Prompt",
    finalAnalysisPrompt: "Final Analysis Prompt",
  },

  // Observation Result
  observation: {
    title: "Observation Result",
    noObservation: "No observation recorded",
    pendingAnalysis: "Analysis pending...",
    confidence: "Confidence",
    potentialIssues: "Potential Indications",
    viewDetails: "View Details",
    hideDetails: "Hide Details",
    // Analysis Result Titles
    tongueAnalysisResult: "Tongue Analysis Result",
    faceAnalysisResult: "Face Analysis Result",
    specificAreaAnalysisResult: "Specific Area Analysis Result",
    // Subtitles
    reviewBeforeProceeding: "Here is what our AI observed. Please review before proceeding.",
    imageNotAnalyzed: "The image could not be analyzed. Please review and retake if needed.",
    // Buttons
    editResult: "Edit Result",
    cancel: "Cancel",
    done: "Done",
    continue: "Continue",
    // Section Labels
    observation: "Observation",
    detailedAnalysisTags: "Detailed Analysis Tags",
    noDetailedObservation: "No detailed observation available.",
    noSpecificIndications: "No specific indications noted.",
    enterOnePerLine: "Enter one indication per line",
    // Invalid Image Dialog
    imageNotRecognized: "Image Not Recognized",
    detected: "Detected",
    // Warning Dialog
    warningImageQuality: "Warning: Image Quality",
    warningDescription:
      "The accuracy of the final report will be affected should we not have the correct photo.",
    guidelines: "Guidelines",
    continueAnyway: "Continue Anyway",
    // Photo Guidelines Dialog
    photoGuidelines: "Photo Guidelines",
    photoGuidelinesIntro: "Please follow these guidelines for the best analysis results:",
    guidelineLighting: "Make sure the light is sufficient and even.",
    guidelineNoEdit: "Do not edit or beautify the photo.",
    guidelineClearlyVisible: "Ensure the {part} is clearly visible and in focus.",
    guidelineNoShadow: "Avoid shadows or glare.",
    guidelineTongueRelax: "Relax your tongue, do not stiffen it.",
    guidelineFaceNoGlasses: "Remove glasses and ensure your face is not covered by hair.",
  },
  // Audio/Listening Analysis Result
  audioAnalysis: {
    listeningAnalysisComplete: "Listening Analysis Complete",
    wenZhenResults: "闻诊 (Wén Zhěn) Results",
    // Confidence
    highConfidence: "High Confidence",
    mediumConfidence: "Medium Confidence",
    lowConfidence: "Low Confidence",
    // Section Labels
    overallObservation: "Overall Observation",
    tcmIndicators: "TCM Indicators",
    clinicalSignificance: "Clinical Significance",
    patternSuggestions: "Pattern Suggestions",
    note: "Note",
    onePatternPerLine: "One pattern per line",
    oneIndicatorPerLine: "One indicator per line",
    // Category Titles
    voiceQualityAnalysis: "Voice Quality Analysis",
    breathingPatterns: "Breathing Patterns",
    speechPatterns: "Speech Patterns",
    coughSounds: "Cough Sounds",
    // Severity Labels
    normal: "Normal",
    mild: "Mild",
    moderate: "Moderate",
    significant: "Significant",
    // Buttons
    recordAgain: "Record Again",
    uploadAudio: "Upload Audio",
  },

  // Errors and Warnings
  errors: {
    genericError: "Something went wrong. Please try again.",
    networkError: "Network error. Please check your connection.",
    sessionExpired: "Session expired. Please log in again.",
    unauthorized: "You are not authorized to access this page.",
    notFound: "Page not found.",
    serverError: "Server error. Please try again later.",
    validationError: "Please check your input and try again.",
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email address",
    invalidAge: "Please enter a valid age",
    invalidRange: "value must be between {min} and {max}",
    fileTooBig: "File is too large. Maximum size is {size}MB.",
    unsupportedFormat: "Unsupported file format",
    cameraError: "Camera error. Please try again.",
    microphoneError: "Microphone error. Please try again.",
    analysisError: "Analysis failed. Please retry.",
    // API error messages
    apiError: "API Error",
    connectionFailed: "Failed to connect to the analysis service.",
    parseError: "We encountered an issue parsing the diagnosis result.",
    // Error boundary messages
    componentError: "Something went wrong",
    componentErrorDesc:
      "An unexpected error occurred. Please try again or go back to the previous step.",
    tryAgain: "Try Again",
    goBack: "Go Back",
    persistentError: "If this problem persists, please refresh the page or contact support.",
  },

  // Success messages
  success: {
    saved: "Saved successfully",
    updated: "Updated successfully",
    deleted: "Deleted successfully",
    copied: "Copied to clipboard",
    downloaded: "Downloaded successfully",
    uploaded: "Uploaded successfully",
    sent: "Sent successfully",
  },

  // Confirmation dialogs
  confirm: {
    delete: "Are you sure you want to delete this?",
    logout: "Are you sure you want to log out?",
    discard: "Are you sure you want to discard changes?",
    leave: "Are you sure you want to leave? Unsaved changes will be lost.",
  },

  // Diagnosis Summary
  diagnosisSummary: {
    title: "Diagnostic Summary",
    subtitle:
      "Please review and edit the collected information before generating the final report.",
    sections: {
      basicInfo: "Basic Information",
      wenInquiry: "Inquiry (Wen)",
      wangTongue: "Tongue Diagnosis (Wang)",
      wangFace: "Face Diagnosis (Wang)",
      wangPart: "Body Part Diagnosis (Wang)",
      wenAudio: "Audio Analysis (Wen)",
      qie: "Pulse Diagnosis (Qie)",
      smartConnect: "Smart Connect Health Metrics",
    },
    defaultMessages: {
      noObservation: "No observation recorded.",
      inquiryCompleted: "Patient inquiry completed.",
      audioCompleted: "Audio analysis completed.",
      noDeviceData: "No device data connected.",
    },
    reportOptions: {
      title: "Report Options",
      subtitle: "Customize what information to include in your diagnosis report",
      // Patient Information
      patientInfo: "Patient Information",
      demographics: "Demographics",
      patientName: "Patient Name",
      age: "Age",
      gender: "Gender",
      contactInfo: "Contact Information",
      address: "Address",
      emergencyContact: "Emergency Contact",
      // Vital Signs
      vitalSigns: "Vital Signs & Measurements",
      healthData: "Health Data",
      vitalSignsDesc: "Vital Signs (BP, HR, Temp)",
      bmiMeasurements: "BMI & Body Measurements",
      smartConnectData: "Smart Connect Device Data",
      // Medical History
      medicalHistory: "Medical History",
      background: "Background",
      pastMedicalHistory: "Past Medical History",
      knownAllergies: "Known Allergies",
      currentMedications: "Current Medications",
      pastTcmDiagnoses: "Past TCM Diagnoses",
      familyHistory: "Family Medical History",
      // TCM Recommendations
      tcmRecommendations: "TCM Recommendations",
      treatment: "Treatment",
      herbalMedicine: "Herbal Medicine Suggestions",
      nearbyDoctor: "Nearby TCM Doctor",
      foodsToAvoid: "Foods to Avoid",
      herbalSuggestions: "Herbal Suggestions",
      dietary: "Dietary Advice (食疗)",
      lifestyle: "Lifestyle Tips (养生)",
      acupuncture: "Acupuncture Points (穴位)",
      exercise: "Exercise Recommendations",
      sleepAdvice: "Sleep & Rest Guidance",
      emotionalWellness: "Emotional Wellness (情志)",
      // Report Extras
      reportExtras: "Report Format & Extras",
      formatting: "Formatting",
      precautions: "Precautions & Warnings",
      followUp: "Follow-up Guidance",
      timestamp: "Report Timestamp",
      qrCode: "QR Code for Digital Access",
      doctorSignature: "Doctor Signature Field",
    },
    buttons: {
      back: "Back",
      confirmGenerate: "Confirm & Generate Report",
    },
    instructions: {
      observations:
        "Please review and edit the clinical observations below. These will be included in the final report.",
      inquiry: "Please review the patient's basic information and inquiry details.",
      options: "Customize what information to include in the final generated report.",
    },
    placeholders: {
      contact: "Enter contact number",
      address: "Enter address",
      emergencyContact: "Enter emergency contact",
    },
  },

  // Resume Progress Dialog
  resumeProgress: {
    title: "Resume Previous Session?",
    description:
      "We found a previous diagnosis session. Would you like to pick up where you left off?",
    savedAt: "Saved",
    lastStep: "Last Step",
    resume: "Resume",
    startNew: "Start New",
    justNow: "just now",
    minutesAgo: "minutes ago",
    hoursAgo: "hours ago",
  },

  // Health Data Import Wizard
  healthDataImport: {
    title: "Health Data Import",
    description: "Connect to your health app to import daily activity data.",
    selectProvider: "Select a provider:",
    providers: {
      samsung: "Samsung Health",
      apple: "Apple Health",
      google: "Google Fit",
    },
    connecting: {
      title: "Connecting...",
      description: "Establishing secure connection to {provider}",
    },
    importing: {
      syncing: "Syncing data...",
      activityHistory: "Activity history",
      sleepPatterns: "Sleep patterns",
      heartRateVariability: "Heart rate variability",
    },
    result: {
      success: "Import Successful",
      syncedFrom: "Data synced from {provider}",
      steps: "Steps",
      sleep: "Sleep",
      avgHr: "Avg HR",
      calories: "Calories",
      confirm: "Confirm & Use Data",
      bpm: "bpm",
    },
  },

  // Report Chat Window
  reportChat: {
    title: "Ask About Your Report",
    subtitle: "I can help explain your TCM diagnosis",
    placeholder: "Ask a question about your report...",
    send: "Send",
    thinking: "Thinking...",
    suggestions: [
      "What does my diagnosis mean?",
      "Why should I avoid these foods?",
      "How long until I feel better?",
      "Explain the acupressure points",
    ],
    emptyState: {
      text: "Ask me anything about your TCM diagnosis report!",
      quickQuestions: "Quick questions",
    },
    floatingButton: "Ask about your report",
  },

  heartCompanion: {
    title: "Heart Companion",
    subtitle: "Your friend for emotional wellness",
    placeholder: "Share what's on your mind...",
    thinking: "Thinking...",
    suggestions: [
      "I'm feeling stressed",
      "I need someone to talk to",
      "How can I manage my emotions?",
      "Tell me about TCM and emotions",
    ],
    emptyState: {
      text: "Hi! I'm here to listen. How are you feeling today?",
      quickQuestions: "You might want to talk about:",
    },
  },

  // App Download Section
  appDownload: {
    title: "Take Your Health Journey Anywhere",
    subtitle:
      "Download the Sihat TCM mobile app for on-the-go diagnosis, health tracking, and personalized TCM recommendations.",
    appStore: "Download on the App Store",
    googlePlay: "Get it on Google Play",
    comingSoonTitle: "Coming Soon!",
    comingSoonDesc:
      "The Sihat TCM mobile app is currently under development. We are working hard to bring you the best experience on iOS and Android. Stay tuned!",
    notifyMe: "Notify Me",
    close: "Close",
    downloadApk: "Download APK",
    directDownload: "Direct Download",
  },
  mobileFeatures: {
    pageTitle: "Sihat TCM Mobile App",
    pageSubtitle: "Your health companion, anytime, anywhere",
    heroTitle: "Mobile-Exclusive Features",
    heroDescription:
      "Discover powerful features available only on mobile: camera pulse measurement, health app integration, biometric security, offline mode, and more. Experience TCM health management like never before.",
    exclusiveFeaturesTitle: "Features Only Available on Mobile",
    exclusiveFeaturesSubtitle:
      "These powerful features are designed specifically for mobile devices and take full advantage of your phone's capabilities.",
    webFeaturesTitle: "Also Available on Web",
    webFeaturesSubtitle:
      "These features are available on both web and mobile, with enhanced mobile experience.",
    diagnosis: {
      title: "Four Pillars Diagnosis",
      description:
        "AI-powered TCM diagnosis using Observation, Listening, Inquiry, and Pulse examination methods.",
    },
    mealPlanner: {
      title: "AI Meal Planner",
      description:
        "Personalized 7-day meal plans based on your TCM constitution with shopping lists and food suitability checker.",
    },
    healthTracking: {
      title: "Health Tracking",
      description:
        "Track your vitality scores, diagnosis patterns, and health trends over time with visual analytics.",
    },
    snoreAnalysis: {
      title: "Snore Analysis",
      description:
        "AI-powered sleep sound recording and analysis for snoring and sleep apnea indicators.",
    },
    vitalityRhythm: {
      title: "Vitality Rhythm",
      description:
        "Meridian Organ Clock, 24 Solar Terms guidance, and seasonal health tips aligned with TCM principles.",
    },
    qiDose: {
      title: "Qi Dose & Qi Garden",
      description:
        "Gamified TCM exercise routines (Baduanjin) and virtual herb gardening for wellness.",
    },
    community: {
      title: "Circle of Health",
      description:
        "Constitution-based anonymous support communities for sharing wellness experiences.",
    },
    familyCare: {
      title: "Family Health Management",
      description:
        "Manage health profiles for your entire family with separate tracking and recommendations.",
    },
    herbShop: {
      title: "One-Click Remedy",
      description:
        "Integrated Herb Shop for purchasing recommended herbal formulas and TCM remedies.",
    },
    digitalTwin: {
      title: "Digital Twin",
      description:
        "Live visualization of organ health status based on your TCM diagnosis and constitution.",
    },
    cameraPPG: {
      title: "Camera Pulse Measurement",
      description:
        "Revolutionary camera-based pulse measurement using photoplethysmography (PPG). Simply place your finger over the camera with flash to measure your heart rate - no additional devices needed.",
    },
    healthAppSync: {
      title: "Health App Integration",
      description:
        "Seamlessly sync with Apple Health, Google Fit, and Samsung Health. Automatically import steps, sleep, heart rate, and other vital metrics for comprehensive health tracking.",
    },
    biometricAuth: {
      title: "Biometric Security",
      description:
        "Secure your health data with Face ID, Touch ID, or fingerprint authentication. Quick and secure access to your personal health information.",
    },
    offlineMode: {
      title: "Offline Diagnosis",
      description:
        "Complete TCM diagnosis even without internet connection. All core features work offline, with automatic sync when you reconnect.",
    },
    pushNotifications: {
      title: "Smart Notifications",
      description:
        "Personalized push notifications for medication reminders, health check-ups, seasonal TCM tips, and meridian organ clock alerts. Never miss important health moments.",
    },
    wearableIntegration: {
      title: "Wearable Device Support",
      description:
        "Connect with smartwatches and fitness trackers via Bluetooth. Real-time health data from your wearable devices automatically integrated into your TCM diagnosis.",
    },
    enhancedCamera: {
      title: "Enhanced Camera Capture",
      description:
        "Advanced camera features for tongue, face, and body analysis with burst mode, timer, gesture controls, and quality overlays. Optimized for accurate TCM visual diagnosis.",
    },
    hapticFeedback: {
      title: "Haptic Feedback",
      description:
        "Tactile feedback for every interaction. Feel the difference with haptic responses that enhance your mobile experience and make navigation intuitive.",
    },
    benefitsTitle: "Why Choose Sihat TCM Mobile?",
    benefit1: "Multi-language support (English, Chinese, Malay)",
    benefit2: "Offline diagnosis capabilities",
    benefit3: "Secure cloud sync across devices",
    benefit4: "Real-time AI-powered insights",
    benefit5: "Privacy-first health data management",
    benefit6: "Regular updates with new features",
    ctaTitle: "Ready to Start Your Health Journey?",
    ctaDescription:
      "Download the Sihat TCM mobile app today and experience the future of TCM health management.",
    navigation: {
      logout: "Logout",
      home: "Home",
      groupAssessment: "Assessment",
      groupTreatment: "Treatment",
      groupCultivation: "Care Hub",
      groupAccount: "Account",
    },
    healthPortfolio: {
      title: "Basic Profile",
      personalDetails: "Personal Details",
      healthMetrics: "Health Metrics",
      medicines: {
        title: "Medicines in Use",
        subtitle: "Medicines and supplements you are currently taking.",
        addMedicine: "Add Medicine",
        name: "Medicine / Supplement Name",
        dosage: "Dosage",
        frequency: "Frequency",
        notes: "Notes",
        active: "Currently taking",
        noMedicines:
          "No medicines recorded. Add your current medications to improve your next diagnosis.",
        saveMedicine: "Save Medicine",
        deleteConfirm: "Are you sure you want to remove this medicine?",
      },
      symptomsHistory: {
        title: "Symptoms History",
        subtitle: "A record of symptoms you've reported in past diagnoses.",
        noHistory: "No symptom history yet.",
        lastReported: "Last reported: {date}",
      },
      documents: {
        title: "Medical Reports",
        subtitle: "Your uploaded diagnostic reports and medical documents.",
      },
      useInDiagnosis: {
        title: "Default for Diagnosis",
        description: "These details will be used as default for your next diagnosis assessment.",
      },
    },
    circleOfHealth: {
      title: "Circle of Health",
      subtitle: "Connect with others on similar healing journeys",
      joinCommunity: "Join Community",
      shareExperience: "Share Experience",
    },
    historyTable: {
      good: "Good",
      fair: "Fair",
      needsAttention: "Needs Attention",
      sortByDate: "Date",
      sortByScore: "Score",
      sortByDiagnosis: "Diagnosis",
    },
  },
  constitutions: {
    balanced: "Neutral (Ping He)",
    qiDeficiency: "Qi Deficiency",
    yangDeficiency: "Yang Deficiency",
    yinDeficiency: "Yin Deficiency",
    phlegmDamp: "Phlegm-Dampness",
    dampHeat: "Damp-Heat",
    bloodStasis: "Blood Stasis",
    qiStagnation: "Qi Stagnation",
    special: "Special Diathesis",
  },
  qiDose: {
    title: "Qi Dose",
    subtitle: "Micro-dose your vitality with 8-minute TCM routines",
    promoTitle: "Ready for your daily 8-minute movement?",
    promoDesc:
      "Based on your TCM constitution, we've prepared a micro-dose of vitality to regulate your inner energy. No equipment needed.",
    startFlow: "START FLOW",
    eightMinuteBrocade: "The 8-Minute Brocade",
    eightMinuteBrocadeDesc: "Bite-sized movements from Baduanjin to regulate your inner energy.",
    deskFriendly: "Desk-Friendly Circuits",
    deskFriendlyDesc: "Stay energized and focused even in a small office cubicle.",
    feelingTired: "Feeling Tired?",
    backPain: "Back Pain?",
    stressed: "Stressed?",
    meridianSlap: "The Meridian Slap (Paida)",
    meridianSlapDesc: "Energize instantly by patting along your limbs.",
    ironOx: "The Iron Ox Ploughs the Land",
    ironOxDesc: "Target belly stagnation with Five Animal Frolics movements.",
    digitalDetox: "Digital Detox Eyes",
    digitalDetoxDesc: "Relieve screen fatigue with daily acupressure.",
    cultivateQi: "Cultivate Your Qi",
    danTianFilling: "Dan Tian Filling",
    danTianDesc: "Your energy reservoir is growing. Keep moving!",
    unlockScrolls: "Unlock Scrolls",
    startExercise: "Start Exercise",
    sifuVoice: "Sifu's Guidance",
    xRayVision: "Meridian X-Ray",
    quickFix: "60-Second Quick Fix",
    minutes: "minutes",
    seconds: "seconds",
    achievements: "Achievements",
    streak: "Cultivation Streak",
    nextScroll: "Next Scroll",
    gardenTab: "Qi Garden",
    practicesTab: "Daily Practices",
  },
  qiGarden: {
    title: "Qi Garden",
    essence: "Essence",
    water: "Water Droplets",
    myGarden: "My Garden",
    gardenDesc: "Nurture your virtual TCM herbs through daily healthy habits.",
    waterPlant: "Water Plant",
    harvest: "Harvest",
    nurture: "Nurture",
    growth: "Growth",
    witherWarning: "Your garden is withering! Complete an activity to save it.",
    essenceEarned: "You earned {amount} Essence!",
    waterEarned: "You earned 1 Water Droplet!",
    herbGinseng: "Ginseng",
    herbReishi: "Reishi Mushroom",
    herbGoji: "Goji Berry",
    couponUnlocked: "Coupon Unlocked!",
    redeemCoupon: "Redeem for 10% Discount",
    level: "Level",
    inventory: "Inventory",
    shop: "Herb Shop",
    habits: {
      logMeal: "Log a Meal",
      doExercise: "Qi Dose Exercise",
      checkIn: "Daily Check-in",
    },
  },
  digitalTwin: {
    title: "Live Digital Twin",
    heart: "Heart",
    lungs: "Lungs",
    liver: "Liver",
    spleen: "Spleen",
    kidneys: "Kidneys",
    activeFocus: "Active Focus",
    restoring: "Restoring",
    description:
      "Your Digital Twin visualizes energy flows based on your TCM reports. Red areas indicate active heat or stagnation being addressed.",
  },
  healingGarden: {
    title: "Healing Garden", // formerly Apricot Grove
    subtitle: "Support groups based on your TCM constitution",
    myCircles: "My Circles",
    anonymousMember: "Anonymous Member",
    memberCount: "{count} members",
    joined: "Joined",
    join: "Join Circle",
    shareRemedy: "Share a Remedy",
    postPlaceholder: "Share your progress or a meal photo...",
    successStory: "Success Story",
    mealShare: "Meal Share",
    welcomeMessage:
      "Welcome to your community! Here you can share anonymously with others of the same constitution.",
    groups: {
      dampHeat: "Damp-Heat Detox Group",
      qiDeficiency: "Qi Vitality Circle",
      yangDeficiency: "Yang Warming Tribe",
      yinDeficiency: "Yin Nourishing Community",
      phlegmDamp: "Dampness Clearing Squad",
      bloodStasis: "Flow & Harmony Group",
      qiStagnation: "Emotional Balance Circle",
      balanced: "Maintenance & Longevity",
      special: "Special Care Group",
    },
  },
  familyManagement: {
    title: "Family Care",
    subtitle: "Manage health profiles for your loved ones",
    addMember: "Add Member",
    membersCount: "{count} family members",
    memberRelationship: "Relationship",
    lastDiagnosis: "Last Diagnosis",
    viewHistory: "View Health History",
    startDiagnosis: "New Diagnosis",
    noDiagnosis: "No diagnosis yet",
    relationships: {
      self: "Myself",
      mother: "Mother",
      father: "Father",
      spouse: "Spouse",
      child: "Child",
      sibling: "Sibling",
      other: "Other",
    },
    addForm: {
      title: "Add Family Member",
      name: "Full Name",
      age: "Age",
      gender: "Gender",
      relationship: "Relationship",
      medicalHistory: "Medical History (Optional)",
      submit: "Create Profile",
      cancel: "Cancel",
    },
    scenario: {
      title: "Quick Actions",
      trackMother: "Track Mother's Health",
      uploadTongue: "Upload Tongue Photo",
      recentActivity: "Recent Family Activity",
    },
  },
  // Five Elements Radar
  fiveElementsRadar: {
    title: "Five Elements Health Radar",
    subtitle:
      "Traditional Chinese Medicine organ health assessment based on the Five Elements theory",
    needsAttention: "Need Attention",
    currentStatus: "Current Status",
    recommendations: "Recommendations",
    historicalTrend: "Historical Trend",
    legend: {
      title: "Five Elements (五行) Theory",
    },
    organs: {
      liver: "Liver (Wood)",
      heart: "Heart (Fire)",
      spleen: "Spleen (Earth)",
      lung: "Lung (Metal)",
      kidney: "Kidney (Water)",
    },
    descriptions: {
      liver:
        "The Liver (Wood element) governs the smooth flow of Qi and blood, stores blood, and controls the tendons. It is associated with emotional well-being and planning.",
      heart:
        "The Heart (Fire element) governs blood circulation and houses the Shen (spirit/mind). It controls consciousness, memory, and sleep.",
      spleen:
        "The Spleen (Earth element) governs digestion, transformation, and transportation of nutrients. It produces Qi and blood and controls the muscles.",
      lung: "The Lung (Metal element) governs Qi and respiration, controls the skin and body hair, and regulates water passages.",
      kidney:
        "The Kidney (Water element) stores Essence (Jing), governs birth, growth, reproduction, and development. It controls bones, marrow, and the brain.",
    },
    tips: {
      liver: {
        weak1: "Eat more green vegetables (spinach, broccoli, celery)",
        weak2: "Practice gentle stretching and Tai Chi",
        weak3: "Manage stress and avoid anger",
        weak4: "Get adequate sleep (11pm-3am is Liver meridian time)",
        normal1: "Continue eating green vegetables regularly",
        normal2: "Maintain emotional balance",
        normal3: "Keep regular sleep schedule",
      },
      heart: {
        weak1: "Eat red foods (red beans, goji berries, red dates)",
        weak2: "Practice meditation and deep breathing",
        weak3: "Avoid excessive excitement or stress",
        weak4: "Ensure good quality sleep",
        normal1: "Maintain joyful activities",
        normal2: "Continue mindfulness practices",
        normal3: "Stay socially connected",
      },
      spleen: {
        weak1: "Eat warm, cooked foods (avoid raw and cold)",
        weak2: "Include yellow foods (sweet potato, pumpkin)",
        weak3: "Eat regular meals at consistent times",
        weak4: "Avoid overthinking and excessive worry",
        normal1: "Continue regular meal schedule",
        normal2: "Keep digestive system healthy",
        normal3: "Maintain positive thinking",
      },
      lung: {
        weak1: "Eat white foods (pear, lotus root, white fungus)",
        weak2: "Practice deep breathing exercises",
        weak3: "Keep indoor air quality good",
        weak4: "Avoid cold and stay warm in autumn/winter",
        normal1: "Continue respiratory health practices",
        normal2: "Maintain good posture",
        normal3: "Fresh air exposure daily",
      },
      kidney: {
        weak1: "Eat black foods (black sesame, black beans, walnuts)",
        weak2: "Avoid overwork and excessive sexual activity",
        weak3: "Keep lower back and feet warm",
        weak4: "Get adequate rest and sleep",
        normal1: "Maintain work-life balance",
        normal2: "Continue healthy lifestyle",
        normal3: "Regular gentle exercise",
      },
    },
  },
  // Solar Terms (24节气)
  solarTerms: {
    currentTerm: "Current Solar Term",
    viewCalendar: "View Calendar",
    healthFocus: "Health Focus",
    recommendedFoods: "Recommended Foods",
    lifestyleAdvice: "Lifestyle Advice",
    focus: "Focus",
    current: "Current",
    fullCalendarTitle: "24 Solar Terms Calendar",
    year: "Year",
  },
  // TCM E-Commerce / Herb Shop
  herbShop: {
    title: "One-Click Remedy",
    subtitle: "Get your personalized herbal remedy delivered",
    buyNow: "Buy Now",
    addToCart: "Add to Cart",
    added: "Added!",
    loginToPurchase: "Login to purchase",
    loginToBuy: "Login to Buy",
    popular: "Popular",
    showDetails: "Show Details",
    hideDetails: "Hide Details",
    indications: "Indications",
    ingredients: "Ingredients",
    confirmOrder: "Confirm Your Order",
    orderDescription: "Your order will be processed by our pharmacy partner",
    fulfillmentBy: "Fulfilled by",
    orderNow: "Order via WhatsApp",
    loginRequired: "Login Required",
    loginDescription: "Please log in to purchase herbal remedies and track your orders.",
    memberBenefits: "Member Benefits:",
    benefit1: "Purchase personalized remedies",
    benefit2: "Track order history",
    benefit3: "Save diagnosis reports",
    loginNow: "Login Now",
    disclaimer:
      "⚠️ These products are for reference only. Please consult a licensed TCM practitioner before use.",
    productTypes: {
      teaBags: "Tea Bags",
      granules: "Granules",
      rawHerbs: "Raw Herbs",
      capsules: "Capsules",
    },
    deliveryInfo: "Delivery Information",
    estimatedDelivery: "Estimated Delivery",
    pharmacyPartner: "Pharmacy Partner",
    quantity: "Quantity",
    preparationTime: "Prep Time",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    viewCart: "View Cart",
    checkout: "Checkout",
    emptyCart: "Your cart is empty",
    subtotal: "Subtotal",
    shippingFee: "Shipping Fee",
    total: "Total",
    orderPlaced: "Order Placed!",
    orderConfirmation: "Your order has been placed. You will receive a confirmation via WhatsApp.",
    continueToPayment: "Continue to Payment",
    backToShop: "Back to Shop",
  },
};

export type TranslationKeys = typeof en;
