"use client";

import { useState, useEffect } from "react";
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
import { Loader2, AlertTriangle, Settings } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import {
  saveDietaryPreferences,
  getDietaryPreferences,
  DietaryPreferences,
} from "@/app/actions/meal-planner";
import { ALLERGIES, DIETARY_TYPES } from "./DietaryPreferencesForm";

interface DietaryPreferencesSidebarProps {
  onPreferencesChange?: (prefs: DietaryPreferences) => void;
}

export function DietaryPreferencesSidebar({
  onPreferencesChange,
}: DietaryPreferencesSidebarProps) {
  const { t } = useLanguage();
  const strings = t.patientDashboard.mealPlanner;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    allergies: [],
    dietary_type: "none",
    disliked_foods: [],
    serving_size: 1,
  });

  const [dislikedInput, setDislikedInput] = useState("");

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const result = await getDietaryPreferences();
        if (result.success && result.data) {
          setPreferences(result.data);
          setDislikedInput(result.data.disliked_foods?.join(", ") || "");
          onPreferencesChange?.(result.data);
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, [onPreferencesChange]);

  const handleAllergyToggle = (allergyId: string) => {
    setPreferences((prev) => {
      const current = prev.allergies || [];
      const updated = current.includes(allergyId)
        ? current.filter((id) => id !== allergyId)
        : [...current, allergyId];
      const newPrefs = { ...prev, allergies: updated };
      onPreferencesChange?.(newPrefs);
      return newPrefs;
    });
  };

  const handleDietaryTypeChange = (typeId: string) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, dietary_type: typeId };
      onPreferencesChange?.(newPrefs);
      return newPrefs;
    });
  };

  const handleServingSizeChange = (size: string) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, serving_size: parseInt(size) };
      onPreferencesChange?.(newPrefs);
      return newPrefs;
    });
  };

  const handleDislikedFoodsChange = (value: string) => {
    setDislikedInput(value);
    const processed = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setPreferences((prev) => {
      const newPrefs = { ...prev, disliked_foods: processed };
      onPreferencesChange?.(newPrefs);
      return newPrefs;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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
        onPreferencesChange?.(finalPreferences);
      } else {
        toast.error(
          result.error || strings.savePreferencesError || "Failed to save preferences"
        );
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.toString() || "An unexpected error occurred";
      toast.error(errorMessage);
      console.error("Error saving dietary preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden h-fit lg:sticky lg:top-6">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            Dietary Preferences
          </h3>
        </div>
        <p className="text-sm text-slate-600 font-light">
          {strings.subtitle}
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Allergies Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              {strings.allergies}
            </Label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {ALLERGIES.map((allergy) => (
              <label
                key={allergy.id}
                htmlFor={`sidebar-allergy-${allergy.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <Checkbox
                  id={`sidebar-allergy-${allergy.id}`}
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
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wide block">
            {strings.dietaryType}
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {DIETARY_TYPES.map((type) => {
              const isSelected = preferences.dietary_type === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleDietaryTypeChange(type.id)}
                  className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
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
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wide block">
            {strings.dislikedFoods}
          </Label>
          <Input
            placeholder={strings.dislikedFoodsPlaceholder}
            value={dislikedInput}
            onChange={(e) => handleDislikedFoodsChange(e.target.value)}
            className="h-10 text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
          />
          <p className="text-xs text-slate-500 font-light">
            Separate multiple items with commas
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Serving Size Section */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wide block">
            {strings.servingSize}
          </Label>
          <Select
            value={String(preferences.serving_size)}
            onValueChange={handleServingSizeChange}
          >
            <SelectTrigger className="w-full h-10 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500">
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
      <div className="px-6 pb-6 pt-4 border-t border-slate-100">
        <Button
          className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm transition-all"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Settings className="mr-2 h-4 w-4" />
              {strings.savePreferences}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

