#!/usr/bin/env node
/**
 * Commit Scope Suggestion Script
 *
 * Analyzes staged files and suggests appropriate commit scopes
 * based on file paths and patterns.
 *
 * Usage: npm run git:scope
 */

import { execSync } from "child_process";
import { basename } from "path";

// Scope mapping patterns (order matters - first match wins)
const SCOPE_PATTERNS = [
  // Features
  { pattern: /src\/features\/diagnosis/, scope: "diagnosis", description: "Diagnosis wizard and 4-Examination Model" },
  { pattern: /src\/components\/doctor/, scope: "doctor", description: "Doctor portal and dashboard" },
  { pattern: /src\/components\/patient/, scope: "patient", description: "Patient dashboard and features" },
  { pattern: /src\/features\/doctor/, scope: "doctor", description: "Doctor portal features" },

  // Core systems
  { pattern: /src\/contexts\/AuthContext/, scope: "auth", description: "Authentication system" },
  { pattern: /src\/lib\/auth/, scope: "auth", description: "Authentication utilities" },
  { pattern: /src\/app\/login/, scope: "auth", description: "Login flow" },

  // API
  { pattern: /src\/app\/api/, scope: "api", description: "API routes and endpoints" },
  { pattern: /src\/lib\/api/, scope: "api", description: "API utilities" },

  // Database
  { pattern: /drizzle|migrations|schema\.ts/, scope: "db", description: "Database schema and migrations" },
  { pattern: /supabase/, scope: "db", description: "Supabase configuration" },

  // UI/Components
  { pattern: /src\/components\/ui/, scope: "ui", description: "Shared UI components" },
  { pattern: /src\/lib\/design/, scope: "ui", description: "Design system" },

  // IoT
  { pattern: /lib\/device-integration/, scope: "iot", description: "IoT device integration" },
  { pattern: /SmartConnect|pulse|sensor/i, scope: "iot", description: "IoT features" },

  // Testing
  { pattern: /\.test\.|\.spec\.|vitest|playwright/, scope: "test", description: "Tests and testing infrastructure" },

  // Configuration
  { pattern: /\.husky\/|commitlint|lint-staged/, scope: "hooks", description: "Git hooks configuration" },
  { pattern: /package\.json|package-lock\.json/, scope: "deps", description: "Dependencies" },
  { pattern: /tsconfig|vite\.config|next\.config/, scope: "config", description: "Build configuration" },
  { pattern: /\.env|\.env\.example/, scope: "config", description: "Environment configuration" },
  { pattern: /vercel\.json|\.github\//, scope: "ci", description: "CI/CD configuration" },

  // Documentation
  { pattern: /\.md$|docs\//, scope: "docs", description: "Documentation" },

  // Scripts
  { pattern: /scripts\/|seed|migrate/, scope: "scripts", description: "Build and maintenance scripts" },
];

/**
 * Get staged files from git
 */
function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"] // Suppress stderr warnings
    });
    return output.trim().split("\n").filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * Analyze files and suggest scopes
 */
function analyzeScopesFromFiles(files) {
  const scopeCounts = new Map();

  for (const file of files) {
    for (const { pattern, scope, description } of SCOPE_PATTERNS) {
      if (pattern.test(file)) {
        if (!scopeCounts.has(scope)) {
          scopeCounts.set(scope, { count: 0, description, files: [] });
        }
        const entry = scopeCounts.get(scope);
        entry.count++;
        entry.files.push(file);
        break; // Use first match only
      }
    }
  }

  // Sort by frequency
  return Array.from(scopeCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([scope, data]) => ({ scope, ...data }));
}

/**
 * Format scope suggestions for terminal output
 */
function formatSuggestions(scopes) {
  if (scopes.length === 0) {
    return [
      "",
      "No staged files found. Stage files first with: git add <files>",
      ""
    ].join("\n");
  }

  const lines = [
    "",
    "🎯 Suggested commit scopes (based on staged files):",
    ""
  ];

  scopes.forEach(({ scope, count, description, files }, index) => {
    const rank = index + 1;
    lines.push(`  ${rank}. ${scope.padEnd(15)} (${count} file${count > 1 ? 's' : ''})  - ${description}`);
  });

  lines.push("");
  lines.push("📝 Example commit messages:");
  lines.push("");

  scopes.slice(0, 3).forEach(({ scope }) => {
    lines.push(`  feat(${scope}): add new feature`);
    lines.push(`  fix(${scope}): resolve bug`);
    lines.push(`  refactor(${scope}): improve code structure`);
    lines.push("");
  });

  lines.push("💡 Tip: For commits affecting multiple scopes, choose the primary one");
  lines.push("        or use a broader scope like 'app' or omit the scope entirely.");
  lines.push("");

  return lines.join("\n");
}

/**
 * Main execution
 */
function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log("\n⚠️  No files staged for commit.");
    console.log("\nStage files first with:");
    console.log("  git add <files>");
    console.log("\nOr stage all changes:");
    console.log("  git add -A");
    console.log("");
    process.exit(0);
  }

  const scopes = analyzeScopesFromFiles(stagedFiles);
  console.log(formatSuggestions(scopes));

  // Show file breakdown for top scope
  if (scopes.length > 0) {
    const topScope = scopes[0];
    console.log(`📂 Files for primary scope '${topScope.scope}':`);
    topScope.files.slice(0, 5).forEach(file => {
      const shortPath = file.length > 60 ? '...' + file.slice(-57) : file;
      console.log(`   • ${shortPath}`);
    });
    if (topScope.files.length > 5) {
      console.log(`   ... and ${topScope.files.length - 5} more`);
    }
    console.log("");
  }
}

main();
