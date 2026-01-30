/**
 * TCM Domain - Daily Tips Utilities
 *
 * Utility functions for generating personalized TCM health tips.
 * Uses data from @/data/tcm/daily-tips-data
 */

import {
    SIMPLE_SOLAR_TERMS,
    ORGAN_CLOCK,
    CONSTITUTION_DIET_TIPS,
    GENERAL_TIPS,
    type DietTip,
} from "@/data/tcm/daily-tips-data";

export interface DailyTip {
    type: "diet" | "exercise" | "seasonal";
    icon: string;
    title: string;
    titleEn: string;
    summary: string;
    summaryEn: string;
    details: string;
    detailsEn: string;
    ingredients?: string[];
    ingredientsEn?: string[];
    method?: string;
    methodEn?: string;
    timestamp: number;
}

/**
 * Get current solar term based on date (simple lookup)
 * For full solar term utilities, use @/lib/domain/tcm/solar-terms
 */
function getSimpleSolarTerm(date: Date = new Date()) {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let closest = SIMPLE_SOLAR_TERMS[0] as (typeof SIMPLE_SOLAR_TERMS)[number];
    let minDiff = Infinity;

    for (const term of SIMPLE_SOLAR_TERMS) {
        const termDate = new Date(date.getFullYear(), term.month - 1, term.day);
        const diff = Math.abs(date.getTime() - termDate.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closest = term as (typeof SIMPLE_SOLAR_TERMS)[number];
        }
    }

    return closest;
}

/**
 * Get current organ based on time (Meridian Clock)
 */
export function getCurrentOrgan(date: Date = new Date()) {
    const hour = date.getHours();

    for (let i = 0; i < ORGAN_CLOCK.length; i++) {
        const current = ORGAN_CLOCK[i];
        const next = ORGAN_CLOCK[(i + 1) % ORGAN_CLOCK.length];
        const currentHour = current.hour;
        const nextHour = next.hour === 23 ? 24 : next.hour;

        if (currentHour <= hour && hour < nextHour) {
            return current;
        }
    }

    return ORGAN_CLOCK[0];
}

/**
 * Get constitution-based diet tip
 */
export function getConstitutionDietTip(constitutionType: string): DietTip {
    const tips = CONSTITUTION_DIET_TIPS[constitutionType] || GENERAL_TIPS;
    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
}

/**
 * Generate a daily tip based on user's constitution, time, and solar term
 */
export function generateDailyTip(constitutionType: string = "平和质"): DailyTip {
    const now = new Date();
    const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );

    const tipTypes: DailyTip["type"][] = ["diet", "exercise", "seasonal"];
    const tipType = tipTypes[dayOfYear % 3];

    if (tipType === "diet") {
        const dietTip = getConstitutionDietTip(constitutionType);
        return {
            type: "diet",
            icon: dietTip.icon,
            title: `${constitutionType}今日宜：${dietTip.food}`,
            titleEn: `Today's Food for ${constitutionType}: ${dietTip.food}`,
            summary: dietTip.effect,
            summaryEn: dietTip.effect,
            details: `${dietTip.food}适合${constitutionType}体质人群食用，具有${dietTip.effect}的功效。`,
            detailsEn: `${dietTip.food} is suitable for ${constitutionType} constitution.`,
            ingredients: [dietTip.food],
            ingredientsEn: [dietTip.food],
            method: "根据个人口味烹饪，保持食材新鲜。",
            methodEn: "Cook according to personal taste, keeping ingredients fresh.",
            timestamp: now.getTime(),
        };
    } else if (tipType === "exercise") {
        const organ = getCurrentOrgan(now);
        return {
            type: "exercise",
            icon: "🧘",
            title: `${organ.organ}经当令（${now.getHours()}时）`,
            titleEn: `${organ.organEn} Meridian Active (${now.getHours()}:00)`,
            summary: organ.advice,
            summaryEn: organ.advice,
            details: `现在是${organ.organ}经当令的时辰。${organ.advice}。`,
            detailsEn: `It is now the time when the ${organ.organEn} meridian is active. ${organ.advice}.`,
            timestamp: now.getTime(),
        };
    } else {
        const solarTerm = getSimpleSolarTerm(now);
        return {
            type: "seasonal",
            icon: "🌸",
            title: `${solarTerm.name}养生提醒`,
            titleEn: `${solarTerm.nameEn} Health Reminder`,
            summary: solarTerm.advice,
            summaryEn: solarTerm.advice,
            details: `${solarTerm.name}（${solarTerm.nameEn}）已至，${solarTerm.advice}。`,
            detailsEn: `${solarTerm.nameEn} has arrived. ${solarTerm.advice}.`,
            timestamp: now.getTime(),
        };
    }
}

/**
 * Check if we should show a new tip (24-hour rotation)
 */
export function shouldRefreshTip(lastTimestamp: number | null): boolean {
    if (!lastTimestamp) return true;
    const now = Date.now();
    const hoursSinceLastTip = (now - lastTimestamp) / (1000 * 60 * 60);
    return hoursSinceLastTip >= 24;
}

/**
 * Get a random gradient background color for the tip card
 */
export function getDailyGradient(): string {
    const gradients = [
        "from-emerald-50 to-teal-50",
        "from-blue-50 to-cyan-50",
        "from-purple-50 to-pink-50",
        "from-amber-50 to-orange-50",
        "from-rose-50 to-pink-50",
        "from-green-50 to-emerald-50",
        "from-indigo-50 to-blue-50",
        "from-yellow-50 to-amber-50",
    ];

    const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return gradients[dayOfYear % gradients.length];
}
