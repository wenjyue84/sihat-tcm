"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, ChevronDown, ChevronUp, UserCog, LayoutDashboard } from "lucide-react";
import {
  PROMPT_TYPES,
  DOCTOR_MODEL_MAPPING,
  PROMPT_PIPELINE_GROUPS,
  type PromptType,
  type DoctorLevel,
} from "../constants";

interface PromptsTabProps {
  prompts: Record<PromptType, string>;
  setPrompts: React.Dispatch<React.SetStateAction<Record<PromptType, string>>>;
  doctorLevel: DoctorLevel;
  setDoctorLevel: (level: DoctorLevel) => void;
  expandedPrompts: Record<PromptType, boolean>;
  togglePrompt: (type: PromptType) => void;
  saving: PromptType | "config" | "config_music" | null;
  saved: PromptType | "config" | "config_music" | null;
  handleSaveConfig: () => void;
  handleSavePrompt: (type: PromptType) => void;
  handleResetToDefault: (type: PromptType) => void;
}

export function PromptsTab({
  prompts,
  setPrompts,
  doctorLevel,
  setDoctorLevel,
  expandedPrompts,
  togglePrompt,
  saving,
  saved,
  handleSaveConfig,
  handleSavePrompt,
  handleResetToDefault,
}: PromptsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* AI Persona Configuration Card */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl pb-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5 text-white/90" />
            AI Persona Configuration
          </CardTitle>
          <CardDescription className="text-blue-100">
            Define the baseline medical reasoning capability for the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4 p-1">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label className="text-slate-700 font-medium">Core Medical Engine</Label>
              <Select value={doctorLevel} onValueChange={(v) => setDoctorLevel(v as DoctorLevel)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physician">
                    <div className="flex flex-col">
                      <span className="font-medium">Doctor (Standard)</span>
                      <span className="text-xs text-slate-500">
                        gemini-2.0-flash - Fast response, general care
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Expert">
                    <div className="flex flex-col">
                      <span className="font-medium">Expert (Advanced)</span>
                      <span className="text-xs text-slate-500">
                        gemini-2.5-pro - Deeper reasoning, complex cases
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Master">
                    <div className="flex flex-col">
                      <span className="font-medium">Master (Premium)</span>
                      <span className="text-xs text-slate-500">
                        gemini-3.0-preview - Highest accuracy, research grade
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveConfig}
              disabled={saving === "config"}
              className="h-11 px-6 bg-slate-900 hover:bg-slate-800"
            >
              {saving === "config" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved === "config" ? (
                <Check className="w-4 h-4" />
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Pipeline */}
      <div className="space-y-6 pt-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-slate-400" />
          Prompt Pipeline
        </h3>
        {PROMPT_PIPELINE_GROUPS.map((group) => (
          <div key={group.id} className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">
              {group.title}
            </p>
            <div className="grid gap-4">
              {group.prompts.map((type) => (
                <PromptCard
                  key={type}
                  type={type}
                  prompt={prompts[type]}
                  setPrompts={setPrompts}
                  isExpanded={expandedPrompts[type]}
                  togglePrompt={togglePrompt}
                  saving={saving}
                  saved={saved}
                  handleSavePrompt={handleSavePrompt}
                  handleResetToDefault={handleResetToDefault}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PromptCardProps {
  type: PromptType;
  prompt: string;
  setPrompts: React.Dispatch<React.SetStateAction<Record<PromptType, string>>>;
  isExpanded: boolean;
  togglePrompt: (type: PromptType) => void;
  saving: PromptType | "config" | "config_music" | null;
  saved: PromptType | "config" | "config_music" | null;
  handleSavePrompt: (type: PromptType) => void;
  handleResetToDefault: (type: PromptType) => void;
}

function PromptCard({
  type,
  prompt,
  setPrompts,
  isExpanded,
  togglePrompt,
  saving,
  saved,
  handleSavePrompt,
  handleResetToDefault,
}: PromptCardProps) {
  const config = PROMPT_TYPES[type];
  const Icon = config.icon;

  return (
    <Card
      className={`border border-slate-200 transition-all duration-300 ${
        isExpanded ? "ring-2 ring-slate-900 shadow-lg" : "hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div
        className="p-5 flex items-center justify-between cursor-pointer"
        onClick={() => togglePrompt(type)}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2.5 rounded-lg ${
              isExpanded ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{config.title}</h4>
            <p className="text-sm text-slate-500">{config.description}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>
      </div>
      {isExpanded && (
        <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
              <code className="text-xs font-mono text-slate-500">{config.role}</code>
              {prompt !== config.defaultPrompt && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  CUSTOMIZED
                </span>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) =>
                setPrompts((prev) => ({
                  ...prev,
                  [type]: e.target.value,
                }))
              }
              className="min-h-[300px] border-0 focus-visible:ring-0 font-mono text-sm leading-relaxed bg-white rounded-none resize-y p-4"
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResetToDefault(type)}
              className="text-slate-500 hover:text-red-600"
            >
              Revert to Default
            </Button>
            <Button
              onClick={() => handleSavePrompt(type)}
              disabled={saving === type}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {saving === type ? "Saving..." : saved === type ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
