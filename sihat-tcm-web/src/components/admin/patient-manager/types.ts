export interface Patient {
  id: string;
  role: "patient" | "doctor" | "admin";
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  medical_history?: string;
  updated_at?: string;
  inquiry_count?: number;
}

export interface PatientFormData {
  full_name: string;
  age?: number;
  gender: string;
  height?: number;
  weight?: number;
  medical_history: string;
  role: "patient" | "doctor" | "admin";
}

export interface BMICategory {
  label: string;
  color: string;
}

export interface PatientManagerState {
  patients: Patient[];
  loading: boolean;
  isDialogOpen: boolean;
  isViewDialogOpen: boolean;
  editingId: string | null;
  viewingPatient: Patient | null;
  saving: boolean;
  deleting: string | null;
  searchQuery: string;
  currentPage: number;
  formData: PatientFormData;
}
