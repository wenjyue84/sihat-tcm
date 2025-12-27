import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Prisma Technology Solution Sdn. Bhd., a Johor-based technology company behind Sihat TCM. We specialize in AI, IoT, and digital transformation solutions.",
  openGraph: {
    title: "About Prisma Technology Solution | Sihat TCM",
    description:
      "Johor-based technology company specializing in AI, IoT, and digital health solutions. Creators of Sihat TCM.",
    type: "website",
  },
};

// LocalBusiness structured data for the company
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://sihat-tcm.vercel.app/about#business",
  name: "Prisma Technology Solution Sdn. Bhd.",
  description:
    "Johor-based technology company specializing in digital transformation, AI solutions, IoT systems, and the creators of Sihat TCM AI-powered health diagnosis platform.",
  url: "https://sihat-tcm.vercel.app/about",
  telephone: "", // Add phone number when available
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 31A, Jalan Enau 2, Taman Teratai",
    addressLocality: "Skudai",
    addressRegion: "Johor",
    postalCode: "81300",
    addressCountry: "MY",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 1.5355, // Approximate coordinates for Skudai, Johor
    longitude: 103.6591,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  sameAs: [
    // Add social media URLs when available
  ],
  priceRange: "$$",
  image: "https://sihat-tcm.vercel.app/logo.png",
  areaServed: {
    "@type": "Country",
    name: "Malaysia",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Technology Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI Solutions",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "IoT Systems",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Digital Transformation",
        },
      },
    ],
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-4">
              Prisma Technology Solution Sdn. Bhd. – Company Profile
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Corporate Information
                </h2>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>
                    <span className="font-medium">Company Name:</span> Prisma Technology Solution
                    Sdn. Bhd.
                  </li>
                  <li>
                    <span className="font-medium">Registration No.:</span> 202301030962 (1524885-A)
                  </li>
                  <li>
                    <span className="font-medium">Incorporation Date:</span> 9 August 2023
                  </li>
                  <li>
                    <span className="font-medium">Type:</span> Private Limited (Limited by Shares)
                  </li>
                  <li>
                    <span className="font-medium">MD/MSC Status:</span> MD/0001763
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Contact Details
                </h2>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>
                    <span className="font-medium">Registered Address:</span> 7A-1, Jalan Permas
                    1/25, Bandar Baru Permas Jaya, 81750 Masai, Johor, Malaysia
                  </li>
                  <li>
                    <span className="font-medium">Business Address:</span> No. 31A, Jalan Enau 2,
                    Taman Teratai, 81300 Skudai, Johor, Malaysia
                  </li>
                  <li>
                    <span className="font-medium">Nature of Business:</span> Business and other
                    applications, computer programming activities, human resource consultancy
                    services.
                  </li>
                </ul>
              </div>
            </div>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Core Business Focus
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Prisma Technology is a Johor-based technology company specializing in{" "}
                <strong>digital transformation solutions</strong> for businesses, particularly in
                the manufacturing sector. Its capabilities include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                <li>Software Design & Customized Development</li>
                <li>Industry 4.0 Integration</li>
                <li>Business & Grant Consultation Services</li>
                <li>Practical Business Systems – Payroll Systems, Leave Management Systems</li>
                <li>IoT & Intelligent Systems Development</li>
                <li>AI-Powered Chatbot Solutions</li>
                <li>Notion Management Solutions for workplace efficiency</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Key Products & Solutions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                    Manufacturing & IoT
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>
                      <strong>Prisma IoT Counter:</strong> Injection Machine Counter with heartbeat
                      monitoring.
                    </li>
                    <li>
                      <strong>Water Level Monitoring:</strong> Ultrasonic sensor-based system.
                    </li>
                    <li>
                      <strong>Digital Weighing System:</strong> IoT integration with MES.
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                    HR & Payroll
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>
                      <strong>Prisma Payroll Software:</strong> Automated calculation,
                      LHDN-compliant.
                    </li>
                    <li>Report generation (CP22, CP21, CP22A).</li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                    Artificial Intelligence
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>
                      <strong>AI Chatbot:</strong> Multilingual, knowledge-base integrated.
                    </li>
                    <li>Customizable workflows for automated customer service.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Notable Projects
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Federation Oil Project:</strong> IoT-based oil/water level monitoring.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Rui Sin Plastic, RSE, Teong Hin:</strong> IoT injection machine
                    monitoring.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Jian Sin Engineering & Others:</strong> Payroll system implementation.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Elly Trinh, Hair Spring, Pelangi Capsule:</strong> AI chatbot
                    deployment.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Hotel Management Systems:</strong> Self-check-in & digital operations.
                  </span>
                </li>
              </ul>
            </div>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Shareholding Structure
                </h2>
                <p className="text-sm text-gray-500 mb-2">(as of 26 March 2025)</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>
                    <strong>Teo Kae Shyong:</strong> 800 ordinary shares (80%)
                  </li>
                  <li>
                    <strong>Lew Wen Jyue:</strong> 100 ordinary shares (10%)
                  </li>
                  <li>
                    <strong>Chang Sin Chiek:</strong> 100 ordinary shares (10%)
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Board of Directors
                </h2>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>
                    <strong>Teo Kae Shyong:</strong> Director
                  </li>
                  <li>
                    <strong>Lew Wen Jyue:</strong> Director
                  </li>
                  <li>
                    <strong>Chang Sin Chiek:</strong> Director
                  </li>
                  <li>
                    <strong>Tey Guek Liang:</strong> Company Secretary
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
              <h2 className="text-xl font-bold mb-3 text-blue-800 dark:text-blue-300">
                Recognition & Appointments
              </h2>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Appointed Digitalisation Partner under Geran Digital PMKS Madani (GDPM)
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Effective 30 May 2025 to 29 May 2026
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Covering: Artificial Intelligence, Internet of Things (IoT)/Intelligent Systems, HR
                Payroll System/CRM.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Priority sectors:</strong> F&B, retail, professional services, smart
                agriculture, digital healthcare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
