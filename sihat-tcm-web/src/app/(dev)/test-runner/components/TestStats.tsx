/**
 * Test Statistics Component
 * 
 * Displays overall test statistics
 */

import { TestResult, TestStatus } from "../types";

interface TestStatsProps {
  tests: TestResult[];
}

export function TestStats({ tests }: TestStatsProps) {
  const stats = {
    total: tests.length,
    passed: tests.filter((t) => t.status === "passed").length,
    failed: tests.filter((t) => t.status === "failed").length,
    pending: tests.filter((t) => t.status === "pending").length,
    running: tests.filter((t) => t.status === "running").length,
    critical: tests.filter((t) => t.critical).length,
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-slate-300 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800/50">
        {stats.total} Total
      </span>
      {stats.passed > 0 && (
        <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/50">
          {stats.passed} Passed
        </span>
      )}
      {stats.failed > 0 && (
        <span className="text-sm font-semibold text-red-400 bg-red-950/50 px-3 py-1 rounded-full border border-red-800/50">
          {stats.failed} Failed
        </span>
      )}
      {stats.pending > 0 && (
        <span className="text-sm font-semibold text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800/50">
          {stats.pending} Pending
        </span>
      )}
      {stats.running > 0 && (
        <span className="text-sm font-semibold text-blue-400 bg-blue-950/50 px-3 py-1 rounded-full border border-blue-800/50">
          {stats.running} Running
        </span>
      )}
      {stats.critical > 0 && (
        <span className="text-sm font-semibold text-amber-400 bg-amber-950/50 px-3 py-1 rounded-full border border-amber-800/50">
          {stats.critical} Critical
        </span>
      )}
    </div>
  );
}


