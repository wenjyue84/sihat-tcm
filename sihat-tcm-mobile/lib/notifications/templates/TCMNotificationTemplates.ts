/**
 * TCM Notification Templates - Specialized notification templates for Traditional Chinese Medicine
 * 
 * Provides pre-configured notification templates for various TCM-related scenarios
 * including seasonal advice, constitution tips, medication reminders, and health alerts.
 */

import { NotificationTemplate } from '../interfaces/NotificationInterfaces';

export class TCMNotificationTemplates {
  private readonly templates: Record<string, NotificationTemplate> = {
    SEASONAL_ADVICE: {
      title: '🌿 Seasonal TCM Wisdom',
      body: 'Discover how to harmonize with the current season for optimal health.',
      category: 'health',
      priority: 'normal',
      data: {
        type: 'seasonal_advice',
        tcmSpecific: true,
        category: 'health'
      }
    },

    CONSTITUTION_TIPS: {
      title: '⚖️ Constitution Balance',
      body: 'Personalized tips based on your TCM constitution assessment.',
      category: 'health',
      priority: 'normal',
      data: {
        type: 'constitution_tips',
        tcmSpecific: true,
        category: 'health'
      }
    },

    MEDICATION_REMINDER: {
      title: '💊 Herbal Medicine Time',
      body: 'Time to take your prescribed herbal formula.',
      category: 'medication',
      priority: 'high',
      data: {
        type: 'medication_reminder',
        tcmSpecific: true,
        category: 'medication'
      }
    },

    EXERCISE_REMINDER: {
      title: '🧘 Qi Exercise Time',
      body: 'Practice your daily Qi exercises for energy balance.',
      category: 'exercise',
      priority: 'normal',
      data: {
        type: 'exercise_reminder',
        tcmSpecific: true,
        category: 'exercise'
      }
    },

    DIETARY_ADVICE: {
      title: '🍲 TCM Nutrition Tip',
      body: 'Nourish your body with foods that support your constitution.',
      category: 'diet',
      priority: 'normal',
      data: {
        type: 'dietary_advice',
        tcmSpecific: true,
        category: 'diet'
      }
    },

    SLEEP_HYGIENE: {
      title: '🌙 Sleep & Qi Restoration',
      body: 'Prepare for restorative sleep to replenish your Qi.',
      category: 'sleep',
      priority: 'normal',
      data: {
        type: 'sleep_hygiene',
        tcmSpecific: true,
        category: 'sleep'
      }
    },

    APPOINTMENT_REMINDER: {
      title: '📅 TCM Consultation',
      body: 'Your TCM consultation is coming up.',
      category: 'appointments',
      priority: 'high',
      data: {
        type: 'appointment_reminder',
        tcmSpecific: true,
        category: 'appointments'
      }
    },

    HEALTH_ALERT: {
      title: '⚠️ Health Alert',
      body: 'Important health information requires your attention.',
      category: 'health',
      priority: 'urgent',
      data: {
        type: 'health_alert',
        tcmSpecific: true,
        category: 'health'
      }
    },

    PULSE_REMINDER: {
      title: '🫀 Pulse Check Time',
      body: 'Time for your daily pulse self-assessment.',
      category: 'health',
      priority: 'normal',
      data: {
        type: 'pulse_reminder',
        tcmSpecific: true,
        category: 'health'
      }
    },

    TONGUE_EXAMINATION: {
      title: '👅 Tongue Examination',
      body: 'Perform your daily tongue examination for health insights.',
      category: 'health',
      priority: 'normal',
      data: {
        type: 'tongue_examination',
        tcmSpecific: true,
        category: 'health'
      }
    }
  };

  /**
   * Get a specific notification template
   */
  public getTemplate(templateType: string): NotificationTemplate | null {
    return this.templates[templateType] || null;
  }

  /**
   * Get all available templates
   */
  public getAllTemplates(): Record<string, NotificationTemplate> {
    return { ...this.templates };
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: string): NotificationTemplate[] {
    return Object.values(this.templates).filter(
      template => template.category === category
    );
  }

  /**
   * Get templates by priority
   */
  public getTemplatesByPriority(priority: string): NotificationTemplate[] {
    return Object.values(this.templates).filter(
      template => template.priority === priority
    );
  }

  /**
   * Create custom template with TCM defaults
   */
  public createCustomTemplate(
    title: string,
    body: string,
    category: string = 'health',
    priority: string = 'normal',
    customData: any = {}
  ): NotificationTemplate {
    return {
      title,
      body,
      category,
      priority,
      data: {
        type: 'custom',
        tcmSpecific: true,
        category,
        ...customData
      }
    };
  }

  /**
   * Get seasonal advice template with dynamic content
   */
  public getSeasonalTemplate(season: string): NotificationTemplate | null {
    const seasonalAdvice = {
      spring: {
        title: '🌸 Spring TCM Wisdom',
        body: 'Spring is the time to nourish your Liver Qi. Focus on gentle detox and fresh greens.'
      },
      summer: {
        title: '☀️ Summer TCM Wisdom',
        body: 'Summer supports Heart energy. Stay hydrated and enjoy cooling foods like cucumber.'
      },
      autumn: {
        title: '🍂 Autumn TCM Wisdom',
        body: 'Autumn nourishes Lung Qi. Focus on moistening foods and breathing exercises.'
      },
      winter: {
        title: '❄️ Winter TCM Wisdom',
        body: 'Winter strengthens Kidney energy. Warm foods and rest support your vital essence.'
      }
    };

    const advice = seasonalAdvice[season.toLowerCase()];
    if (!advice) return null;

    return {
      ...advice,
      category: 'health',
      priority: 'normal',
      data: {
        type: 'seasonal_advice',
        season,
        tcmSpecific: true,
        category: 'health'
      }
    };
  }

  /**
   * Get constitution-specific template
   */
  public getConstitutionTemplate(constitution: string): NotificationTemplate | null {
    const constitutionAdvice = {
      yang_deficiency: {
        title: '🔥 Yang Constitution Care',
        body: 'Warm foods and gentle exercise support your Yang energy. Avoid cold drinks.'
      },
      yin_deficiency: {
        title: '💧 Yin Constitution Care',
        body: 'Moistening foods and rest nourish your Yin. Include pears and quiet meditation.'
      },
      qi_deficiency: {
        title: '⚡ Qi Constitution Care',
        body: 'Gentle movement and nourishing foods build your Qi. Try light walking and warm soups.'
      },
      blood_stasis: {
        title: '🌊 Blood Circulation Care',
        body: 'Movement and warming foods promote circulation. Include ginger and regular exercise.'
      }
    };

    const advice = constitutionAdvice[constitution.toLowerCase()];
    if (!advice) return null;

    return {
      ...advice,
      category: 'health',
      priority: 'normal',
      data: {
        type: 'constitution_tips',
        constitution,
        tcmSpecific: true,
        category: 'health'
      }
    };
  }
}