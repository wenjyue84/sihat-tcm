"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DoctorDiagnosisData } from "@/hooks/useDoctorDiagnosis";

interface PatientInfoSectionProps {
    patientInfo: DoctorDiagnosisData["patientInfo"];
    onUpdateField: (field: keyof DoctorDiagnosisData["patientInfo"], value: string) => void;
}

export function PatientInfoSection({ patientInfo, onUpdateField }: PatientInfoSectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <Label htmlFor="patient-name">Patient Name *</Label>
                <Input
                    id="patient-name"
                    value={patientInfo.name}
                    onChange={(e) => onUpdateField("name", e.target.value)}
                    placeholder="Enter patient name"
                    className="mt-1"
                />
            </div>
            <div>
                <Label htmlFor="patient-age">Age *</Label>
                <Input
                    id="patient-age"
                    type="number"
                    value={patientInfo.age}
                    onChange={(e) => onUpdateField("age", e.target.value)}
                    placeholder="Age"
                    className="mt-1"
                />
            </div>
            <div>
                <Label htmlFor="patient-gender">Gender *</Label>
                <div className="flex gap-2 mt-1">
                    {["male", "female"].map((g) => (
                        <Button
                            key={g}
                            type="button"
                            variant={patientInfo.gender === g ? "default" : "outline"}
                            size="sm"
                            onClick={() => onUpdateField("gender", g)}
                            className="flex-1 capitalize"
                        >
                            {g}
                        </Button>
                    ))}
                </div>
            </div>
            <div>
                <Label htmlFor="patient-height">Height (cm)</Label>
                <Input
                    id="patient-height"
                    type="number"
                    value={patientInfo.height}
                    onChange={(e) => onUpdateField("height", e.target.value)}
                    placeholder="Height in cm"
                    className="mt-1"
                />
            </div>
            <div>
                <Label htmlFor="patient-weight">Weight (kg)</Label>
                <Input
                    id="patient-weight"
                    type="number"
                    value={patientInfo.weight}
                    onChange={(e) => onUpdateField("weight", e.target.value)}
                    placeholder="Weight in kg"
                    className="mt-1"
                />
            </div>
        </div>
    );
}
