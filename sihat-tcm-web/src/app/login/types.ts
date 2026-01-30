export interface FormData {
  email: string;
  password: string;
  fullName: string;
}

export interface RoleConfig {
  id: "patient" | "doctor" | "admin" | "developer";
  title: string;
  chinese: string;
  description: string;
  icon: React.FC;
  color: "emerald" | "amber" | "slate" | "violet";
}

export interface ColorClasses {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
}

export type AuthMode = "login" | "signup";
