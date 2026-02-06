/**
 * Emergency Detector
 *
 * Specialized component for detecting emergency conditions and symptoms.
 * Provides rapid identification of conditions requiring immediate medical attention.
 */

import { generateText } from "ai";
import { getGoogleProvider } from "../../googleProvider";
import { devLog, logError } from "../../systemLogger";
import {
  EmergencyCheckResult,
  EmergencyFlag,
  SafetyConcern,
  ValidationContext,
  SupportedLanguage,
} from "../interfaces/SafetyInterfaces";
import { DiagnosisReport } from "@/types/database";

export class EmergencyDetector {
  private context: string;
  private emergencyKeywords: Set<string> = new Set();
  private criticalSymptoms: Map<string, EmergencyFlag> = new Map();

  constructor(context: string = "EmergencyDetector") {
    this.context = context;
    this.initializeEmergencyDatabase();
  }

  /**
   * Detect emergency conditions from diagnosis report
   */
  async detectEmergencyConditions(
    diagnosisReport?: DiagnosisReport
  ): Promise<EmergencyCheckResult> {
    try {
      devLog("info", this.context, "Detecting emergency conditions", {
        hasDiagnosis: Boolean(diagnosisReport),
      });

      const concerns: SafetyConcern[] = [];
      const emergencyFlags: EmergencyFlag[] = [];

      if (!diagnosisReport) {
        return { concerns, emergency_flags: emergencyFlags };
      }

      // Check for emergency symptoms in diagnosis text
      const diagnosisText = this.extractDiagnosisText(diagnosisReport);
      const detectedEmergencies = await this.scanForEmergencySymptoms(diagnosisText);

      for (const emergency of detectedEmergencies) {
        emergencyFlags.push(emergency);
        concerns.push(this.createEmergencyConcern(emergency));
      }

      // Use AI for additional emergency detection
      const aiDetectedEmergencies = await this.aiEmergencyDetection(diagnosisText);
      for (const emergency of aiDetectedEmergencies) {
        emergencyFlags.push(emergency);
        concerns.push(this.createEmergencyConcern(emergency));
      }

      return { concerns, emergency_flags: emergencyFlags };
    } catch (error) {
      logError(this.context, "Emergency detection failed", { error });
      return { concerns: [], emergency_flags: [] };
    }
  }

  /**
   * Validate specific symptoms for emergency conditions
   */
  async validateEmergencySymptoms(symptoms: string[]): Promise<EmergencyFlag[]> {
    const emergencyFlags: EmergencyFlag[] = [];

    for (const symptom of symptoms) {
      if (this.isEmergencySymptom(symptom)) {
        const flag = await this.createEmergencyFlag(symptom);
        emergencyFlags.push(flag);
      }
    }

    // Check for symptom combinations that indicate emergencies
    const combinationFlags = this.checkSymptomCombinations(symptoms);
    emergencyFlags.push(...combinationFlags);

    return emergencyFlags;
  }

  /**
   * Get emergency guidelines for specific condition
   */
  async getEmergencyGuidelines(
    condition: string,
    language: SupportedLanguage = "en"
  ): Promise<{
    immediate_actions: string[];
    warning_signs: string[];
    when_to_call_911: string[];
    emergency_contacts: string[];
  }> {
    try {
      const prompt = `
        Provide emergency guidelines for the condition: "${condition}"
        
        Respond in ${language === "zh" ? "Chinese" : language === "ms" ? "Malay" : "English"} with JSON format:
        {
            "immediate_actions": ["action 1", "action 2", ...],
            "warning_signs": ["sign 1", "sign 2", ...],
            "when_to_call_911": ["situation 1", "situation 2", ...],
            "emergency_contacts": ["contact 1", "contact 2", ...]
        }

        Focus on:
        1. Immediate first aid or emergency actions
        2. Critical warning signs that indicate worsening
        3. Clear criteria for when to call emergency services
        4. Relevant emergency contact information
      `;

      const google = getGoogleProvider();
      const { text: responseText } = await generateText({
        model: google("gemini-2.5-pro"),
        messages: [{ role: "user", content: prompt }],
      });

      const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleanText);
    } catch (error) {
      logError(this.context, "Failed to get emergency guidelines", { error, condition });

      return {
        immediate_actions: [
          "Stay calm and assess the situation",
          "Call emergency services if condition is severe",
        ],
        warning_signs: ["Worsening symptoms", "Difficulty breathing", "Loss of consciousness"],
        when_to_call_911: [
          "Life-threatening symptoms",
          "Severe pain or distress",
          "Unconsciousness",
        ],
        emergency_contacts: ["Emergency Services: 999", "Poison Control: 1-800-222-1222"],
      };
    }
  }

  /**
   * Extract diagnosis text from report
   */
  private extractDiagnosisText(diagnosisReport: DiagnosisReport): string {
    const textParts: string[] = [];

    // Extract relevant text fields
    if (diagnosisReport.tcm_diagnosis) {
      textParts.push(JSON.stringify(diagnosisReport.tcm_diagnosis));
    }
    if (diagnosisReport.symptoms) {
      textParts.push(JSON.stringify(diagnosisReport.symptoms));
    }
    if (diagnosisReport.observations) {
      textParts.push(JSON.stringify(diagnosisReport.observations));
    }

    return textParts.join(" ").toLowerCase();
  }

  /**
   * Scan text for emergency symptoms
   */
  private async scanForEmergencySymptoms(text: string): Promise<EmergencyFlag[]> {
    const emergencyFlags: EmergencyFlag[] = [];

    for (const keyword of this.emergencyKeywords) {
      if (text.includes(keyword)) {
        const flag = this.criticalSymptoms.get(keyword);
        if (flag) {
          emergencyFlags.push(flag);
        } else {
          emergencyFlags.push(await this.createEmergencyFlag(keyword));
        }
      }
    }

    return emergencyFlags;
  }

  /**
   * Use AI for emergency detection
   */
  private async aiEmergencyDetection(diagnosisText: string): Promise<EmergencyFlag[]> {
    try {
      const prompt = `
        Analyze the following medical text for emergency conditions that require immediate medical attention:
        
        "${diagnosisText}"
        
        Respond with JSON format:
        {
            "emergencies_detected": [
                {
                    "condition": "condition name",
                    "symptoms": ["symptom1", "symptom2"],
                    "urgency": "immediate|urgent|semi_urgent",
                    "recommended_action": "specific action to take",
                    "reasoning": "why this is considered an emergency"
                }
            ]
        }
        
        Only flag true medical emergencies that require immediate professional care.
        Be conservative but thorough.
      `;

      const google = getGoogleProvider();
      const { text: responseText } = await generateText({
        model: google("gemini-2.5-pro"),
        messages: [{ role: "user", content: prompt }],
      });

      const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const analysis = JSON.parse(cleanText);

      return analysis.emergencies_detected.map((emergency: any) => ({
        condition: emergency.condition,
        symptoms: emergency.symptoms,
        urgency: emergency.urgency,
        recommended_action: emergency.recommended_action,
        emergency_contacts: ["Emergency Services: 999", "Hospital Emergency Department"],
      }));
    } catch (error) {
      logError(this.context, "AI emergency detection failed", { error });
      return [];
    }
  }

  /**
   * Check if symptom indicates emergency
   */
  private isEmergencySymptom(symptom: string): boolean {
    const symptomLower = symptom.toLowerCase();
    return Array.from(this.emergencyKeywords).some((keyword) => symptomLower.includes(keyword));
  }

  /**
   * Check symptom combinations for emergencies
   */
  private checkSymptomCombinations(symptoms: string[]): EmergencyFlag[] {
    const emergencyFlags: EmergencyFlag[] = [];
    const symptomText = symptoms.join(" ").toLowerCase();

    // Heart attack indicators
    if (
      symptomText.includes("chest pain") &&
      (symptomText.includes("shortness of breath") || symptomText.includes("nausea"))
    ) {
      emergencyFlags.push({
        condition: "Possible Heart Attack",
        symptoms: ["chest pain", "shortness of breath", "nausea"],
        urgency: "immediate",
        recommended_action: "Call 999 immediately, chew aspirin if not allergic",
        emergency_contacts: ["Emergency Services: 999"],
      });
    }

    // Stroke indicators
    if (
      (symptomText.includes("facial drooping") || symptomText.includes("arm weakness")) &&
      symptomText.includes("speech difficulty")
    ) {
      emergencyFlags.push({
        condition: "Possible Stroke",
        symptoms: ["facial drooping", "arm weakness", "speech difficulty"],
        urgency: "immediate",
        recommended_action: "Call 999 immediately, note time of symptom onset",
        emergency_contacts: ["Emergency Services: 999"],
      });
    }

    // Severe allergic reaction
    if (
      symptomText.includes("difficulty breathing") &&
      (symptomText.includes("swelling") || symptomText.includes("rash"))
    ) {
      emergencyFlags.push({
        condition: "Possible Anaphylaxis",
        symptoms: ["difficulty breathing", "swelling", "rash"],
        urgency: "immediate",
        recommended_action: "Call 999, use EpiPen if available",
        emergency_contacts: ["Emergency Services: 999"],
      });
    }

    return emergencyFlags;
  }

  /**
   * Create emergency flag
   */
  private async createEmergencyFlag(symptom: string): Promise<EmergencyFlag> {
    return {
      condition: symptom,
      symptoms: [symptom],
      urgency: "immediate",
      recommended_action: "Seek immediate emergency medical care",
      emergency_contacts: ["Emergency Services: 999", "Hospital Emergency Department"],
    };
  }

  /**
   * Create emergency concern
   */
  private createEmergencyConcern(emergency: EmergencyFlag): SafetyConcern {
    return {
      type: "condition_specific",
      severity: "critical",
      description: `Emergency condition detected: ${emergency.condition}`,
      affected_recommendation: "all",
      evidence_level: "clinical_study",
      action_required: "emergency_care",
    };
  }

  /**
   * Initialize emergency database
   */
  private initializeEmergencyDatabase(): void {
    // Critical emergency keywords
    this.emergencyKeywords = new Set([
      "chest pain",
      "difficulty breathing",
      "severe headache",
      "loss of consciousness",
      "severe bleeding",
      "stroke symptoms",
      "heart attack",
      "anaphylaxis",
      "severe abdominal pain",
      "high fever",
      "seizure",
      "poisoning",
      "severe burns",
      "choking",
      "cardiac arrest",
      "respiratory distress",
      "severe trauma",
      "overdose",
      "severe dehydration",
      "diabetic emergency",
    ]);

    // Pre-defined critical symptoms with detailed flags
    this.criticalSymptoms.set("chest pain", {
      condition: "Chest Pain",
      symptoms: ["chest pain", "pressure", "tightness"],
      urgency: "immediate",
      recommended_action: "Call 999 immediately, may indicate heart attack",
      emergency_contacts: ["Emergency Services: 999"],
    });

    this.criticalSymptoms.set("difficulty breathing", {
      condition: "Respiratory Distress",
      symptoms: ["difficulty breathing", "shortness of breath", "wheezing"],
      urgency: "immediate",
      recommended_action: "Call 999, ensure airway is clear",
      emergency_contacts: ["Emergency Services: 999"],
    });

    this.criticalSymptoms.set("loss of consciousness", {
      condition: "Unconsciousness",
      symptoms: ["loss of consciousness", "fainting", "unresponsive"],
      urgency: "immediate",
      recommended_action: "Call 999, check breathing and pulse",
      emergency_contacts: ["Emergency Services: 999"],
    });

    this.criticalSymptoms.set("severe bleeding", {
      condition: "Severe Hemorrhage",
      symptoms: ["severe bleeding", "heavy blood loss", "hemorrhage"],
      urgency: "immediate",
      recommended_action: "Call 999, apply direct pressure to wound",
      emergency_contacts: ["Emergency Services: 999"],
    });
  }

  /**
   * Add custom emergency keyword
   */
  addEmergencyKeyword(keyword: string, flag?: EmergencyFlag): void {
    this.emergencyKeywords.add(keyword.toLowerCase());

    if (flag) {
      this.criticalSymptoms.set(keyword.toLowerCase(), flag);
    }
  }

  /**
   * Get emergency statistics
   */
  getEmergencyStats(): {
    totalKeywords: number;
    totalCriticalSymptoms: number;
    urgencyBreakdown: Record<string, number>;
  } {
    const urgencyBreakdown: Record<string, number> = {
      immediate: 0,
      urgent: 0,
      semi_urgent: 0,
    };

    for (const flag of this.criticalSymptoms.values()) {
      urgencyBreakdown[flag.urgency]++;
    }

    return {
      totalKeywords: this.emergencyKeywords.size,
      totalCriticalSymptoms: this.criticalSymptoms.size,
      urgencyBreakdown,
    };
  }
}
