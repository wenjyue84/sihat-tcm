// API Configuration for Sihat TCM Mobile
// The API key can be fetched from the admin dashboard or use a local fallback

// Server URL - update this to your deployed URL in production
const WEB_SERVER_URL = __DEV__
  ? 'http://192.168.0.5:3000' // Local dev server IP
  : 'https://YOUR_PRODUCTION_URL.vercel.app'; // Update this for production

// Local fallback API key (used if server is unreachable)
const FALLBACK_API_KEY = 'AIzaSyDunuw1wCDTmnuQr9KTMeuKG7v8YypVmxg';

// Cached API key (fetched from server)
let cachedApiKey = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // Cache for 5 minutes

/**
 * Fetch the API key from the web server's admin dashboard
 * This ensures both web and mobile use the same API key
 */
export async function fetchApiKey() {
  try {
    // Check cache first
    if (cachedApiKey && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      return cachedApiKey;
    }

    console.log('[apiConfig] Fetching API key from server...');
    const response = await fetch(`${WEB_SERVER_URL}/api/config/gemini-key`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000, // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.apiKey) {
      console.log('[apiConfig] API key fetched from:', data.source);
      cachedApiKey = data.apiKey;
      lastFetchTime = Date.now();
      return data.apiKey;
    } else {
      throw new Error(data.error || 'No API key in response');
    }
  } catch (error) {
    console.warn('[apiConfig] Failed to fetch API key from server:', error.message);
    console.log('[apiConfig] Using fallback API key');
    return FALLBACK_API_KEY;
  }
}

/**
 * Get the current API key (sync version for backward compatibility)
 * Returns cached key or fallback
 */
export function getApiKeySync() {
  return cachedApiKey || FALLBACK_API_KEY;
}

export const API_CONFIG = {
  // Web server URL for API key fetching
  WEB_SERVER_URL,

  // Google Generative AI - use getApiKeySync() or fetchApiKey()
  GOOGLE_API_KEY: FALLBACK_API_KEY, // Default fallback, will be updated dynamically

  // Supabase
  SUPABASE_URL: 'https://jvokcruuowmvpthubjqh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2b2tjcnV1b3dtdnB0aHVianFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ2MDQsImV4cCI6MjA4MDQyMDYwNH0.-pjLCO6kJzNSdZukCWkBk35KRmzPZTW7EEsMEvsO-ZI',

  // AI Model Configuration
  DEFAULT_MODEL: 'gemini-2.0-flash',
  FALLBACK_MODEL: 'gemini-1.5-flash-latest',
};

// System prompt for TCM consultation
export const TCM_CONSULTATION_PROMPT = `You are a Traditional Chinese Medicine (TCM) physician conducting a patient consultation.

ROLE: Senior TCM Practitioner conducting 问诊 (Inquiry)
GOAL: Ask targeted diagnostic questions based on TCM principles

GUIDELINES:
1. Ask ONE focused question at a time
2. Build upon patient responses
3. Cover: symptoms, duration, triggers, sleep, diet, emotions, digestion
4. Use simple, clear language
5. Be empathetic and professional
6. After 4-6 exchanges, summarize findings

RESPONSE FORMAT:
- Keep responses concise (2-3 sentences max)
- End with a clear question
- **MANDATORY**: You MUST include 3-4 dynamic quick reply options in format: <OPTIONS>Option1, Option2, Option3, Option4</OPTIONS>

CRITICAL RULES FOR OPTIONS:
1. Options MUST be contextually relevant to the specific question you just asked
2. Options should NEVER be generic like "Yes, No, Sometimes, Not Sure"
3. Options should reflect realistic patient answers for that exact question
4. Include 3-4 options that cover the range of possible responses

EXAMPLES:
- For timing questions: "When does your headache typically occur? <OPTIONS>Morning after waking, Afternoon/evening, After meals, Before sleep</OPTIONS>"
- For location questions: "Where exactly do you feel the pain? <OPTIONS>Temples/sides, Top of head, Back of neck, Behind the eyes</OPTIONS>"
- For severity questions: "How would you describe the intensity? <OPTIONS>Mild and dull, Moderate throbbing, Sharp and intense, Comes in waves</OPTIONS>"
- For frequency questions: "How often do you experience this? <OPTIONS>Daily, A few times a week, Weekly, Occasionally</OPTIONS>"
- For symptom questions: "Do you notice any other symptoms with it? <OPTIONS>Nausea or dizziness, Sensitivity to light, Neck stiffness, No other symptoms</OPTIONS>"
- For diet questions: "What type of foods do you prefer? <OPTIONS>Cold/raw foods, Warm/cooked foods, Spicy foods, Sweet/rich foods</OPTIONS>"
- For sleep questions: "How is your sleep quality? <OPTIONS>Difficulty falling asleep, Wake up frequently, Wake up too early, Sleep well but still tired</OPTIONS>"

Remember: Every single response MUST end with an <OPTIONS> tag containing relevant, dynamic choices. This is essential for the mobile app interface.

CRITICAL FORMAT CHECK:
Your response should always look like this:
"[Your 2-3 sentence question here]"
<OPTIONS>Choice 1, Choice 2, Choice 3, Choice 4</OPTIONS>

If you fail to provide <OPTIONS>, the user will have to type everything manually, which is bad for mobile UX. ALWAYS INCLUDE OPTIONS.
`;

export const MEDICAL_REPORT_PROMPT = `You are an expert at analyzing medical documents and images.

TASK: Extract all relevant medical information from this image/document.

Extract:
- Patient information (if visible)
- Clinical findings
- Test results
- Diagnoses
- Any other medically relevant information

Format the output in a clear, structured way.

RESPOND IN STRICT JSON FORMAT:
{
  "text": "The formatted extracted text (as a single string, use \\n for newlines)"
}`;

export const MEDICINE_ANALYSIS_PROMPT = `You are an expert at analyzing images and documents to extract medicine information.

TASK: Analyze this image/document and extract ONLY medicine-related information.

IMPORTANT RULES:
1. First, determine if this image contains ANY medicine information (medicine bottles, pills, prescriptions, medicine packaging, pharmacy receipts, etc.)
2. If this is a food photo, random object, selfie, landscape, or anything NOT related to medicine, respond with:
   - is_medicine_image: false
   - text: A message explaining that no medicine was found in this image
3. If this IS a medicine-related image, extract:
   - Medicine names
   - Dosage information (if visible)
   - Quantity (if visible)
   - Instructions (if visible)

RESPOND IN STRICT JSON FORMAT:
{
  "is_medicine_image": boolean,
  "text": "The formatted text to display (as a single string, use \\n for newlines)",
  "warning": "Optional warning message if this looks like a medical report"
}`;
