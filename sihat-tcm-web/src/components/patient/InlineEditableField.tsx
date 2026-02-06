"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineEditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void> | void;
  type?: "text" | "number" | "email";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InlineEditableField({
  label,
  value,
  onSave,
  type = "text",
  placeholder,
  className = "",
  disabled = false,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
      setEditValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (disabled) {
    return (
      <div className={`flex justify-between items-center py-2 ${className}`}>
        <span className="text-sm font-medium text-slate-600">{label}:</span>
        <span className="text-lg font-semibold text-slate-900">{value || "—"}</span>
      </div>
    );
  }

  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span className="text-sm font-medium text-slate-600">{label}:</span>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 flex-1 justify-end"
          >
            <Input
              ref={inputRef}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              placeholder={placeholder}
              className="w-32 h-8 text-right"
              disabled={isSaving}
            />
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving}
                className="h-7 w-7 p-0"
              >
                <Check className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(true)}
            className="text-lg font-semibold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer text-right"
          >
            {value || "—"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
