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
import { Pencil } from "lucide-react";
import { UserProfile } from "../types";
import { ROLE_CONFIG } from "../constants";
import { calculateBMI, getBMICategory } from "../utils";

interface ViewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onEdit: (user: UserProfile) => void;
}

export function ViewUserDialog({ open, onOpenChange, user, onEdit }: ViewUserDialogProps) {
  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role];
  const RoleIcon = roleConfig.icon;
  const bmi = calculateBMI(user.height, user.weight);
  const category = bmi ? getBMICategory(bmi) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RoleIcon className="w-5 h-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Header */}
          <div className={`flex items-center gap-4 p-4 rounded-lg ${roleConfig.bgColor}`}>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${roleConfig.color.split(" ").slice(0, 2).join(" ")}`}
            >
              <RoleIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.full_name || "Unnamed User"}</h3>
              <p className="text-sm text-muted-foreground">{user.email || "No email"}</p>
              <Badge variant="outline" className={`mt-1 ${roleConfig.color}`}>
                {roleConfig.label}
              </Badge>
            </div>
          </div>

          {/* Patient Details */}
          {user.role === "patient" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Age</div>
                  <div className="font-semibold">{user.age ? `${user.age} years` : "-"}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Gender</div>
                  <div className="font-semibold">{user.gender || "-"}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Height</div>
                  <div className="font-semibold">{user.height ? `${user.height} cm` : "-"}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Weight</div>
                  <div className="font-semibold">{user.weight ? `${user.weight} kg` : "-"}</div>
                </div>
                <div className="p-3 border rounded-lg col-span-2">
                  <div className="text-sm text-muted-foreground">BMI</div>
                  {bmi ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{bmi.toFixed(1)}</span>
                      <Badge variant="outline" className={category?.color}>
                        {category?.label}
                      </Badge>
                    </div>
                  ) : (
                    <div className="font-semibold">-</div>
                  )}
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Medical History</div>
                <div className="text-sm">{user.medical_history || "No medical history recorded."}</div>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated:{" "}
            {user.updated_at ? new Date(user.updated_at).toLocaleString() : "Unknown"}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {user.role === "patient" && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit(user);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Patient
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
