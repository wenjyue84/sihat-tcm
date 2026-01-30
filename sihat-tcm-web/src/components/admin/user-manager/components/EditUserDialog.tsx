"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { UserProfile } from "../types";
import { calculateBMI, getBMICategory } from "../utils";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<UserProfile>;
  onFormDataChange: (data: Partial<UserProfile>) => void;
  saving: boolean;
  onSave: () => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  saving,
  onSave,
}: EditUserDialogProps) {
  const bmi = calculateBMI(formData.height, formData.weight);
  const category = bmi ? getBMICategory(bmi) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.full_name || ""}
              onChange={(e) => onFormDataChange({ ...formData, full_name: e.target.value })}
              placeholder="e.g. John Smith"
            />
          </div>

          {/* Age and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, age: parseInt(e.target.value) || undefined })
                }
                placeholder="e.g. 35"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(v) => onFormDataChange({ ...formData, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Height and Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    height: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="e.g. 175"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    weight: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="e.g. 70"
              />
            </div>
          </div>

          {/* BMI Preview */}
          {formData.height && formData.weight && bmi && (
            <div className="p-3 bg-stone-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Calculated BMI</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold">{bmi.toFixed(1)}</span>
                <Badge variant="outline" className={category?.color}>
                  {category?.label}
                </Badge>
              </div>
            </div>
          )}

          {/* Medical History */}
          <div className="space-y-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history || ""}
              onChange={(e) => onFormDataChange({ ...formData, medical_history: e.target.value })}
              placeholder="Previous conditions, allergies, chronic diseases, etc."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
