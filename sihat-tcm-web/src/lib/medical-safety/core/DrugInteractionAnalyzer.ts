/**
 * Drug Interaction Analyzer
 * 
 * Specialized component for analyzing drug-herb interactions.
 * Uses AI analysis and knowledge base for comprehensive interaction checking.
 */

import { generateText } from "ai";
import { getGoogleProvider } from "../../googleProvider";
import { devLog, logError } from "../../systemLogger";
import {
  DrugInteractionCheckResult,
  DrugInteraction,
  SafetyConcern,
  ValidationContext
} from "../interfaces/SafetyInterfaces";

export class DrugInteractionAnalyzer {
  private context: string;
  private knownInteractions: Map<string, DrugInteraction[]> = new Map();

  constructor(context: string = "DrugInteractionAnalyzer") {
    this.context = context;
    this.initializeKnownInteractions();
  }

  /**
   * Check for drug interactions with herbal recommendations
   */
  async checkDrugInteractions(
    herbalRecommendations: string[],
    validationContext: ValidationContext
  ): Promise<DrugInteractionCheckResult> {
    try {
      devLog("info", this.context, "Checking drug interactions", {
        herbCount: herbalRecommendations.length,
        medicationCount: validationContext.medical_history.current_medications.length
      });

      const concerns: SafetyConcern[] = [];
      const interactions: DrugInteraction[] = [];
      const medications = validationContext.medical_history.current_medications;

      for (const herb of herbalRecommendations) {
        for (const medication of medications) {
          const interaction = await this.analyzeSpecificInteraction(
            herb,
            medication,
            validationContext
          );
          
          if (interaction) {
            interactions.push(interaction);
            concerns.push(this.createInteractionConcern(interaction));
          }
        }
      }

      return { concerns, interactions };
    } catch (error) {
      logError(this.context, "Drug interaction check failed", { error });
      return { concerns: [], interactions: [] };
    }
  }

  /**
   * Analyze specific herb-drug interaction using AI
   */
  async analyzeSpecificInteraction(
    herb: string,
    medication: string,
    context?: ValidationContext
  ): Promise<DrugInteraction | null> {
    try {
      // First check known interactions
      const knownInteraction = this.checkKnownInteraction(herb, medication);
      if (knownInteraction) {
        return knownInteraction;
      }

      // Use AI for unknown combinations
      return await this.analyzeWithAI(herb, medication, context);
    } catch (error) {
      logError(this.context, "Failed to analyze specific interaction", { 
        error, 
        herb, 
        medication 
      });

      // Return conservative interaction warning on error
      return {
        herb_or_food: herb,
        medication: medication,
        interaction_type: "toxic",
        severity: "moderate",
        mechanism: "Unknown - system error during analysis",
        clinical_significance: "Potential interaction cannot be ruled out",
        management: "Consult healthcare provider before combining"
      };
    }
  }

  /**
   * Check known interactions from knowledge base
   */
  private checkKnownInteraction(herb: string, medication: string): DrugInteraction | null {
    const medicationLower = medication.toLowerCase();
    const herbLower = herb.toLowerCase();

    const interactions = this.knownInteractions.get(medicationLower);
    if (interactions) {
      return interactions.find(interaction => 
        interaction.herb_or_food.toLowerCase().includes(herbLower) ||
        herbLower.includes(interaction.herb_or_food.toLowerCase())
      ) || null;
    }

    return null;
  }

  /**
   * Analyze interaction using AI
   */
  private async analyzeWithAI(
    herb: string,
    medication: string,
    context?: ValidationContext
  ): Promise<DrugInteraction | null> {
    const prompt = `
      As a clinical pharmacist and TCM expert, analyze the potential interaction between:
      - TCM herb/substance: "${herb}"
      - Western medication: "${medication}"

      Provide a detailed analysis in JSON format:
      {
          "has_interaction": boolean,
          "interaction_type": "synergistic|antagonistic|toxic|absorption_interference",
          "severity": "minor|moderate|major|severe",
          "mechanism": "detailed mechanism of interaction",
          "clinical_significance": "clinical implications",
          "management": "how to manage this interaction",
          "evidence_level": "clinical_study|case_report|theoretical|traditional_knowledge"
      }

      Consider:
      1. Pharmacokinetic interactions (absorption, metabolism, excretion)
      2. Pharmacodynamic interactions (additive, synergistic, antagonistic effects)
      3. Traditional Chinese Medicine principles
      4. Published clinical studies and case reports
      5. Theoretical interactions based on known mechanisms

      Be conservative - if uncertain, err on the side of caution.
    `;

    const google = getGoogleProvider();
    const { text: responseText } = await generateText({
      model: google("gemini-2.5-pro"),
      messages: [{ role: "user", content: prompt }]
    });

    const cleanText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    const analysis = JSON.parse(cleanText);

    if (analysis.has_interaction) {
      return {
        herb_or_food: herb,
        medication: medication,
        interaction_type: analysis.interaction_type,
        severity: analysis.severity,
        mechanism: analysis.mechanism,
        clinical_significance: analysis.clinical_significance,
        management: analysis.management
      };
    }

    return null;
  }

  /**
   * Create safety concern from interaction
   */
  private createInteractionConcern(interaction: DrugInteraction): SafetyConcern {
    const severityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
      "minor": "low",
      "moderate": "medium", 
      "major": "high",
      "severe": "critical"
    };

    const actionMap: Record<string, SafetyConcern["action_required"]> = {
      "minor": "monitor",
      "moderate": "seek_medical_advice",
      "major": "seek_medical_advice", 
      "severe": "avoid_completely"
    };

    return {
      type: "drug_interaction",
      severity: severityMap[interaction.severity] || "medium",
      description: `${interaction.herb_or_food} may interact with ${interaction.medication}: ${interaction.clinical_significance}`,
      affected_recommendation: interaction.herb_or_food,
      evidence_level: "clinical_study",
      action_required: actionMap[interaction.severity] || "seek_medical_advice"
    };
  }

  /**
   * Initialize known interactions database
   */
  private initializeKnownInteractions(): void {
    // Warfarin interactions
    this.knownInteractions.set("warfarin", [
      {
        herb_or_food: "ginkgo",
        medication: "warfarin",
        interaction_type: "synergistic",
        severity: "major",
        mechanism: "Increased bleeding risk due to antiplatelet effects",
        clinical_significance: "Significantly increased risk of bleeding",
        management: "Avoid combination or monitor INR closely"
      },
      {
        herb_or_food: "ginseng",
        medication: "warfarin",
        interaction_type: "antagonistic",
        severity: "moderate",
        mechanism: "May reduce anticoagulant effect",
        clinical_significance: "Reduced effectiveness of warfarin",
        management: "Monitor INR, may need dose adjustment"
      },
      {
        herb_or_food: "garlic",
        medication: "warfarin",
        interaction_type: "synergistic",
        severity: "moderate",
        mechanism: "Antiplatelet effects may enhance bleeding risk",
        clinical_significance: "Increased bleeding risk",
        management: "Monitor for bleeding, consider dose adjustment"
      }
    ]);

    // Diabetes medications
    this.knownInteractions.set("metformin", [
      {
        herb_or_food: "bitter melon",
        medication: "metformin",
        interaction_type: "synergistic",
        severity: "moderate",
        mechanism: "Additive glucose-lowering effects",
        clinical_significance: "Risk of hypoglycemia",
        management: "Monitor blood glucose closely"
      }
    ]);

    // Blood pressure medications
    this.knownInteractions.set("lisinopril", [
      {
        herb_or_food: "hawthorn",
        medication: "lisinopril",
        interaction_type: "synergistic",
        severity: "moderate",
        mechanism: "Additive hypotensive effects",
        clinical_significance: "Risk of excessive blood pressure reduction",
        management: "Monitor blood pressure, adjust doses as needed"
      }
    ]);

    // Digoxin interactions
    this.knownInteractions.set("digoxin", [
      {
        herb_or_food: "licorice",
        medication: "digoxin",
        interaction_type: "toxic",
        severity: "major",
        mechanism: "Hypokalemia increases digoxin toxicity risk",
        clinical_significance: "Increased risk of digoxin toxicity",
        management: "Avoid combination, monitor potassium and digoxin levels"
      }
    ]);
  }

  /**
   * Add new interaction to knowledge base
   */
  addKnownInteraction(medication: string, interaction: DrugInteraction): void {
    const medicationLower = medication.toLowerCase();
    
    if (!this.knownInteractions.has(medicationLower)) {
      this.knownInteractions.set(medicationLower, []);
    }
    
    this.knownInteractions.get(medicationLower)!.push(interaction);
  }

  /**
   * Get all known interactions for a medication
   */
  getKnownInteractions(medication: string): DrugInteraction[] {
    return this.knownInteractions.get(medication.toLowerCase()) || [];
  }

  /**
   * Get interaction statistics
   */
  getInteractionStats(): {
    totalMedications: number;
    totalInteractions: number;
    severityBreakdown: Record<string, number>;
  } {
    let totalInteractions = 0;
    const severityBreakdown: Record<string, number> = {
      minor: 0,
      moderate: 0,
      major: 0,
      severe: 0
    };

    for (const interactions of this.knownInteractions.values()) {
      totalInteractions += interactions.length;
      
      for (const interaction of interactions) {
        severityBreakdown[interaction.severity]++;
      }
    }

    return {
      totalMedications: this.knownInteractions.size,
      totalInteractions,
      severityBreakdown
    };
  }
}