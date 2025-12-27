export interface BasicInfoData {
  name: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  mainComplaint: string;
  otherSymptoms: string;
  symptoms: string;
  symptomDuration: string;
}

export interface MobileNumericInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  quickValues?: number[];
  required?: boolean;
}
