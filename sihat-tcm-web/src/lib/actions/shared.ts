"use server";

/**
 * Shared Utilities for Server Actions
 *
 * Common helper functions used across multiple action domains.
 *
 * @module actions/shared
 */

import { devLog } from "@/lib/systemLogger";

/**
 * Helper function to get mock symptoms based on diagnosis type
 */
export function getMockSymptomsForDiagnosis(diagnosis: string): string[] {
    const diagnosisLower = diagnosis.toLowerCase();

    if (diagnosisLower.includes("yin deficiency") || diagnosisLower.includes("阴虚")) {
        return ["Night sweats", "Insomnia", "Dry mouth", "Hot palms and soles"];
    } else if (diagnosisLower.includes("yang deficiency") || diagnosisLower.includes("阳虚")) {
        return ["Cold extremities", "Lower back pain", "Fatigue", "Frequent urination"];
    } else if (diagnosisLower.includes("qi deficiency") || diagnosisLower.includes("气虚")) {
        return ["Fatigue", "Shortness of breath", "Weak voice", "Spontaneous sweating"];
    } else if (diagnosisLower.includes("qi stagnation") || diagnosisLower.includes("气滞")) {
        return ["Chest tightness", "Irritability", "Bloating", "Sighing"];
    } else if (diagnosisLower.includes("blood deficiency") || diagnosisLower.includes("血虚")) {
        return ["Dizziness", "Palpitations", "Poor memory", "Pale complexion"];
    } else if (diagnosisLower.includes("damp heat") || diagnosisLower.includes("湿热")) {
        return ["Heavy feeling", "Sticky mouth", "Yellow discharge", "Urinary discomfort"];
    } else if (diagnosisLower.includes("wind-cold") || diagnosisLower.includes("风寒")) {
        return ["Chills", "Runny nose", "Body aches", "Headache"];
    } else if (diagnosisLower.includes("phlegm") || diagnosisLower.includes("痰")) {
        return ["Chest oppression", "Cough with phlegm", "Heaviness", "Foggy thinking"];
    }

    return ["Fatigue", "General discomfort", "Sleep issues"];
}

/**
 * Helper function to get mock medicines based on diagnosis type
 */
export function getMockMedicinesForDiagnosis(diagnosis: string): string[] {
    const diagnosisLower = diagnosis.toLowerCase();

    if (diagnosisLower.includes("yin deficiency") || diagnosisLower.includes("阴虚")) {
        return ["Liu Wei Di Huang Wan", "Zhi Bai Di Huang Wan"];
    } else if (diagnosisLower.includes("yang deficiency") || diagnosisLower.includes("阳虚")) {
        return ["Jin Gui Shen Qi Wan", "You Gui Wan"];
    } else if (diagnosisLower.includes("qi deficiency") || diagnosisLower.includes("气虚")) {
        return ["Si Jun Zi Tang", "Bu Zhong Yi Qi Tang"];
    } else if (diagnosisLower.includes("qi stagnation") || diagnosisLower.includes("气滞")) {
        return ["Xiao Yao San", "Chai Hu Shu Gan San"];
    } else if (diagnosisLower.includes("blood deficiency") || diagnosisLower.includes("血虚")) {
        return ["Si Wu Tang", "Gui Pi Tang"];
    } else if (diagnosisLower.includes("damp heat") || diagnosisLower.includes("湿热")) {
        return ["Ba Zheng San", "Long Dan Xie Gan Tang"];
    } else if (diagnosisLower.includes("wind-cold") || diagnosisLower.includes("风寒")) {
        return ["Gui Zhi Tang", "Ma Huang Tang"];
    } else if (diagnosisLower.includes("phlegm") || diagnosisLower.includes("痰")) {
        return ["Er Chen Tang", "Wen Dan Tang"];
    }

    return ["General TCM Formula"];
}

// Re-export devLog for convenience
export { devLog };
