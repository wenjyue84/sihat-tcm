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
        </>
    );
}
