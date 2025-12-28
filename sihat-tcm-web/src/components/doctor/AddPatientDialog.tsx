"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { PatientType, PatientStatus } from "@/types/database";

interface AddPatientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddPatientDialog({ open, onOpenChange, onSuccess }: AddPatientDialogProps) {
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [phone, setPhone] = useState("");
    const [icNo, setIcNo] = useState("");
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName) {
            toast.error("First name is required");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('patients')
                .insert({
                    first_name: firstName,
                    last_name: lastName || null,
                    gender: gender || null,
                    birth_date: birthDate || null,
                    phone: phone || null,
                    ic_no: icNo || null,
                    type: 'managed' as PatientType,
                    status: 'active' as PatientStatus,
                    created_by: user?.id
                });

            if (error) throw error;

            toast.success("Patient added successfully");
            onSuccess();
            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error('Error adding patient:', error);
            toast.error("Failed to add patient");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setGender("");
        setBirthDate("");
        setPhone("");
        setIcNo("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                        <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Add Managed Patient</DialogTitle>
                    <DialogDescription>
                        Create a record for a patient you manage. You can invite them to use the app later.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="e.g. Aishah"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="e.g. Othman"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Birth Date</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. +60123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icNo">IC / Passport No.</Label>
                            <Input
                                id="icNo"
                                value={icNo}
                                onChange={(e) => setIcNo(e.target.value)}
                                placeholder="e.g. 900101-14-5566"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Add Patient Record"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
