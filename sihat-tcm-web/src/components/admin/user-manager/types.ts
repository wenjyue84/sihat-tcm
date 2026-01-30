export interface UserProfile {
  id: string;
  email?: string;
  role: "patient" | "doctor" | "admin" | "developer";
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  medical_history?: string;
  updated_at?: string;
  created_at?: string;
}

export type RoleFilter = "all" | "patient" | "doctor" | "admin" | "developer";

export interface UserStats {
  total: number;
  patients: number;
  doctors: number;
  admins: number;
  developers: number;
}
