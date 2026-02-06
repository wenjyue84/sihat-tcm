"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { User, Pencil } from "lucide-react";
import { calculateBMI, getBMICategory } from "../utils";
import type { Patient } from "../types";

interface ViewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  onEdit: (patient: Patient) => void;
}

export function ViewPatientDialog({ open, onOpenChange, patient, onEdit }: ViewPatientDialogProps) {
  if (!patient) return null;

  const bmi = calculateBMI(patient.height, patient.weight);
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{patient.full_name || "Unnamed Patient"}</h3>
              <p className="text-sm text-muted-foreground">
                {patient.age ? `${patient.age} years` : "Age unknown"}
                {patient.gender && ` • ${patient.gender}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Height</div>
              <div className="font-semibold">{patient.height ? `${patient.height} cm` : "-"}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Weight</div>
              <div className="font-semibold">{patient.weight ? `${patient.weight} kg` : "-"}</div>
            </div>
            <div className="p-3 border rounded-lg col-span-2">
              <div className="text-sm text-muted-foreground">BMI</div>
              {bmi ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{bmi}</span>
                  <Badge variant="outline" className={bmiCategory?.color}>
                    {bmiCategory?.label}
                  </Badge>
                </div>
              ) : (
                <div className="font-semibold">-</div>
              )}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Medical History</div>
            <div className="text-sm">
              {patient.medical_history || "No medical history recorded."}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated:{" "}
            {patient.updated_at ? new Date(patient.updated_at).toLocaleString() : "Unknown"}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onEdit(patient);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
