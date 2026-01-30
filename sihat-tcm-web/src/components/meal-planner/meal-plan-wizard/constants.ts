import type { GeneratingMessage } from "./types";

export const GENERATING_MESSAGES: GeneratingMessage[] = [
  { emoji: "🔍", text: "Analyzing your TCM constitution..." },
  { emoji: "🌿", text: "Selecting harmonizing ingredients..." },
  { emoji: "⚖️", text: "Balancing Yin and Yang energies..." },
  { emoji: "🍲", text: "Creating your personalized menu..." },
  { emoji: "✨", text: "Adding therapeutic recipes..." },
  { emoji: "📋", text: "Organizing your shopping list..." },
];

export const MESSAGE_ROTATION_INTERVAL_MS = 2500;

export const DAILY_WISDOM_TIPS = [
  {
    title: "Eat warm foods in winter",
    description: "Warming foods like ginger and cinnamon help maintain body heat during cold seasons.",
  },
  {
    title: "Balance hot and cold foods",
    description: "Mix cooling vegetables with warming proteins to maintain internal harmony.",
  },
  {
    title: "Eat seasonally",
    description: "Choose foods that are naturally available in your region during each season.",
  },
];

export const QUICK_STATS_DEFAULT = {
  mealsPlanned: 0,
  recipesAvailable: "28+",
  shoppingItems: "—",
};
