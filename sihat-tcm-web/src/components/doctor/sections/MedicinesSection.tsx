"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface MedicinesSectionProps {
  currentMedicines: string;
  medicineInput: string;
  onMedicineInputChange: (value: string) => void;
  onAddMedicine: () => void;
  onRemoveMedicine: (medicine: string) => void;
  onCurrentMedicinesChange: (value: string) => void;
}

export function MedicinesSection({
  currentMedicines,
  medicineInput,
  onMedicineInputChange,
  onAddMedicine,
  onRemoveMedicine,
  onCurrentMedicinesChange,
}: MedicinesSectionProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddMedicine();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="medicine-input">Add Medications / Supplements</Label>
        <div className="flex gap-2">
          <Input
            id="medicine-input"
            value={medicineInput}
            onChange={(e) => onMedicineInputChange(e.target.value)}
            placeholder="Enter medicine name..."
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={onAddMedicine} disabled={!medicineInput.trim()}>
            Add
          </Button>
        </div>
      </div>

      {currentMedicines && (
        <div className="flex flex-wrap gap-2 py-2">
          {currentMedicines.split(",").map((med, idx) => {
            const cleanedMed = med.trim();
            if (!cleanedMed) return null;
            return (
              <Badge
                key={idx}
                variant="secondary"
                className="px-3 py-1 gap-2 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors"
              >
                {cleanedMed}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => onRemoveMedicine(cleanedMed)}
                />
              </Badge>
            );
          })}
        </div>
      )}

      <div className="pt-2">
        <Label htmlFor="current-medicines">Additional Medication Notes</Label>
        <Textarea
          id="current-medicines"
          value={currentMedicines}
          onChange={(e) => onCurrentMedicinesChange(e.target.value)}
          placeholder="Any additional notes about dosage, frequency, or other medications..."
          className="mt-1 min-h-[80px]"
        />
      </div>
    </div>
  );
}
