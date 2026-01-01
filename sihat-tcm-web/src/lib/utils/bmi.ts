/**
 * BMI (Body Mass Index) calculation utilities
 * Used across diagnosis components for patient health assessment
 */

/**
 * Calculate BMI from weight and height
 * @param weight - Weight in kilograms
 * @param height - Height in centimeters
 * @returns BMI value
 */
export function calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

/**
 * BMI category information
 */
export interface BMICategory {
    category: string;
    color: string;
}

/**
 * Get BMI category based on BMI value with localized labels
 * @param bmi - BMI value
 * @param language - Language code ('en', 'zh', 'ms')
 * @returns Category name and color class
 */
export function getBMICategory(bmi: number, language: string = "en"): BMICategory {
    if (bmi < 18.5) {
        return {
            category: language === "zh" ? "偏瘦" : language === "ms" ? "Kurang berat" : "Underweight",
            color: "bg-blue-50 border-blue-300 text-blue-800",
        };
    }
    if (bmi < 25) {
        return {
            category: language === "zh" ? "正常" : language === "ms" ? "Normal" : "Normal",
            color: "bg-green-50 border-green-300 text-green-800",
        };
    }
    if (bmi < 30) {
        return {
            category:
                language === "zh" ? "超重" : language === "ms" ? "Berlebihan berat" : "Overweight",
            color: "bg-yellow-50 border-yellow-300 text-yellow-800",
        };
    }
    return {
        category: language === "zh" ? "肥胖" : language === "ms" ? "Obes" : "Obese",
        color: "bg-red-50 border-red-300 text-red-800",
    };
}
