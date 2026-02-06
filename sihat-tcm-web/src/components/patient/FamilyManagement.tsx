"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Heart,
  Camera,
  Calendar,
  ChevronRight,
  User,
  Activity,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  Clock,
  FileHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from "@/stores/useAppStore";
import { formatDate } from "@/lib/utils/date-formatting";
import { getFamilyMembers, addFamilyMember, deleteFamilyMember } from "@/lib/actions";
import type { SaveFamilyMemberInput } from "@/types/database";

// Types
interface FamilyMember {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  relationship: "self" | "mother" | "father" | "spouse" | "child" | "sibling" | "other";
  avatar?: string;
  medicalHistory?: string;
  lastDiagnosis?: {
    date: string;
    diagnosis: string;
    score?: number;
  };
}

// Mock data removed in favor of DB connectivity
// const MOCK_FAMILY_MEMBERS: FamilyMember[] = [];

// Relationship icons
const relationshipIcons: Record<string, string> = {
  self: "👤",
  mother: "👵",
  father: "👴",
  spouse: "💑",
  child: "👶",
  sibling: "👫",
  other: "👥",
};

export function FamilyManagement() {
  const { t } = useLanguage();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding new member
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "" as "male" | "female" | "other" | "",
    relationship: "" as FamilyMember["relationship"] | "",
    medicalHistory: "",
  });

  // Fetch members
  useEffect(() => {
    async function fetchMembers() {
      try {
        const result = await getFamilyMembers();
        if (result.success && result.data) {
          const mappedMembers: FamilyMember[] = result.data.map((m) => ({
            id: m.id,
            name: m.name,
            age: m.date_of_birth
              ? new Date().getFullYear() - new Date(m.date_of_birth).getFullYear()
              : 0,
            gender: (m.gender as "male" | "female" | "other") || "other",
            relationship: (m.relationship as any) || "other",
            medicalHistory: m.medical_history || undefined,
            lastDiagnosis: m.lastDiagnosis || undefined,
            avatar: m.avatar_url || undefined,
          }));
          setFamilyMembers(mappedMembers);
        }
      } catch (error) {
        console.error("Failed to fetch family members:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const handleAddMember = async () => {
    if (!formData.name || !formData.age || !formData.gender || !formData.relationship) {
      return;
    }

    setIsSubmitting(true);

    // Calculate approximate DOB
    const currentYear = new Date().getFullYear();
    const dob = `${currentYear - parseInt(formData.age)}-01-01`;

    const input: SaveFamilyMemberInput = {
      name: formData.name,
      relationship: formData.relationship as any,
      gender: formData.gender as "male" | "female" | "other",
      date_of_birth: dob,
      medical_history: formData.medicalHistory,
    };

    try {
      const result = await addFamilyMember(input);

      if (result.success && result.data) {
        const newMember: FamilyMember = {
          id: result.data.id,
          name: result.data.name,
          age: parseInt(formData.age),
          gender: (result.data.gender as "male" | "female" | "other") || "other",
          relationship: (result.data.relationship as any) || "other",
          medicalHistory: result.data.medical_history || undefined,
        };

        setFamilyMembers([...familyMembers, newMember]);
        setFormData({
          name: "",
          age: "",
          gender: "",
          relationship: "",
          medicalHistory: "",
        });
        setShowAddModal(false);
      } else {
        console.error("Failed to add member:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error adding member:", error);
    }

    setIsSubmitting(false);
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const result = await deleteFamilyMember(id);
      if (result.success) {
        setFamilyMembers(familyMembers.filter((m) => m.id !== id));
      } else {
        console.error("Failed to delete member:", result.error);
      }
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 75) return { bg: "bg-emerald-100", text: "text-emerald-700" };
    if (score >= 50) return { bg: "bg-amber-100", text: "text-amber-700" };
    return { bg: "bg-red-100", text: "text-red-700" };
  };

  // formatDate is now imported from shared utility

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl text-white">
              <Users className="w-5 h-5" />
            </div>
            {t.familyManagement?.title || "Family Care"}
          </h2>
          <p className="text-slate-600 mt-1">
            {t.familyManagement?.subtitle || "Manage health profiles for your loved ones"}
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          {t.familyManagement?.addMember || "Add Member"}
        </Button>
      </div>

      {/* Family Members Count */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-rose-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                {(t.familyManagement?.membersCount || "{count} family members").replace(
                  "{count}",
                  familyMembers.length.toString()
                )}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Track everyone's health journey under one account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {familyMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  {/* Header with Avatar */}
                  <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-4 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-2xl shadow-md">
                          {relationshipIcons[member.relationship]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-xs text-slate-500 capitalize">
                            {t.familyManagement?.relationships?.[member.relationship] ||
                              member.relationship}
                            {" • "}
                            {member.age} {t.analysisLoading?.yearsOld || "years old"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(member.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    {/* Last Diagnosis */}
                    {member.lastDiagnosis ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {t.familyManagement?.lastDiagnosis || "Last Diagnosis"}:{" "}
                          {formatDate(member.lastDiagnosis.date)}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700 truncate flex-1">
                            {member.lastDiagnosis.diagnosis}
                          </p>
                          {member.lastDiagnosis.score && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreBadge(member.lastDiagnosis.score)?.bg} ${getScoreBadge(member.lastDiagnosis.score)?.text}`}
                            >
                              {member.lastDiagnosis.score}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                        <FileHeart className="w-4 h-4" />
                        {t.familyManagement?.noDiagnosis || "No diagnosis yet"}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 text-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                      >
                        <Activity className="w-3 h-3" />
                        {t.familyManagement?.viewHistory || "View History"}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 text-xs bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                      >
                        <Camera className="w-3 h-3" />
                        {t.familyManagement?.startDiagnosis || "New Diagnosis"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Member Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: familyMembers.length * 0.1 }}
        >
          <Card
            className="border-2 border-dashed border-slate-200 hover:border-rose-300 bg-slate-50/50 hover:bg-rose-50/50 transition-all duration-300 cursor-pointer h-full min-h-[200px]"
            onClick={() => setShowAddModal(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-rose-500" />
              </div>
              <p className="font-medium text-slate-600">
                {t.familyManagement?.addMember || "Add Family Member"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Create a health profile for a loved one</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions / Scenario Card */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">✨</span>
            {t.familyManagement?.scenario?.title || "Quick Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Track Mother's Health */}
            <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition-all text-left group">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <span className="text-2xl">👵</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 group-hover:text-rose-600 transition-colors">
                  {t.familyManagement?.scenario?.trackMother || "Track Mother's Health"}
                </p>
                <p className="text-xs text-slate-500">View her recent diagnoses</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </button>

            {/* Upload Tongue Photo */}
            <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all text-left group">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Camera className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                  {t.familyManagement?.scenario?.uploadTongue || "Upload Tongue Photo"}
                </p>
                <p className="text-xs text-slate-500">For a family member</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>

            {/* Recent Family Activity */}
            <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all text-left group">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors">
                  {t.familyManagement?.scenario?.recentActivity || "Recent Family Activity"}
                </p>
                <p className="text-xs text-slate-500">See all updates</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" />
              {t.familyManagement?.addForm?.title || "Add Family Member"}
            </DialogTitle>
            <DialogDescription>
              Create a health profile for your loved one. Their data will be tracked separately
              under your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {t.familyManagement?.addForm?.name || "Full Name"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">
                  {t.familyManagement?.addForm?.age || "Age"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {t.familyManagement?.addForm?.gender || "Gender"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: "male" | "female" | "other") =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">
                      {t.patientDashboard?.profile?.male || "Male"}
                    </SelectItem>
                    <SelectItem value="female">
                      {t.patientDashboard?.profile?.female || "Female"}
                    </SelectItem>
                    <SelectItem value="other">
                      {t.patientDashboard?.profile?.other || "Other"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <Label>
                {t.familyManagement?.addForm?.relationship || "Relationship"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.relationship}
                onValueChange={(value: FamilyMember["relationship"]) =>
                  setFormData({ ...formData, relationship: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mother">
                    <span className="flex items-center gap-2">
                      👵 {t.familyManagement?.relationships?.mother || "Mother"}
                    </span>
                  </SelectItem>
                  <SelectItem value="father">
                    <span className="flex items-center gap-2">
                      👴 {t.familyManagement?.relationships?.father || "Father"}
                    </span>
                  </SelectItem>
                  <SelectItem value="spouse">
                    <span className="flex items-center gap-2">
                      💑 {t.familyManagement?.relationships?.spouse || "Spouse"}
                    </span>
                  </SelectItem>
                  <SelectItem value="child">
                    <span className="flex items-center gap-2">
                      👶 {t.familyManagement?.relationships?.child || "Child"}
                    </span>
                  </SelectItem>
                  <SelectItem value="sibling">
                    <span className="flex items-center gap-2">
                      👫 {t.familyManagement?.relationships?.sibling || "Sibling"}
                    </span>
                  </SelectItem>
                  <SelectItem value="other">
                    <span className="flex items-center gap-2">
                      👥 {t.familyManagement?.relationships?.other || "Other"}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Medical History */}
            <div className="space-y-2">
              <Label htmlFor="medicalHistory">
                {t.familyManagement?.addForm?.medicalHistory || "Medical History (Optional)"}
              </Label>
              <Textarea
                id="medicalHistory"
                placeholder="Any known conditions, allergies, or medications..."
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              {t.familyManagement?.addForm?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={
                isSubmitting ||
                !formData.name ||
                !formData.age ||
                !formData.gender ||
                !formData.relationship
              }
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t.familyManagement?.addForm?.submit || "Create Profile"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
