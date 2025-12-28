import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TreatmentRecord } from "@/types/database";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Save, User, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TreatmentDetailsDialogProps {
    treatment: TreatmentRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function TreatmentDetailsDialog({ treatment, open, onOpenChange, onUpdate }: TreatmentDetailsDialogProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen && treatment) {
            setEditedPlan(treatment.treatment_plan);
            setIsEditing(false);
        }
        onOpenChange(newOpen);
    };

    const handleSave = async () => {
        if (!treatment) return;

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('diagnosis_sessions')
                .update({ treatment_plan: editedPlan })
                .eq('id', treatment.id);

            if (error) throw error;

            toast.success("Treatment plan updated");
            onUpdate();
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating treatment:", error);
            toast.error("Failed to update treatment plan");
        } finally {
            setIsSaving(false);
        }
    };

    if (!treatment) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                {treatment.patient_name}
                                {treatment.flag && (
                                    <Badge variant={(treatment.flag === 'Critical' || treatment.flag === 'High Priority') ? "destructive" : "secondary"}>
                                        {treatment.flag}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(treatment.date), "MMMM d, yyyy 'at' h:mm a")}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Primary Diagnosis
                            </h4>
                            <p className="text-slate-900 font-medium">{treatment.diagnosis}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                Patient Status
                            </h4>
                            <p className="text-slate-900">{treatment.status === 'active' ? 'Active Treatment' : 'Completed'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">Treatment Plan</h3>
                            {!isEditing && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    Edit Plan
                                </Button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <Textarea
                                    value={editedPlan}
                                    onChange={(e) => setEditedPlan(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm leading-relaxed"
                                    placeholder="Enter detailed treatment plan..."
                                />
                                <div className="flex items-center gap-2 justify-end">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={isSaving || editedPlan === treatment.treatment_plan} className="gap-2">
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border rounded-lg p-4 min-h-[100px] whitespace-pre-wrap text-slate-700 leading-relaxed">
                                {treatment.treatment_plan}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
