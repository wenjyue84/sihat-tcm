import { motion } from "framer-motion";
import {
  Utensils,
  Leaf,
  MapPin,
  Dumbbell,
  Moon,
  Brain,
  Stethoscope,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Pill,
  ChefHat
} from "lucide-react";
import { HerbalFormulasSection } from "../HerbalFormulasSection";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ViewMode } from "./ViewSwitcher";

interface ReportRecommendationsProps {
  data: any;
  reportOptions: any;
  foodRecommendations: string[];
  foodsToAvoid: string[];
  recipes: string[];
  handleSectionClick: (question: string) => void;
  variants: any;
  viewMode?: ViewMode;
}

export function ReportRecommendations({
  data,
  reportOptions: opts,
  foodRecommendations,
  foodsToAvoid,
  recipes,
  handleSectionClick,
  variants,
  viewMode = "modern",
}: ReportRecommendationsProps) {
  // @ts-ignore
  const { t } = useLanguage();

  if (viewMode === "classic") {
    return (
      <motion.div variants={variants} className="space-y-8 font-serif">
        {/* Diet */}
        {opts.includeDietary !== false && (
          <div>
            <h3 className="text-lg font-bold uppercase mb-4 border-b border-stone-200">{t.dietaryRecommendations}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {foodRecommendations.length > 0 && (
                <div>
                  <h4 className="font-bold mb-2">{t.report.foodsToEat}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">{foodRecommendations.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
              {foodsToAvoid.length > 0 && (
                <div>
                  <h4 className="font-bold mb-2">{t.report.foodsToAvoid}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">{foodsToAvoid.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Exercise & Lifestyle */}
        {opts.includeLifestyle !== false && data.recommendations?.lifestyle && (
          <div>
            <h3 className="text-lg font-bold uppercase mb-4 border-b border-stone-200">{t.report.lifestyle}</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">{data.recommendations.lifestyle.map((l: string, i: number) => <li key={i}>{l}</li>)}</ul>
          </div>
        )}
        {/* Precautions - Classic */}
        {opts.includePrecautions && data.precautions && (
          <div className="border border-stone-300 p-4 bg-stone-50">
            <h3 className="font-bold uppercase text-red-800 mb-2">{t.report.precautionsAndWarnings}</h3>
            {data.precautions.warning_signs && <p className="text-sm">WARNING SIGNS: {data.precautions.warning_signs.join(", ")}</p>}
          </div>
        )}
      </motion.div>
    )
  }

  // Modern View
  return (
    <motion.div variants={variants} className="space-y-6">

      {/* Diet Card Group */}
      {opts.includeDietary !== false && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t.report.dietaryAdvice}</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Beneficial */}
            {foodRecommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                  {t.report.foodsToEat}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {foodRecommendations.map((food, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-100">
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid */}
            {foodsToAvoid.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  {t.report.foodsToAvoid}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {foodsToAvoid.map((food, i) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recipes */}
          {recipes.length > 0 && (
            <div className="mt-8 pt-6 border-t border-dashed border-stone-200">
              <h4 className="font-semibold text-stone-900 flex items-center gap-2 text-sm uppercase tracking-wide mb-4">
                <ChefHat className="w-4 h-4 text-amber-500" />
                {t.report.therapeuticRecipes}
              </h4>
              <div className="grid gap-3">
                {recipes.map((recipe, i) => (
                  <div key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-amber-900/80 text-sm font-medium">
                    {recipe}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid for Lifestyle / Exercise / Acupoints */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Lifestyle */}
        {opts.includeLifestyle !== false && data.recommendations?.lifestyle && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <Header icon={Leaf} title={t.report.lifestyle} color="text-green-600" bg="bg-green-50" />
            <ul className="space-y-3 mt-4">
              {data.recommendations.lifestyle.map((tip: string, i: number) => (
                <ListItem key={i} text={tip} bulletColor="bg-green-400" />
              ))}
            </ul>
          </div>
        )}

        {/* Exercise */}
        {opts.includeExercise !== false && data.recommendations?.exercise && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <Header icon={Dumbbell} title={t.report.exercise} color="text-blue-600" bg="bg-blue-50" />
            <ul className="space-y-3 mt-4">
              {data.recommendations.exercise.map((ex: string, i: number) => (
                <ListItem key={i} text={ex} bulletColor="bg-blue-400" />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Acupoints & Herbal (Full Width if needed) */}
      {opts.includeAcupuncture !== false && data.recommendations?.acupoints && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
          <Header icon={MapPin} title={t.report.acupressurePoints} color="text-indigo-600" bg="bg-indigo-50" />
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {data.recommendations.acupoints.map((point: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50/30 rounded-xl">
                <div className="h-2 w-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <span className="text-stone-700 text-sm font-medium">{point}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-stone-500 text-center">💡 {t.report.massageTip}</p>
        </div>
      )}

      {/* Herbal Formulas */}
      {opts.suggestMedicine && data.recommendations?.herbal_formulas && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 overflow-hidden">
          <Header icon={Pill} title={t.report.herbalFormulas} color="text-stone-600" bg="bg-stone-100" />
          <div className="mt-4">
            <HerbalFormulasSection
              formulas={data.recommendations.herbal_formulas}
              reportId={data.timestamp ? `report-${new Date(data.timestamp).getTime()}` : undefined}
              onSectionClick={handleSectionClick}
            />
          </div>
        </div>
      )}

      {/* Precautions */}
      {opts.includePrecautions && data.precautions && (
        <div className="bg-rose-50 rounded-3xl p-6 shadow-sm border border-rose-100">
          <Header icon={AlertTriangle} title={t.report.precautionsAndWarnings} color="text-rose-700" bg="bg-white" />
          <div className="mt-4 space-y-4">
            {data.precautions.warning_signs && (
              <div>
                <p className="text-xs font-bold text-rose-800 uppercase mb-2">{t.report.warningSigns}</p>
                <ul className="space-y-1">
                  {data.precautions.warning_signs.map((s: string, i: number) => <li key={i} className="text-rose-900/80 text-sm">• {s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

    </motion.div>
  );
}

const Header = ({ icon: Icon, title, color, bg }: any) => (
  <div className="flex items-center gap-3">
    <div className={`p-2 rounded-xl ${bg} ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
  </div>
);

const ListItem = ({ text, bulletColor }: any) => (
  <li className="flex gap-3 text-stone-600 text-sm leading-relaxed">
    <div className={`h-1.5 w-1.5 rounded-full ${bulletColor} mt-2 shrink-0`} />
    <span>{text}</span>
  </li>
);
