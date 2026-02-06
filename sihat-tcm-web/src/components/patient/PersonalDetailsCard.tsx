"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Edit, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEditableField } from "./InlineEditableField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonalDetailsCardProps {
  fullName: string;
  email?: string;
  age?: string;
  gender?: string;
  onUpdate: (field: string, value: string) => Promise<void>;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}

export function PersonalDetailsCard({
  fullName,
  email,
  age,
  gender,
  onUpdate,
  editing: externalEditing,
  onEditingChange,
}: PersonalDetailsCardProps) {
  const [internalEditing, setInternalEditing] = useState(false);
  const editing = externalEditing !== undefined ? externalEditing : internalEditing;
  const setEditing = onEditingChange || setInternalEditing;

  const handleSave = async (field: string, value: string) => {
    await onUpdate(field, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-2xl font-semibold text-slate-900">Personal Details</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(!editing)}
              className="text-slate-600 hover:text-emerald-700 shrink-0"
            >
              <Edit className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{editing ? "Done" : "Edit"}</span>
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-1">
            <InlineEditableField
              label="Name"
              value={fullName || ""}
              onSave={(value) => handleSave("full_name", value)}
              disabled={!editing}
            />

            {email && (
              <div className="flex justify-between items-center py-2 gap-2">
                <span className="text-sm font-medium text-slate-600 flex items-center gap-2 shrink-0">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email:</span>
                </span>
                <span className="text-sm sm:text-lg font-semibold text-slate-900 truncate">
                  {email}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-600">Age:</span>
              {editing ? (
                <InlineEditableField
                  label=""
                  value={age || ""}
                  onSave={(value) => handleSave("age", value)}
                  type="number"
                  disabled={false}
                  className="!py-0 !justify-end"
                />
              ) : (
                <span className="text-lg font-semibold text-slate-900">{age || "—"}</span>
              )}
            </div>
            <div className="flex justify-between items-center py-2 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-600">Gender:</span>
              {editing ? (
                <Select value={gender || ""} onValueChange={(value) => handleSave("gender", value)}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-lg font-semibold text-slate-900 capitalize">
                  {gender || "—"}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
