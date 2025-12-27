"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Utensils, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { saveDietaryPreferences, DietaryPreferences } from "@/app/actions/meal-planner";

interface DietaryPreferencesFormProps {
  initialPreferences?: DietaryPreferences | null;
  onSaved: (prefs: DietaryPreferences) => void;
}

export const ALLERGIES = [
  { id: "nuts", key: "allergyNuts" },
  { id: "shellfish", key: "allergyShellfish" },
  { id: "dairy", key: "allergyDairy" },
  { id: "eggs", key: "allergyEggs" },
  { id: "gluten", key: "allergyGluten" },
  { id: "soy", key: "allergySoy" },
  { id: "sesame", key: "allergySesame" },
];

export const DIETARY_TYPES = [
  { id: "none", key: "dietNoRestrictions" },
  { id: "vegetarian", key: "dietVegetarian" },
  { id: "vegan", key: "dietVegan" },
  { id: "pescatarian", key: "dietPescatarian" },
  { id: "halal", key: "dietHalal" },
  { id: "kosher", key: "dietKosher" },
];

export function DietaryPreferencesForm({
  initialPreferences,
  onSaved,
}: DietaryPreferencesFormProps) {
  const { t } = useLanguage();
  const strings = t.patientDashboard.mealPlanner;

  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    allergies: initialPreferences?.allergies || [],
    dietary_type: initialPreferences?.dietary_type || "none",
    disliked_foods: initialPreferences?.disliked_foods || [],
    serving_size: initialPreferences?.serving_size || 1,
  });

  const [dislikedInput, setDislikedInput] = useState(
    initialPreferences?.disliked_foods?.join(", ") || ""
  );

  const handleAllergyToggle = (allergyId: string) => {
    setPreferences((prev) => {
      const current = prev.allergies || [];
      const updated = current.includes(allergyId)
        ? current.filter((id) => id !== allergyId)
        : [...current, allergyId];
      return { ...prev, allergies: updated };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Process disliked foods input
      const processedDisliked = dislikedInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const finalPreferences = {
        ...preferences,
        disliked_foods: processedDisliked,
      };

      const result = await saveDietaryPreferences(finalPreferences);

      if (result.success) {
        toast.success(strings.preferencesSaved);
        onSaved(finalPreferences);
      } else {
        toast.error(result.error || strings.savePreferencesError || "Failed to save preferences");
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || "An unexpected error occurred";
      toast.error(errorMessage);
      console.error("Error saving dietary preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
          {strings.dietaryPreferences}
        </h2>
        <p className="text-base text-slate-600 font-light">{strings.subtitle}</p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Allergies Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <Label className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                {strings.allergies}
              </Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {ALLERGIES.map((allergy) => (
                <label
                  key={allergy.id}
                  htmlFor={`allergy-${allergy.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <Checkbox
                    id={`allergy-${allergy.id}`}
                    checked={preferences.allergies?.includes(allergy.id)}
                    onCheckedChange={() => handleAllergyToggle(allergy.id)}
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    {(strings as any)[allergy.key] || allergy.id}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Dietary Type Section */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-slate-900 uppercase tracking-wide block">
              {strings.dietaryType}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DIETARY_TYPES.map((type) => {
                const isSelected = preferences.dietary_type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPreferences((prev) => ({ ...prev, dietary_type: type.id }))}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-blue-900" : "text-slate-700"
                      }`}
                    >
                      {(strings as any)[type.key] || type.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Disliked Foods Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-900 uppercase tracking-wide block">
              {strings.dislikedFoods}
            </Label>
            <Input
              placeholder={strings.dislikedFoodsPlaceholder}
              value={dislikedInput}
              onChange={(e) => setDislikedInput(e.target.value)}
              className="h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            />
            <p className="text-xs text-slate-500 font-light">
              Separate multiple items with commas
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Serving Size Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-900 uppercase tracking-wide block">
              {strings.servingSize}
            </Label>
            <Select
              value={String(preferences.serving_size)}
              onValueChange={(val) =>
                setPreferences((prev) => ({ ...prev, serving_size: parseInt(val) }))
              }
            >
              <SelectTrigger className="w-[200px] h-12 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={strings.servingSizePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 person</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="3">3 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="5">5 people</SelectItem>
                <SelectItem value="6">6 people</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 border-t border-slate-100">
          <Button
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm transition-all"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              strings.savePreferences
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
