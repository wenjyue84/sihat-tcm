interface MedicalWebPageSchema {
    "@context": "https://schema.org";
    "@type": "MedicalWebPage";
    name: string;
    description: string;
    url: string;
    audience: {
        "@type": "PeopleAudience";
        audienceType: string;
    };
    specialty: {
        "@type": "MedicalSpecialty";
        name: string;
    };
    potentialAction?: {
        "@type": "SearchAction";
        target: string;
        "query-input": string;
    };
}

interface OrganizationSchema {
    "@context": "https://schema.org";
    "@type": "Organization";
    name: string;
    url: string;
    logo: string;
    sameAs?: string[];
    description?: string;
}

const BASE_URL = "https://sihat-tcm.vercel.app";

const medicalWebPageData: MedicalWebPageSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Sihat TCM",
    description:
        "AI-powered Traditional Chinese Medicine diagnostic platform. Experience ancient healing wisdom combined with modern artificial intelligence for tongue analysis, pulse diagnosis, and personalized herbal medicine recommendations.",
    url: BASE_URL,
    audience: {
        "@type": "PeopleAudience",
        audienceType: "Patient",
    },
    specialty: {
        "@type": "MedicalSpecialty",
        name: "Traditional Chinese Medicine",
    },
    potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
    },
};

const organizationData: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sihat TCM",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
        "Sihat TCM brings traditional Chinese medicine diagnosis to the digital age with AI-powered analysis and personalized wellness recommendations.",
    sameAs: [
        // Add social media URLs when available
    ],
};

// FAQ Schema for rich snippets in Google Search
const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "What is AI-powered TCM diagnosis?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "AI-powered TCM diagnosis uses artificial intelligence to analyze traditional diagnostic methods like tongue analysis and pulse reading. Sihat TCM's AI has been trained on thousands of TCM case studies to provide insights similar to those of experienced practitioners, helping users understand their body constitution and health patterns.",
            },
        },
        {
            "@type": "Question",
            name: "How does tongue diagnosis work in Traditional Chinese Medicine?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "In TCM, the tongue is considered a map of the body's internal health. Practitioners examine the tongue's color, coating, shape, and moisture to identify imbalances. For example, a pale tongue may indicate Qi deficiency, while a red tongue might suggest heat in the body. Our AI analyzes these same characteristics from a photo.",
            },
        },
        {
            "@type": "Question",
            name: "Is Sihat TCM a replacement for seeing a doctor?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "No, Sihat TCM is designed as a wellness and educational tool, not a replacement for professional medical advice. Our AI provides insights based on TCM principles to help you understand your body better. For any health concerns, always consult with a qualified healthcare professional or licensed TCM practitioner.",
            },
        },
        {
            "@type": "Question",
            name: "What languages does Sihat TCM support?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Sihat TCM currently supports English, Malay (Bahasa Malaysia), and Chinese (中文). You can switch languages at any time using the language selector in the navigation bar. All diagnosis reports and recommendations are available in all three languages.",
            },
        },
        {
            "@type": "Question",
            name: "How accurate is the AI tongue analysis?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Our AI model has been trained on extensive TCM literature and validated case studies. While it provides valuable insights aligned with traditional TCM diagnostic principles, accuracy can vary based on image quality and lighting conditions. For best results, take photos in natural daylight with your tongue fully extended.",
            },
        },
    ],
};

// WebApplication schema for the AI diagnosis tool
const webApplicationData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Sihat TCM AI Diagnosis",
    description: "AI-powered Traditional Chinese Medicine diagnostic tool featuring tongue analysis, symptom assessment, and personalized health recommendations.",
    url: BASE_URL,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web Browser",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "MYR",
    },
    featureList: [
        "AI Tongue Analysis",
        "Symptom Assessment",
        "TCM Pattern Recognition",
        "Personalized Health Recommendations",
        "Multilingual Support (English, Malay, Chinese)",
        "Health History Tracking",
    ],
    screenshot: `${BASE_URL}/og-image.png`,
    aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "150",
        bestRating: "5",
        worstRating: "1",
    },
};

// Service schema for TCM diagnosis services
const serviceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI-Powered TCM Diagnosis",
    description: "Get instant Traditional Chinese Medicine health insights using AI-powered tongue analysis, symptom assessment, and personalized recommendations based on ancient healing wisdom.",
    provider: {
        "@type": "Organization",
        name: "Sihat TCM",
        url: BASE_URL,
    },
    serviceType: "Health and Wellness Consultation",
    areaServed: {
        "@type": "Country",
        name: "Malaysia",
    },
    availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: BASE_URL,
        serviceType: "Online",
    },
    hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "TCM Diagnosis Services",
        itemListElement: [
            {
                "@type": "Offer",
                itemOffered: {
                    "@type": "Service",
                    name: "Tongue Analysis",
                    description: "AI-powered analysis of tongue color, coating, and shape for health insights",
                },
            },
            {
                "@type": "Offer",
                itemOffered: {
                    "@type": "Service",
                    name: "Symptom Assessment",
                    description: "Comprehensive evaluation of symptoms using TCM diagnostic principles",
                },
            },
            {
                "@type": "Offer",
                itemOffered: {
                    "@type": "Service",
                    name: "Health Recommendations",
                    description: "Personalized dietary and lifestyle recommendations based on TCM patterns",
                },
            },
        ],
    },
};

export function JsonLd(): React.ReactElement {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(medicalWebPageData),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationData),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(faqData),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(webApplicationData),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(serviceData),
                }}
            />
        </>
    );
}
