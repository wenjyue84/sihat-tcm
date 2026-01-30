export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type IndicatorSize = "sm" | "md" | "lg";

export interface StatusConfig {
  icon: React.ElementType;
  color: string;
  bg: string;
}

export interface SeverityConfig {
  color: string;
  label: string;
}

export interface Trend {
  value: number;
  isPositive: boolean;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: Trend;
  status?: HealthStatus;
}

export interface StatusIndicatorProps {
  status: HealthStatus;
  size?: IndicatorSize;
}
