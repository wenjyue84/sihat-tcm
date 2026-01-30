export interface QuickFix {
  id: string;
  title: string;
  ailment: string;
  movement: string;
  duration: number;
  color: string;
  image: string;
}

export interface DeskRoutine {
  id: string;
  title: string;
  desc: string;
  duration: number; // in seconds
  icon: React.ElementType;
  steps: string[];
  color?: string;
}
