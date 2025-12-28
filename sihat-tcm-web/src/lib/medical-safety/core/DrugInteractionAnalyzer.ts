/**
 * Drug Interaction Analyzer - Analyzes herb-drug interactions
 * 
 * Provides comprehensive analysis of potential interactions between
 * TCM herbs and Western medications using both knowledge base and AI analysis.
 */

import { generateText } from "ai";
import { getGoogleProvider } from "../../googleProvider";
import { logError } from "../../systemLogger";
import { 
  SafetyConcern, 
  DrugInteraction, 
  ValidationContext,
  InteractionAnalysisRequest,
  InteractionAnalysisResponse
} from '../interfaces/SafetyInterfaces';

export class DrugInteractionAnalyzer {
  private readonly context = 'DrugInteractionAnalyzer';
  private knownInteractions: Map<string, DrugInteraction[]> = new Map();

  constructor() {
    this.initializeKnownInteractions();
  }

  /**
   * Check for drug interactions in herbal recommendations
   */
  public async checkDrugInteractions(
    herbal_recommendations: string[],
    context: ValidationContext
  ): Promise<{ concerns: SafetyConcern[]; interactions: DrugInteraction[] }> {
    const concerns: SafetyConcern[] = [];
    const interactions: DrugInteraction[] = [];
    const medications = context.medical_history.current_medications;

    for (const herb of herbal_recommendations) {
      for (const medication of medications) {
        const interaction = await this.analyzeSpecificInteraction(herb, medication, context);
        if (interaction) {
          interactions.push(interaction);

          concerns.push({
            type: "drug_interaction",
            severity: this.mapSeverityToConcernLevel(interaction.severity),
            description: `${herb} may interact with ${medication}: ${interaction.clinical_significance}`,
            affected_recommendation: herb,
            evidence_level: "clinical_study",
            action_required: this.getActionRequired(interaction.severity),
          });
        }
      }
    }

    return { concerns, interactions };
  }

  /**
   * Analyze specific herb-drug interaction
   */
  public async analyzeSpecificInteraction(
    herb: string,
    medication: string,
    context?: ValidationContext
  ): Promise<DrugInteraction | null> {
    try {
      // First check known interactions
      const knownInteraction = this.checkKnownInteractions(herb, medication);
      if (knownInteraction) {
        return knownInteraction;
      }

      // Use AI analysis for unknown combinations
      return await this.performAIInteractionAnalysis(herb, medication, context);
    } catch (error) {
      logError(this.context, "Failed to analyze interaction", { error, herb, medication });
      
      // Return conservative interaction warning on error
      return {
        herb_or_food: herb,
        medication: medication,
        interaction_type: "toxic",
        severity: "moderate",
        mechanism: "Unknown - system error during analysis",
        clinical_significance: "Potential interaction cannot be ruled out",
        management: "Consult healthcare provider before combining",
      };
    }
  }

  /**
   * Get interaction management recommendations
   */
  public getInteractionManagement(interaction: DrugInteraction): {
    immediate_actions: string[];
    monitoring_requirements: string[];
    alternative_suggestions: string[];
    follow_up_recommendations: string[];
  } {
    const management = {
      immediate_actions: [] as string[],
      monitoring_requirements: [] as string[],
      alternative_suggestions: [] as string[],
      follow_up_recommendations: [] as string[]
    };

    switch (interaction.severity) {
      case 'severe':
        management.immediate_actions.push(
          'Discontinue herb immediately',
          'Contact healthcare provider urgently',
          'Monitor for adverse effects'
        );
        management.follow_up_recommendations.push(
          'Emergency medical evaluation if symptoms develop',
          'Medication level monitoring may be required'
        );
        break;

      case 'major':
        management.immediate_actions.push(
          'Avoid combination or use with extreme caution',
          'Consult healthcare provider before continuing'
        );
        management.monitoring_requirements.push(
          'Regular monitoring of medication levels',
          'Watch for signs of interaction'
        );
        break;

      case 'moderate':
        management.monitoring_requirements.push(
          'Monitor for effectiveness changes',
          'Watch for side effects',
          'Consider timing separation'
        );
        management.follow_up_recommendations.push(
          'Regular check-ins with healthcare provider',
          'Dose adjustments may be needed'
        );
        break;

      case 'minor':
        management.monitoring_requirements.push(
          'Minimal monitoring required',
          'Be aware of potential effects'
        );
        break;
    }

    // Add general alternative suggestions
    management.alternative_suggestions.push(
      'Consider herbs with similar therapeutic effects but no interaction',
      'Explore non-herbal TCM approaches (acupuncture, lifestyle)',
      'Discuss timing strategies with practitioner'
    );

    return management;
  }

  /**
   * Batch analyze multiple interactions
   */
  public async batchAnalyzeInteractions(
    requests: InteractionAnalysisRequest[]
  ): Promise<Map<string, DrugInteraction | null>> {
    const results = new Map<string, DrugInteraction | null>();
    
    // Process in batches to avoid overwhelming the AI service
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(async (request) => {
        const key = `${request.herb}_${request.medication}`;
        const result = await this.analyzeSpecificInteraction(
          request.herb, 
          request.medication, 
          request.context
        );
        return { key, result };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ key, result }) => {
        results.set(key, result);
      });

      // Small delay between batches
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Private helper methods

  private initializeKnownInteractions(): void {
    // Initialize common drug interactions
    this.knownInteractions.set("warfarin", [
      {
        herb_or_food: "ginkgo",
        medication: "warfarin",
        interaction_type: "synergistic",
        severity: "major",
        mechanism: "Increased bleeding risk due to antiplatelet effects",
        clinical_significance: "Significantly increased risk of bleeding",
        management: "Avoid combination or monitor INR closely",
      },
      {
        herb_or_food: "ginseng",
        medication: "warfarin",
        interaction_type: "antagonistic",
        severity: "moderate",
        mechanism: "May reduce anticoagulant effect",
        clinical_significance: "Reduced effectiveness of warfarin",
        management: "Monitor INR, may need dose adjustment",
      },
      {
        herb_or_food: "danshen",
        medication: "warfarin",
        interaction_type: "synergistic",
        severity: "major",
        mechanism: "Enhanced anticoagulant effects",
        clinical_significance: "Increased bleeding risk",
        management: "Avoid combination, monitor closely if used",
      }
    ]);

    this.knownInteractions.set("digoxin", [
      {
        herb_or_food: "hawthorn",
        medication: "digoxin",
        interaction_type: "synergistic",
        severity: "moderate",
        mechanism: "Additive cardiac effects",
        clinical_significance: "Increased risk of cardiac toxicity",
        management: "Monitor digoxin levels and cardiac function",
      }
    ]);

    this.knownInteractions.set("insulin", [
      {
        herb_or_food: "bitter melon",
        medication: "insulin",
        interaction_type: "synergistic",
        severity: "moderate",
        mechanism: "Additive hypoglycemic effects",
        clinical_significance: "Increased risk of hypoglycemia",
        management: "Monitor blood glucose closely, adjust doses as needed",
      }
    ]);

    this.knownInteractions.set("lithium", [
      {
        herb_or_food: "psyllium",
        medication: "lithium",
        interaction_type: "absorption_interference",
        severity: "moderate",
        mechanism: "Reduced lithium absorption",
        clinical_significance: "Decreased lithium effectiveness",
        management: "Separate administration by 2+ hours, monitor levels",
      }
    ]);
  }

  private checkKnownInteractions(herb: string, medication: string): DrugInteraction | null {
    const medicationInteractions = this.knownInteractions.get(medication.toLowerCase());
    if (!medicationInteractions) return null;

    return medicationInteractions.find(interaction => 
      interaction.herb_or_food.toLowerCase().includes(herb.toLowerCase()) ||
      herb.toLowerCase().includes(interaction.herb_or_food.toLowerCase())
    ) || null;
  }

  private async performAIInteractionAnalysis(
    herb: string,
    medication: string,
    context?: ValidationContext
  ): Promise<DrugInteraction | null> {
    try {
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
        messages: [{ role: "user", content: prompt }],
      });

      const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      
      const analysis: InteractionAnalysisResponse = JSON.parse(cleanText);

      if (analysis.has_interaction) {
        return {
          herb_or_food: herb,
          medication: medication,
          interaction_type: analysis.interaction_type,
          severity: analysis.severity,
          mechanism: analysis.mechanism,
          clinical_significance: analysis.clinical_significance,
          management: analysis.management,
        };
      }

      return null;
    } catch (error) {
      logError(this.context, "AI interaction analysis failed", { error, herb, medication });
      throw error;
    }
  }

  private mapSeverityToConcernLevel(severity: string): "low" | "medium" | "high" | "critical" {
    switch (severity) {
      case "severe": return "critical";
      case "major": return "high";
      case "moderate": return "medium";
      case "minor": return "low";
      default: return "medium";
    }
  }

  private getActionRequired(severity: string): SafetyConcern["action_required"] {
    switch (severity) {
      case "severe": return "avoid_completely";
      case "major": return "seek_medical_advice";
      case "moderate": return "seek_medical_advice";
      case "minor": return "monitor";
      default: return "seek_medical_advice";
    }
  }
}