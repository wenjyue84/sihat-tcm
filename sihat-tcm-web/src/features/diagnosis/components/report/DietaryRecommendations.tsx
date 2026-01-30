import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Utensils, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DietaryRecommendationsProps {
  foodRecs: string[];
  avoidRecs: string[];
  recipes: string[];
  includeDietary: boolean;
  onSectionClick: (q: string) => void;
}

export function DietaryRecommendations({
  foodRecs,
  avoidRecs,
  recipes,
  includeDietary,
  onSectionClick,
}: DietaryRecommendationsProps) {
  const { t } = useLanguage();
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (
    !includeDietary ||
    (foodRecs.length === 0 && avoidRecs.length === 0 && recipes.length === 0)
  ) {
    return null;
  }

  return (
    <motion.div variants={item} className="space-y-6">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-stone-800">
            <button
              onClick={() =>
                onSectionClick(
                  "Please elaborate on the Dietary Therapy recommendations. Why are these foods beneficial for me?"
                )
              }
              className="flex items-center gap-2 hover:text-emerald-600 transition-colors text-left"
            >
              <Utensils className="h-5 w-5 text-orange-500" />
              <span className="underline decoration-dotted underline-offset-4 decoration-stone-400 hover:decoration-emerald-500">
                {t.report.dietaryAdvice} (食疗)
              </span>
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {foodRecs.length > 0 && (
            <div>
              <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                <Leaf className="h-4 w-4" /> {t.report.foodsToEat}
              </h4>
              <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
                {foodRecs.map((food: string, idx: number) => (
                  <li key={idx}>{food}</li>
                ))}
              </ul>
            </div>
          )}
          {recipes.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                <Utensils className="h-4 w-4" /> {t.report.therapeuticRecipes}
              </h4>
              <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
                {recipes.map((recipe: string, idx: number) => (
                  <li key={idx}>{recipe}</li>
                ))}
              </ul>
            </div>
          )}
          {avoidRecs.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {t.report.foodsToAvoid}
              </h4>
              <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
                {avoidRecs.map((food: string, idx: number) => (
                  <li key={idx}>{food}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
