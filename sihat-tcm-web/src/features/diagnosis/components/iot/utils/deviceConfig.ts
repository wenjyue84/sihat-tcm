/**
 * IoT Device Configuration
 * Extracted from IoTConnectionWizard.tsx to improve maintainability
 */

import { Heart, Activity, Droplets, Thermometer, Brain } from "lucide-react";
import type { IoTDeviceType } from "../../IoTConnectionWizard";

export interface DeviceConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  unit: string;
  label: string;
  placeholder: string;
  description: string;
  normalRangeText: string;
}

export const deviceConfig: Record<IoTDeviceType, DeviceConfig> = {
  pulse: {
    name: "Pulse Rate",
    icon: Heart,
    color: "text-rose-500",
    unit: "BPM",
    label: "Pulse Rate",
    placeholder: "e.g. 75",
    description:
      "Heart rate is the speed of the heartbeat measured by the number of contractions (beats) of the heart per minute (bpm).",
    normalRangeText: "60 - 100 BPM",
  },
  bp: {
    name: "Blood Pressure",
    icon: Activity,
    color: "text-blue-500",
    unit: "mmHg",
    label: "Blood Pressure",
    placeholder: "120/80",
    description:
      "Blood pressure is the pressure of circulating blood against the walls of blood vessels.",
    normalRangeText: "90/60 - 120/80 mmHg",
  },
  oxygen: {
    name: "Blood Oxygen",
    icon: Droplets,
    color: "text-cyan-500",
    unit: "%",
    label: "SpO2",
    placeholder: "e.g. 98",
    description:
      "Blood oxygen level is a measure of how much oxygen your red blood cells are carrying.",
    normalRangeText: "95% - 100%",
  },
  temp: {
    name: "Body Temperature",
    icon: Thermometer,
    color: "text-amber-500",
    unit: "°C",
    label: "Temperature",
    placeholder: "e.g. 36.5",
    description:
      "Body temperature is a measure of your body's ability to generate and get rid of heat.",
    normalRangeText: "36.1°C - 37.2°C",
  },
  hrv: {
    name: "Heart Rate Variability",
    icon: Activity,
    color: "text-purple-500",
    unit: "ms",
    label: "HRV",
    placeholder: "e.g. 50",
    description:
      "Heart rate variability is the physiological phenomenon of variation in the time interval between heartbeats.",
    normalRangeText: "20 - 70 ms",
  },
  stress: {
    name: "Stress Level",
    icon: Brain,
    color: "text-orange-500",
    unit: "Score",
    label: "Stress Score",
    placeholder: "e.g. 25",
    description:
      "Stress level is estimated based on your heart rate variability and other physiological data.",
    normalRangeText: "10 - 40",
  },
};
