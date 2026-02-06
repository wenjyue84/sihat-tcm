"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusIndicator } from "./StatusIndicator";
import type { MetricCardProps } from "../types";

export function MetricCard({ title, value, icon: Icon, trend, status }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-2xl font-bold">{value}</p>
              {status && <StatusIndicator status={status} size="sm" />}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp
                  className={`w-3 h-3 ${trend.isPositive ? "text-green-500" : "text-red-500"}`}
                />
                <span className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-muted rounded-full">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
