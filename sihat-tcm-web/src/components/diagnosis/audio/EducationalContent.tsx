"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface EducationalSection {
    icon: string;
    title: string;
    content: string;
}

interface EducationalContentProps {
    title: string;
    subtitle: string;
    intro: string;
    sections: EducationalSection[];
    clickToLearnMore: string;
    didYouKnow: string;
    didYouKnowContent: string;
}

/**
 * Educational Content Section - TCM learning content with expandable sections
 */
export function EducationalContent({
    title,
    subtitle,
    intro,
    sections,
    clickToLearnMore,
    didYouKnow,
    didYouKnowContent,
}: EducationalContentProps) {
    const [expandedSection, setExpandedSection] = useState<number | null>(null);

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                    <span className="text-xl">📖</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <p className="text-gray-700 text-sm leading-relaxed">{intro}</p>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin">
                {sections.map((section, index) => (
                    <div
                        key={index}
                        className={`rounded-xl border transition-all duration-300 cursor-pointer ${expandedSection === index
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm"
                                : "bg-white border-gray-100 hover:border-green-200 hover:shadow-sm"
                            }`}
                        onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                    >
                        <div className="p-4 flex items-center gap-3">
                            <span className="text-2xl">{section.icon}</span>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{section.title}</h4>
                                {expandedSection !== index && (
                                    <p className="text-xs text-gray-500 mt-0.5">{clickToLearnMore}</p>
                                )}
                            </div>
                            <ChevronDown
                                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSection === index ? "rotate-180" : ""
                                    }`}
                            />
                        </div>
                        {expandedSection === index && (
                            <div className="px-4 pb-4 pt-0">
                                <div className="h-px bg-green-100 mb-3" />
                                <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Facts */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <span className="font-semibold text-purple-800 text-sm">{didYouKnow}</span>
                </div>
                <p className="text-sm text-purple-700 leading-relaxed">{didYouKnowContent}</p>
            </div>
        </div>
    );
}
