import type { ElementType } from "react";

export interface Slide {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icons?: { icon: ElementType; label: string }[];
  bulletPoints?: string[];
  features?: { icon: ElementType; text: string; highlight?: boolean }[];
  isLanguageSlide?: boolean;
  mainIcon?: ElementType;
  trustBadge?: string;
  badgeIcon?: ElementType;
  badgeTextKey?: string;
}

export interface OnboardingTranslations {
  multiModal: string;
  multiModalSub: string;
  chatGptCant: string;
  tongueLabel: string;
  pulseLabel: string;
  voiceLabel: string;
  realDoctors: string;
  realDoctorsSub: string;
  doctorReview: string;
  guidedQuestions: string;
  notScraped: string;
  practitionerBacked: string;
  triage: string;
  triageSub: string;
  triageFeature: string;
  reportFeature: string;
  saveFeature: string;
  getStarted: string;
  getStartedSub: string;
  skip: string;
  next: string;
  start: string;
}

export type SupportedLanguage = "en" | "zh" | "ms";

export interface LanguageOption {
  code: SupportedLanguage;
  flag: string;
  name: string;
}
