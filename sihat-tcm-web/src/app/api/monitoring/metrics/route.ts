/**
 * @fileoverview Monitoring Metrics API Endpoint
 *
 * Handles collection and storage of performance, security, and system metrics.
 * Provides endpoints for metric ingestion and retrieval.
 *
 * @author Sihat TCM Development Team
 * @version 3.0
 */

import { NextRequest, NextResponse } from "next/server";
import { devLog } from "@/lib/systemLogger";
import { createClient } from "@/lib/supabase/server";

/**
 * System metric interface
 */
interface SystemMetric {
  type: string;
  name: string;
  value: number | string;
  unit: string;
  tags: Record<string, string>;
  timestamp: string;
  metadata?: Record<string, unknown>;
  aggregation?: string;
  count?: number;
}

/**
 * POST /api/monitoring/metrics
 *
 * Collect and store metrics from the application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, metrics, timestamp } = body;

    if (!type || !metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected type, metrics array, and timestamp." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store metrics in database
    const metricsToStore = metrics.map((metric) => ({
      type,
      name: metric.name || "unknown",
      value: metric.value || 0,
      unit: metric.unit || "count",
      tags: metric.tags || {},
      timestamp: new Date(metric.timestamp || timestamp || Date.now()).toISOString(),
      metadata: metric.metadata || {},
    }));

    const { error } = await supabase.from("system_metrics").insert(metricsToStore);

    if (error) {
      devLog("error", "MonitoringAPI", "Failed to store metrics", { error });
      return NextResponse.json({ error: "Failed to store metrics" }, { status: 500 });
    }

    devLog("info", "MonitoringAPI", `Stored ${metrics.length} ${type} metrics`);

    return NextResponse.json({
      success: true,
      stored: metrics.length,
      type,
    });
  } catch (error) {
    devLog("error", "MonitoringAPI", "Error processing metrics", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/monitoring/metrics
 *
 * Retrieve metrics for analysis and dashboards
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "1000");
    const aggregation = searchParams.get("aggregation"); // 'avg', 'sum', 'count', 'max', 'min'

    const supabase = await createClient();

    let query = supabase
      .from("system_metrics")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    // Apply filters
    if (type) {
      query = query.eq("type", type);
    }

    if (startDate) {
      query = query.gte("timestamp", startDate);
    }

    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    const { data: metrics, error } = await query;

    if (error) {
      devLog("error", "MonitoringAPI", "Failed to retrieve metrics", { error });
      return NextResponse.json({ error: "Failed to retrieve metrics" }, { status: 500 });
    }

    // Apply aggregation if requested
    let result = metrics || [];

    if (aggregation && result.length > 0) {
      result = applyAggregation(result, aggregation);
    }

    return NextResponse.json({
      success: true,
      metrics: result,
      count: result.length,
      filters: {
        type,
        startDate,
        endDate,
        limit,
        aggregation,
      },
    });
  } catch (error) {
    devLog("error", "MonitoringAPI", "Error retrieving metrics", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Apply aggregation to metrics
 */
function applyAggregation(metrics: SystemMetric[], aggregationType: string): SystemMetric[] {
  const grouped = metrics.reduce(
    (acc, metric) => {
      const key = `${metric.type}_${metric.name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    },
    {} as Record<string, SystemMetric[]>
  );

  return Object.entries(grouped).map(([key, groupMetrics]) => {
    const values = groupMetrics.map((m) => parseFloat(String(m.value)) || 0);
    let aggregatedValue: number;

    switch (aggregationType) {
      case "avg":
        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case "sum":
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case "count":
        aggregatedValue = values.length;
        break;
      case "max":
        aggregatedValue = Math.max(...values);
        break;
      case "min":
        aggregatedValue = Math.min(...values);
        break;
      default:
        aggregatedValue = values[0] || 0;
    }

    return {
      type: groupMetrics[0].type,
      name: groupMetrics[0].name,
      value: aggregatedValue,
      unit: groupMetrics[0].unit,
      tags: groupMetrics[0].tags,
      aggregation: aggregationType,
      count: values.length,
      timestamp: groupMetrics[0].timestamp,
    };
  });
}
