"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Ruler, Scale, Info, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepperInput } from "@/components/ui/stepper-input";
import { QuickSelectChips } from "@/components/ui/quick-select-chips";
import { BasicInfoData } from "./types";
import { BMIExplanationModal } from "../BMIExplanationModal";
import { useLanguage } from "@/stores/useAppStore";

interface PersonalInfoStepProps {
  formData: BasicInfoData;
  setFormData: (data: BasicInfoData) => void;
}

// Quick select presets
const AGE_PRESETS = [18, 25, 35, 45, 55, 65];
const HEIGHT_PRESETS = [155, 160, 165, 170, 175, 180];
const WEIGHT_PRESETS = [50, 60, 70, 80, 90, 100];

// Animation variants for chips
const chipsVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    height: "auto",
    marginTop: 8,
    transition: { duration: 0.25 },
  },
};

type ActiveField = "age" | "height" | "weight" | null;
type FieldErrors = {
  name?: string;
  age?: string;
  height?: string;
  weight?: string;
};

/**
 * Combined step for personal information:
 * - Full Name + Gender (same row)
 * - Age, Height, Weight (with progressive disclosure for quick chips)
 * - Live BMI calculation
 */
export function PersonalInfoStep({ formData, setFormData }: PersonalInfoStepProps) {
  const { t } = useLanguage();
  const [showBMIModal, setShowBMIModal] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Calculate BMI if height and weight are filled
  const bmi =
    formData.height && formData.weight
      ? (parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)
      : null;

  // Validation functions
  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    return null;
  };

  const validateAge = (value: string): string | null => {
    if (!value) return "Age is required";
    const age = parseInt(value, 10);
    if (isNaN(age)) return "Please enter a valid age";
    if (age < 0 || age > 120) return "Please enter an age between 0 and 120";
    return null;
  };

  const validateHeight = (value: string): string | null => {
    if (!value) return null; // Optional field
    const height = parseFloat(value);
    if (isNaN(height)) return "Please enter a valid height";
    if (height < 100 || height > 250) return "Please enter a height between 100 and 250 cm";
    return null;
  };

  const validateWeight = (value: string): string | null => {
    if (!value) return null; // Optional field
    const weight = parseFloat(value);
    if (isNaN(weight)) return "Please enter a valid weight";
    if (weight < 20 || weight > 300) return "Please enter a weight between 20 and 300 kg";
    return null;
  };

  // Error management functions
  const setFieldError = (field: keyof FieldErrors, message: string): void => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field: keyof FieldErrors): void => {
    setFieldErrors((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="space-y-4">
      {/* Name + Gender Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Name Input - Takes 2 columns */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="name" className="text-muted-foreground font-medium text-sm">
            {t.basicInfo.fullName}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                clearFieldError("name");
              }}
              onBlur={(e) => {
                const error = validateName(e.target.value);
                if (error) setFieldError("name", error);
              }}
              placeholder={t.basicInfo.fullNamePlaceholder}
              className="pl-10 h-10 border-border focus-visible:ring-ring focus-visible:border-primary bg-muted/20 text-foreground"
              suppressHydrationWarning
              onFocus={() => setActiveField(null)}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
          </div>
          {fieldErrors.name && (
            <p id="name-error" className="text-sm text-destructive mt-1" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Gender Dropdown */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground font-medium text-sm">{t.basicInfo.gender}</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
            onOpenChange={(open) => {
              if (open) setActiveField(null);
            }}
          >
            <SelectTrigger className="h-10 border-border bg-muted/20">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t.basicInfo.male}</SelectItem>
              <SelectItem value="female">{t.basicInfo.female}</SelectItem>
              <SelectItem value="other">{t.basicInfo.other}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Age, Height, Weight - Stacked on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
        {/* Age */}
        <div className="space-y-0">
          <Label
            htmlFor="age"
            className="text-muted-foreground font-medium text-sm flex items-center gap-1 mb-2"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            {t.basicInfo.age}
          </Label>
          <StepperInput
            id="age"
            value={formData.age}
            onChange={(val) => {
              setFormData({ ...formData, age: val });
              clearFieldError("age");
            }}
            onBlur={(val) => {
              const error = validateAge(val);
              if (error) setFieldError("age", error);
            }}
            min={1}
            max={150}
            step={1}
            placeholder="25"
            unit="yr"
            pattern="[0-9]*"
            onFocus={() => setActiveField("age")}
            aria-invalid={!!fieldErrors.age}
            aria-describedby={fieldErrors.age ? "age-error" : undefined}
          />
          {fieldErrors.age && (
            <p id="age-error" className="text-sm text-destructive mt-1" role="alert">
              {fieldErrors.age}
            </p>
          )}
          <AnimatePresence>
            {activeField === "age" && (
              <motion.div
                key="age-chips"
                variants={chipsVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <QuickSelectChips
                  options={AGE_PRESETS}
                  value={formData.age}
                  onChange={(val) => setFormData({ ...formData, age: val })}
                  horizontalScroll
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Height */}
        <div className="space-y-0">
          <Label
            htmlFor="height"
            className="text-muted-foreground font-medium text-sm flex items-center gap-1 mb-2"
          >
            <Ruler className="w-3.5 h-3.5 text-primary" />
            {t.basicInfo.height}
          </Label>
          <StepperInput
            id="height"
            value={formData.height}
            onChange={(val) => {
              setFormData({ ...formData, height: val });
              clearFieldError("height");
            }}
            onBlur={(val) => {
              const error = validateHeight(val);
              if (error) setFieldError("height", error);
            }}
            min={50}
            max={250}
            step={1}
            placeholder="170"
            unit="cm"
            pattern="[0-9]*"
            onFocus={() => setActiveField("height")}
            aria-invalid={!!fieldErrors.height}
            aria-describedby={fieldErrors.height ? "height-error" : undefined}
          />
          {fieldErrors.height && (
            <p id="height-error" className="text-sm text-destructive mt-1" role="alert">
              {fieldErrors.height}
            </p>
          )}
          <AnimatePresence>
            {activeField === "height" && (
              <motion.div
                key="height-chips"
                variants={chipsVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <QuickSelectChips
                  options={HEIGHT_PRESETS}
                  value={formData.height}
                  onChange={(val) => setFormData({ ...formData, height: val })}
                  horizontalScroll
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Weight */}
        <div className="space-y-0">
          <Label
            htmlFor="weight"
            className="text-muted-foreground font-medium text-sm flex items-center gap-1 mb-2"
          >
            <Scale className="w-3.5 h-3.5 text-primary" />
            {t.basicInfo.weight}
          </Label>
          <StepperInput
            id="weight"
            value={formData.weight}
            onChange={(val) => {
              setFormData({ ...formData, weight: val });
              clearFieldError("weight");
            }}
            onBlur={(val) => {
              const error = validateWeight(val);
              if (error) setFieldError("weight", error);
            }}
            min={20}
            max={300}
            step={1}
            placeholder="65"
            unit="kg"
            pattern="[0-9]*"
            onFocus={() => setActiveField("weight")}
            aria-invalid={!!fieldErrors.weight}
            aria-describedby={fieldErrors.weight ? "weight-error" : undefined}
          />
          {fieldErrors.weight && (
            <p id="weight-error" className="text-sm text-destructive mt-1" role="alert">
              {fieldErrors.weight}
            </p>
          )}
          <AnimatePresence>
            {activeField === "weight" && (
              <motion.div
                key="weight-chips"
                variants={chipsVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <QuickSelectChips
                  options={WEIGHT_PRESETS}
                  value={formData.weight}
                  onChange={(val) => setFormData({ ...formData, weight: val })}
                  horizontalScroll
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BMI Preview */}
      {bmi && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            onClick={() => setShowBMIModal(true)}
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                Your BMI
              </span>
              <Info className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400/70" />
            </div>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{bmi}</span>
          </motion.div>

          <BMIExplanationModal
            isOpen={showBMIModal}
            onClose={() => setShowBMIModal(false)}
            bmi={parseFloat(bmi)}
            height={parseFloat(formData.height)}
            weight={parseFloat(formData.weight)}
          />
        </>
      )}
    </div>
  );
}
