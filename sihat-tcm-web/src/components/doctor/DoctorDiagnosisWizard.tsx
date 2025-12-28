"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { differenceInYears } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    User,
    Stethoscope,
    Camera,
    MessageSquare,
    FileText,
    Pill,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Send,
    Loader2,
    FlaskConical,
    Save,
    Trash2,
    Check,
    Upload,
    X,
    Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/stores/useAppStore";
import { useDoctorDiagnosis, DoctorDiagnosisData, FileData, initialData } from "@/hooks/useDoctorDiagnosis";
import { CollapsibleSection } from "./CollapsibleSection";
import { QuickSelectInquiry } from "./QuickSelectInquiry";
import { CameraCapture } from "@/components/diagnosis/camera-capture";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useDiagnosisSubmission } from "@/hooks/useDiagnosisSubmission";

// Section configuration
const SECTIONS = [
    { id: "patient-info", title: "Patient Information", icon: User },
    { id: "symptoms", title: "Symptoms & Chief Complaints", icon: Stethoscope },
    { id: "tongue", title: "Tongue Analysis", icon: Camera },
    { id: "face", title: "Face Analysis", icon: Camera },
    { id: "tcm-inquiry", title: "TCM Inquiry", icon: MessageSquare },
    { id: "reports", title: "Upload Reports", icon: FileText },
    { id: "medicines", title: "Current Medicines", icon: Pill },
    { id: "clinical-notes", title: "Clinical Notes & Treatment", icon: FileText },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

// Common symptom chips for quick selection
const COMMON_SYMPTOMS = [
    "Headache", "Fatigue", "Insomnia", "Dizziness", "Back Pain",
    "Digestive Issues", "Anxiety", "Cold/Flu", "Joint Pain", "Cough",
    "Nausea", "Skin Issues", "Menstrual Issues", "Heart Palpitations",
];

export function DoctorDiagnosisWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientId = searchParams.get('patientId');
    const supabase = createClient();
    const { t } = useLanguage();
    const { data, setData, clearDraft, hasSavedDraft, isInitialized } = useDoctorDiagnosis();
    const [patient, setPatient] = useState<any>(null);

    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
        new Set(["patient-info"])
    );

    const [showTongueCamera, setShowTongueCamera] = useState(false);
    const [showFaceCamera, setShowFaceCamera] = useState(false);
    const [extractingFiles, setExtractingFiles] = useState<Set<string>>(new Set());
    const [viewingReport, setViewingReport] = useState<FileData | null>(null);
    const [medicineInput, setMedicineInput] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Fetch patient data if patientId is present
    useEffect(() => {
        const fetchPatientData = async () => {
            if (!patientId || !isInitialized) return;

            try {
                const { data: patient, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', patientId)
                    .single();

                if (error) {
                    console.error('Error fetching patient:', error);
                    return;
                }

                if (patient) {
                    setPatient(patient); // Store the full patient object
                    const age = patient.birth_date ? differenceInYears(new Date(), new Date(patient.birth_date)).toString() : "";
                    const newName = `${patient.first_name} ${patient.last_name || ''}`.trim();
                    const newGender = patient.gender || "";

                    setData((prev: DoctorDiagnosisData) => {
                        // If we have data for a different patient, clear it and start fresh
                        if (prev.patientInfo.name && prev.patientInfo.name !== newName) {
                            return {
                                ...initialData,
                                patientInfo: {
                                    ...initialData.patientInfo,
                                    name: newName,
                                    age: age,
                                    gender: newGender,
                                }
                            };
                        }

                        return {
                            ...prev,
                            patientInfo: {
                                ...prev.patientInfo,
                                name: newName,
                                age: age,
                                gender: newGender || prev.patientInfo.gender,
                            }
                        };
                    });

                    toast.success(`Loaded profile: ${patient.first_name}`);
                }
            } catch (err) {
                console.error('Error loading patient data:', err);
            }
        };

        fetchPatientData();
    }, [patientId, supabase, setData, isInitialized]);

    // Toggle section expansion
    const toggleSection = (sectionId: SectionId) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    // Update patient info
    const updatePatientInfo = (field: keyof DoctorDiagnosisData["patientInfo"], value: string) => {
        setData((prev: DoctorDiagnosisData) => ({
            ...prev,
            patientInfo: { ...prev.patientInfo, [field]: value },
        }));
    };

    // Toggle symptom selection
    const toggleSymptom = (symptom: string) => {
        setData((prev: DoctorDiagnosisData) => {
            const symptoms = prev.selectedSymptoms.includes(symptom)
                ? prev.selectedSymptoms.filter((s: string) => s !== symptom)
                : [...prev.selectedSymptoms, symptom];
            return { ...prev, selectedSymptoms: symptoms };
        });
    };

    // Handle tongue capture
    const handleTongueCapture = (result: { image?: string }) => {
        if (result.image) {
            setData((prev: DoctorDiagnosisData) => ({ ...prev, tongueImage: result.image || "" }));
            setShowTongueCamera(false);
            toast.success("Tongue image captured");
        }
    };

    // Handle face capture
    const handleFaceCapture = (result: { image?: string }) => {
        if (result.image) {
            setData((prev: DoctorDiagnosisData) => ({ ...prev, faceImage: result.image || "" }));
            setShowFaceCamera(false);
            toast.success("Face image captured");
        }
    };

    // Handle inquiry answers update
    const handleInquiryUpdate = (answers: Record<string, string[]>) => {
        setData((prev: DoctorDiagnosisData) => ({ ...prev, inquiryAnswers: answers }));
    };

    // Fill test data
    const handleFillTestData = () => {
        setData({
            patientInfo: {
                name: "Test Patient",
                age: "45",
                gender: "male",
                height: "170",
                weight: "70",
            },
            selectedSymptoms: ["Headache", "Fatigue", "Insomnia"],
            otherSymptoms: "Occasional dizziness when standing up quickly",
            tongueImage: "",
            faceImage: "",
            inquiryAnswers: {},
            uploadedReports: [],
            currentMedicines: "Vitamin C, Omega-3",
            clinicalNotes: "Patient presents with classic Spleen Qi deficiency. Pulse is weak and thready. Tongue is pale with tooth marks.",
            treatmentPlan: "Herbal formula: Si Jun Zi Tang. Acupuncture: ST36, SP6, CV12. Avoid cold foods.",
        });
        toast.success("Test data filled");
    };

    // Clear all data
    const handleClearData = () => {
        clearDraft();
        toast.success("Form cleared");
    };

    // Background AI text extraction
    const extractTextInBackground = async (file: File) => {
        const fileId = file.name + file.lastModified;
        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
            });

            // Call extraction API
            const response = await fetch("/api/extract-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    file: base64,
                    fileName: file.name,
                    fileType: file.type,
                    mode: "general",
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Update the file with extracted text
            setData((prev: DoctorDiagnosisData) => ({
                ...prev,
                uploadedReports: prev.uploadedReports.map((f: FileData) =>
                    f.name === file.name ? { ...f, extractedText: data.text || "" } : f
                ),
            }));
        } catch (error) {
            console.error("Background extraction error:", error);
            toast.error(`Failed to extract text from ${file.name}`);
        } finally {
            setExtractingFiles((prev) => {
                const next = new Set(prev);
                next.delete(fileId);
                return next;
            });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length === 0) return;

        // Reset input
        e.target.value = "";

        for (const file of newFiles) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} too big (max 5MB)`);
                continue;
            }

            try {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                });

                const fileId = file.name + file.lastModified;

                // Add file immediately
                setData((prev: DoctorDiagnosisData) => ({
                    ...prev,
                    uploadedReports: [
                        ...prev.uploadedReports,
                        {
                            name: file.name,
                            type: file.type,
                            data: base64,
                            extractedText: "",
                        },
                    ],
                }));

                // Start background extraction
                setExtractingFiles((prev) => new Set(prev).add(fileId));
                extractTextInBackground(file);

            } catch (error) {
                console.error("Error processing file:", error);
                toast.error(`Error processing ${file.name}`);
            }
        }
    };

    const removeReport = (index: number) => {
        setData((prev: DoctorDiagnosisData) => ({
            ...prev,
            uploadedReports: prev.uploadedReports.filter((_: FileData, i: number) => i !== index),
        }));
    };

    // Medicine chip handlers
    const addMedicine = () => {
        if (!medicineInput.trim()) return;

        const medsList = data.currentMedicines
            ? data.currentMedicines.split(",").map((m: string) => m.trim())
            : [];

        if (medsList.includes(medicineInput.trim())) {
            toast.error("Medicine already added");
            return;
        }

        const newMeds = [...medsList, medicineInput.trim()].join(", ");
        setData((prev: DoctorDiagnosisData) => ({ ...prev, currentMedicines: newMeds }));
        setMedicineInput("");
    };

    const removeMedicine = (medToRemove: string) => {
        const medsList = data.currentMedicines
            .split(",")
            .map((m: string) => m.trim())
            .filter((m: string) => m !== medToRemove);

        setData((prev: DoctorDiagnosisData) => ({
            ...prev,
            currentMedicines: medsList.join(", ")
        }));
    };

    // Calculate completion percentage
    const getCompletionPercentage = (): number => {
        let completed = 0;
        const total = 7;

        if (data.patientInfo.name && data.patientInfo.age && data.patientInfo.gender) completed++;
        if (data.selectedSymptoms.length > 0 || data.otherSymptoms) completed++;
        if (data.tongueImage) completed++;
        if (data.faceImage) completed++;
        if (Object.keys(data.inquiryAnswers).length > 0) completed++;
        if (data.uploadedReports.length > 0) completed++;
        if (data.currentMedicines) completed++;

        return Math.round((completed / total) * 100);
    };

    const { submitDiagnosis, isSubmitting } = useDiagnosisSubmission();

    // Submit diagnosis
    const handleSubmit = async () => {
        // Validation is now handled by the hook's validateData, 
        // but we keep UI expansion logic here for better UX
        if (!data.patientInfo.name || !data.patientInfo.age || !data.patientInfo.gender) {
            setExpandedSections((prev) => new Set([...prev, "patient-info"]));
            // Hook validation will show toast
        } else if (data.selectedSymptoms.length === 0 && !data.otherSymptoms) {
            setExpandedSections((prev) => new Set([...prev, "symptoms"]));
        }

        await submitDiagnosis(
            data,
            patient ? { id: patient.id, user_id: patient.user_id } : undefined,
            {
                onClearDraft: clearDraft,
                redirectPath: "/doctor"
            }
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 md:px-4 py-2 md:py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/doctor")}
                            className="gap-1 md:gap-2 px-2 md:px-3"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                        <div className="h-6 w-px bg-slate-300 hidden sm:block" />
                        <h1 className="font-semibold text-slate-800 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">New Diagnosis</h1>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2">
                        {/* Progress indicator */}
                        <div className="hidden md:flex items-center gap-2 mr-4">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                                    style={{ width: `${getCompletionPercentage()}%` }}
                                />
                            </div>
                            <span className="text-xs text-slate-500">{getCompletionPercentage()}%</span>
                        </div>

                        {/* Mobile progress badge */}
                        <div className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                            {getCompletionPercentage()}%
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFillTestData}
                            className="gap-1 md:gap-2 px-2 md:px-3 h-9"
                        >
                            <FlaskConical className="w-4 h-4" />
                            <span className="hidden sm:inline">Test</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearData}
                            className="gap-1 md:gap-2 text-red-600 hover:text-red-700 px-2 md:px-3 h-9"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Clear</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Saved Draft Notice */}
            {hasSavedDraft && (
                <div className="max-w-4xl mx-auto px-3 md:px-4 pt-3 md:pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 flex items-center gap-2 md:gap-3">
                        <Save className="w-4 md:w-5 h-4 md:h-5 text-blue-600 shrink-0" />
                        <p className="text-xs md:text-sm text-blue-700">
                            Draft restored. Your work is auto-saved.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6 space-y-3 md:space-y-4">
                {/* Patient Information Section */}
                <CollapsibleSection
                    id="patient-info"
                    title="Patient Information"
                    icon={User}
                    isExpanded={expandedSections.has("patient-info")}
                    onToggle={() => toggleSection("patient-info")}
                    completionStatus={
                        data.patientInfo.name && data.patientInfo.age && data.patientInfo.gender
                            ? "complete"
                            : "incomplete"
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="patient-name">Patient Name *</Label>
                            <Input
                                id="patient-name"
                                value={data.patientInfo.name}
                                onChange={(e) => updatePatientInfo("name", e.target.value)}
                                placeholder="Enter patient name"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="patient-age">Age *</Label>
                            <Input
                                id="patient-age"
                                type="number"
                                value={data.patientInfo.age}
                                onChange={(e) => updatePatientInfo("age", e.target.value)}
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
                                        variant={data.patientInfo.gender === g ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => updatePatientInfo("gender", g)}
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
                                value={data.patientInfo.height}
                                onChange={(e) => updatePatientInfo("height", e.target.value)}
                                placeholder="Height in cm"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="patient-weight">Weight (kg)</Label>
                            <Input
                                id="patient-weight"
                                type="number"
                                value={data.patientInfo.weight}
                                onChange={(e) => updatePatientInfo("weight", e.target.value)}
                                placeholder="Weight in kg"
                                className="mt-1"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Symptoms Section */}
                <CollapsibleSection
                    id="symptoms"
                    title="Symptoms & Chief Complaints"
                    icon={Stethoscope}
                    isExpanded={expandedSections.has("symptoms")}
                    onToggle={() => toggleSection("symptoms")}
                    completionStatus={
                        data.selectedSymptoms.length > 0 || data.otherSymptoms
                            ? "complete"
                            : "incomplete"
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2 block">Quick Select Symptoms</Label>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_SYMPTOMS.map((symptom) => (
                                    <Button
                                        key={symptom}
                                        type="button"
                                        variant={data.selectedSymptoms.includes(symptom) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleSymptom(symptom)}
                                        className="h-8"
                                    >
                                        {data.selectedSymptoms.includes(symptom) && (
                                            <Check className="w-3 h-3 mr-1" />
                                        )}
                                        {symptom}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="other-symptoms">Other Symptoms / Details</Label>
                            <Textarea
                                id="other-symptoms"
                                value={data.otherSymptoms}
                                onChange={(e) => setData((prev: DoctorDiagnosisData) => ({ ...prev, otherSymptoms: e.target.value }))}
                                placeholder="Describe other symptoms or provide more details..."
                                className="mt-1 min-h-[100px]"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Tongue Analysis Section */}
                <CollapsibleSection
                    id="tongue"
                    title="Tongue Analysis"
                    icon={Camera}
                    isExpanded={expandedSections.has("tongue")}
                    onToggle={() => toggleSection("tongue")}
                    completionStatus={data.tongueImage ? "complete" : "incomplete"}
                >
                    <div className="space-y-4">
                        {data.tongueImage ? (
                            <div className="relative">
                                <img
                                    src={data.tongueImage}
                                    alt="Tongue capture"
                                    className="w-full max-w-sm mx-auto rounded-lg border"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setData((prev: DoctorDiagnosisData) => ({ ...prev, tongueImage: "" }))}
                                    className="absolute top-2 right-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : showTongueCamera ? (
                            <CameraCapture
                                type="tongue"
                                onCapture={handleTongueCapture}
                                onSkip={() => setShowTongueCamera(false)}
                                initialFacingMode="environment"
                            />
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full h-32 border-dashed"
                                onClick={() => setShowTongueCamera(true)}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Camera className="w-8 h-8 text-slate-400" />
                                    <span className="text-slate-600">Capture Tongue Image</span>
                                </div>
                            </Button>
                        )}
                    </div>
                </CollapsibleSection>

                {/* Face Analysis Section */}
                <CollapsibleSection
                    id="face"
                    title="Face Analysis"
                    icon={Camera}
                    isExpanded={expandedSections.has("face")}
                    onToggle={() => toggleSection("face")}
                    completionStatus={data.faceImage ? "complete" : "incomplete"}
                >
                    <div className="space-y-4">
                        {data.faceImage ? (
                            <div className="relative">
                                <img
                                    src={data.faceImage}
                                    alt="Face capture"
                                    className="w-full max-w-sm mx-auto rounded-lg border"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setData((prev: DoctorDiagnosisData) => ({ ...prev, faceImage: "" }))}
                                    className="absolute top-2 right-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : showFaceCamera ? (
                            <CameraCapture
                                type="face"
                                onCapture={handleFaceCapture}
                                onSkip={() => setShowFaceCamera(false)}
                                initialFacingMode="environment"
                            />
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full h-32 border-dashed"
                                onClick={() => setShowFaceCamera(true)}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Camera className="w-8 h-8 text-slate-400" />
                                    <span className="text-slate-600">Capture Face Image</span>
                                </div>
                            </Button>
                        )}
                    </div>
                </CollapsibleSection>

                {/* TCM Inquiry Section */}
                <CollapsibleSection
                    id="tcm-inquiry"
                    title="TCM Inquiry"
                    icon={MessageSquare}
                    isExpanded={expandedSections.has("tcm-inquiry")}
                    onToggle={() => toggleSection("tcm-inquiry")}
                    completionStatus={
                        Object.keys(data.inquiryAnswers).length > 0 ? "complete" : "incomplete"
                    }
                >
                    <QuickSelectInquiry
                        patientInfo={data.patientInfo}
                        symptoms={[...data.selectedSymptoms, data.otherSymptoms].filter(Boolean).join(", ")}
                        answers={data.inquiryAnswers}
                        onAnswersChange={handleInquiryUpdate}
                    />
                </CollapsibleSection>

                {/* Upload Reports Section */}
                <CollapsibleSection
                    id="reports"
                    title="Upload Reports"
                    icon={FileText}
                    isExpanded={expandedSections.has("reports")}
                    onToggle={() => toggleSection("reports")}
                    completionStatus={
                        data.uploadedReports.length > 0 ? "complete" : "incomplete"
                    }
                >
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => pdfInputRef.current?.click()}
                                variant="outline"
                                className="flex-1 gap-2 h-12 border-dashed"
                            >
                                <FileText className="w-5 h-5 text-blue-500" />
                                <span>Upload PDF Reports</span>
                            </Button>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="flex-1 gap-2 h-12 border-dashed"
                            >
                                <Camera className="w-5 h-5 text-emerald-500" />
                                <span>Upload Image Reports</span>
                            </Button>
                        </div>

                        {data.uploadedReports.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <Label className="text-sm font-medium text-slate-700">Uploaded Documents:</Label>
                                {data.uploadedReports.map((file: FileData, index: number) => {
                                    const fileId = file.name + (file as any).lastModified;
                                    const isExtracting = extractingFiles.has(fileId);

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm"
                                        >
                                            <div
                                                className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => setViewingReport(file)}
                                            >
                                                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isExtracting ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-slate-700 truncate">
                                                            {file.name}
                                                        </p>
                                                        {!isExtracting && <Eye className="w-3 h-3 text-slate-400" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {isExtracting
                                                            ? "Extracting text..."
                                                            : (file.extractedText ? `${file.extractedText.substring(0, 50)}...` : "No text extracted")}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeReport(index)}
                                                className="text-slate-400 hover:text-red-500 ml-2"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        <input
                            type="file"
                            ref={pdfInputRef}
                            className="hidden"
                            accept=".pdf,application/pdf"
                            multiple
                            onChange={handleFileChange}
                        />

                        {/* Report Content Viewer */}
                        <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
                            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[80vh] p-4 md:p-6">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-slate-800">
                                        <FileText className="w-5 h-5" />
                                        {viewingReport?.name}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extracted Text Content</Label>
                                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                                            {viewingReport?.extractedText || "No text could be extracted from this document."}
                                        </pre>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CollapsibleSection>

                {/* Current Medicines Section */}
                <CollapsibleSection
                    id="medicines"
                    title="Current Medicines"
                    icon={Pill}
                    isExpanded={expandedSections.has("medicines")}
                    onToggle={() => toggleSection("medicines")}
                    completionStatus={data.currentMedicines ? "complete" : "incomplete"}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="medicine-input">Add Medications / Supplements</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="medicine-input"
                                    value={medicineInput}
                                    onChange={(e) => setMedicineInput(e.target.value)}
                                    placeholder="Enter medicine name..."
                                    onKeyDown={(e) => e.key === "Enter" && addMedicine()}
                                    className="flex-1"
                                />
                                <Button onClick={addMedicine} disabled={!medicineInput.trim()}>
                                    Add
                                </Button>
                            </div>
                        </div>

                        {data.currentMedicines && (
                            <div className="flex flex-wrap gap-2 py-2">
                                {data.currentMedicines.split(",").map((med: string, idx: number) => {
                                    const cleanedMed = med.trim();
                                    if (!cleanedMed) return null;
                                    return (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="px-3 py-1 gap-2 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors"
                                        >
                                            {cleanedMed}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-red-500"
                                                onClick={() => removeMedicine(cleanedMed)}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        <div className="pt-2">
                            <Label htmlFor="current-medicines">Additional Medication Notes</Label>
                            <Textarea
                                id="current-medicines"
                                value={data.currentMedicines}
                                onChange={(e) => setData((prev: DoctorDiagnosisData) => ({ ...prev, currentMedicines: e.target.value }))}
                                placeholder="Any additional notes about dosage, frequency, or other medications..."
                                className="mt-1 min-h-[80px]"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Clinical Notes & Treatment Plan */}
                <CollapsibleSection
                    id="clinical-notes"
                    title="Clinical Notes & Treatment"
                    icon={FileText}
                    isExpanded={expandedSections.has("clinical-notes")}
                    onToggle={() => toggleSection("clinical-notes")}
                    completionStatus={data.clinicalNotes || data.treatmentPlan ? "complete" : "incomplete"}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="clinical-notes-input">Clinical Observations & Findings</Label>
                            <Textarea
                                id="clinical-notes-input"
                                value={data.clinicalNotes}
                                onChange={(e) => setData((prev: DoctorDiagnosisData) => ({ ...prev, clinicalNotes: e.target.value }))}
                                placeholder="Enter your clinical observations, pulse analysis, or other findings..."
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="treatment-plan-input">Proposed Treatment Plan</Label>
                            <Textarea
                                id="treatment-plan-input"
                                value={data.treatmentPlan}
                                onChange={(e) => setData((prev: DoctorDiagnosisData) => ({ ...prev, treatmentPlan: e.target.value }))}
                                placeholder="Enter acupuncture points, herbal formula adjustments, or diet advice..."
                                className="min-h-[120px]"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Submit Button */}
                <div className="pt-4 md:pt-6 pb-8 md:pb-12">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full h-12 md:h-14 text-base md:text-lg gap-2 md:gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Report...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Generate TCM Report
                            </>
                        )}
                    </Button>
                </div>
            </main>
        </div>
    );
}
