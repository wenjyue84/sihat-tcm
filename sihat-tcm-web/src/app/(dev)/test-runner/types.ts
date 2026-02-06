export type TestStatus = "pending" | "running" | "passed" | "failed" | "skipped";
export type TestCategory =
  | "Step 1: Basic Info"
  | "Step 2: TCM Inquiry"
  | "Step 3: Tongue Analysis"
  | "Step 4: Face Analysis"
  | "Step 5: Voice Analysis"
  | "Step 6: Pulse Check"
  | "Step 7: Smart Connect"
  | "Step 8: Report Generation"
  | "Core Utilities"
  | "System Health";

export interface TestResult {
  id: string;
  number: number;
  name: string;
  description: string;
  category: TestCategory;
  status: TestStatus;
  message?: string;
  error?: any;
  duration?: number;
  critical?: boolean;
}
