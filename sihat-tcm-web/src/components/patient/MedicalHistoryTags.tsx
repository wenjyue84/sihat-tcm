"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseMedicalHistory, groupConditionsByCategory, MedicalCondition } from "@/lib/medicalHistoryParser";

interface MedicalHistoryTagsProps {
  medicalHistory: string | null | undefined;
  onUpdate: (value: string) => Promise<void>;
  editing?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  cardiovascular: "Cardiovascular",
  metabolic: "Metabolic",
  renal: "Renal",
  gastrointestinal: "Gastrointestinal",
  musculoskeletal: "Musculoskeletal",
  neurological: "Neurological",
  respiratory: "Respiratory",
  other: "Other",
};

export function MedicalHistoryTags({
  medicalHistory,
  onUpdate,
  editing = false,
}: MedicalHistoryTagsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCondition, setNewCondition] = useState("");

  const conditions = parseMedicalHistory(medicalHistory);
  const grouped = groupConditionsByCategory(conditions);

  const handleAddCondition = async () => {
    if (!newCondition.trim()) {
      setIsAdding(false);
      return;
    }

    const currentHistory = medicalHistory || "";
    const updatedHistory = currentHistory
      ? `${currentHistory}, ${newCondition.trim()}`
      : newCondition.trim();

    await onUpdate(updatedHistory);
    setNewCondition("");
    setIsAdding(false);
  };

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Medical History</h2>
            <Textarea
              value={medicalHistory || ""}
              onChange={(e) => onUpdate(e.target.value)}
              placeholder="Enter medical conditions separated by commas..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              Separate conditions with commas. Example: "Hypertension, Diabetes, Arthritis"
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">Medical History</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-600"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Tags */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {conditions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No medical history recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category}>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          {CATEGORY_LABELS[category] || category}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((condition, index) => (
                            <motion.span
                              key={`${condition.name}-${index}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border"
                              style={{
                                backgroundColor: `${condition.color}15`,
                                color: condition.color,
                                borderColor: `${condition.color}40`,
                              }}
                            >
                              {condition.name}
                              {condition.severity && (
                                <span className="ml-1.5 text-xs opacity-75">
                                  ({condition.severity})
                                </span>
                              )}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}


