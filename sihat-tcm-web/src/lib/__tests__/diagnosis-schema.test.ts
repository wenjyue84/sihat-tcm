/**
 * Phase 1: Database Schema Tests
 *
 * Tests for the diagnosis input data schema migration.
 * These tests validate the expected structure and constraints.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Phase 1: Diagnosis Input Data Schema", () => {
  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/20250102000001_add_diagnosis_input_data.sql"
  );

  describe("Migration File Validation", () => {
    it("should have the migration file", () => {
      const migrationExists = () => {
        try {
          readFileSync(migrationPath, "utf-8");
          return true;
        } catch {
          return false;
        }
      };

      expect(migrationExists()).toBe(true);
    });

    it("should contain all required column additions for diagnosis_sessions", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      // Inquiry data columns
      expect(migration).toContain("inquiry_summary text");
      expect(migration).toContain("inquiry_chat_history jsonb");
      expect(migration).toContain("inquiry_report_files jsonb");
      expect(migration).toContain("inquiry_medicine_files jsonb");

      // Visual analysis columns
      expect(migration).toContain("tongue_analysis jsonb");
      expect(migration).toContain("face_analysis jsonb");
      expect(migration).toContain("body_analysis jsonb");

      // Audio analysis
      expect(migration).toContain("audio_analysis jsonb");

      // Pulse data
      expect(migration).toContain("pulse_data jsonb");

      // Guest session support
      expect(migration).toContain("is_guest_session boolean");
      expect(migration).toContain("guest_email text");
      expect(migration).toContain("guest_name text");
    });

    it("should create guest_diagnosis_sessions table", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toContain("create table if not exists public.guest_diagnosis_sessions");
      expect(migration).toContain("session_token text unique not null");
      expect(migration).toContain("migrated_to_user_id uuid");
      expect(migration).toContain("migrated_at timestamp");
    });

    it("should create all required indexes", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      // diagnosis_sessions indexes
      expect(migration).toContain("diagnosis_sessions_inquiry_summary_idx");
      expect(migration).toContain("diagnosis_sessions_is_guest_idx");
      expect(migration).toContain("diagnosis_sessions_guest_email_idx");
      expect(migration).toContain("diagnosis_sessions_tongue_analysis_idx");
      expect(migration).toContain("diagnosis_sessions_face_analysis_idx");
      expect(migration).toContain("diagnosis_sessions_pulse_data_idx");

      // guest_diagnosis_sessions indexes
      expect(migration).toContain("guest_diagnosis_sessions_token_idx");
      expect(migration).toContain("guest_diagnosis_sessions_email_idx");
      expect(migration).toContain("guest_diagnosis_sessions_migrated_idx");
      expect(migration).toContain("guest_diagnosis_sessions_created_at_idx");
    });

    it("should enable RLS on guest_diagnosis_sessions", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toContain(
        "alter table public.guest_diagnosis_sessions enable row level security"
      );
    });

    it("should create RLS policies for guest_diagnosis_sessions", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toContain("Anyone can create guest sessions");
      expect(migration).toContain("Token holders can view their guest session");
      expect(migration).toContain("Users can view their migrated guest sessions");
      expect(migration).toContain("System can update guest sessions for migration");
    });

    it("should create trigger for guest_diagnosis_sessions updated_at", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toContain("update_guest_diagnosis_sessions_updated_at");
      expect(migration).toContain("create trigger update_guest_diagnosis_sessions_updated_at");
    });

    it("should have proper SQL syntax (no obvious syntax errors)", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      // Check for balanced parentheses in CREATE TABLE
      const createTableMatches = migration.match(/create table[^;]*\(/gi) || [];
      const closingParens = (migration.match(/\);/g) || []).length;

      // Should have at least one CREATE TABLE and proper closing
      expect(createTableMatches.length).toBeGreaterThan(0);

      // Check for proper ALTER TABLE syntax
      expect(migration).toMatch(/alter table\s+public\.diagnosis_sessions/gi);

      // Check for proper comment syntax
      expect(migration).toMatch(/comment on (table|column)/gi);
    });
  });

  describe("Schema Structure Validation", () => {
    it("should define correct data types for all input fields", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      // Text fields
      expect(migration).toMatch(/inquiry_summary\s+text/);
      expect(migration).toMatch(/guest_email\s+text/);
      expect(migration).toMatch(/guest_name\s+text/);

      // JSONB fields
      expect(migration).toMatch(/inquiry_chat_history\s+jsonb/);
      expect(migration).toMatch(/inquiry_report_files\s+jsonb/);
      expect(migration).toMatch(/tongue_analysis\s+jsonb/);
      expect(migration).toMatch(/face_analysis\s+jsonb/);
      expect(migration).toMatch(/body_analysis\s+jsonb/);
      expect(migration).toMatch(/audio_analysis\s+jsonb/);
      expect(migration).toMatch(/pulse_data\s+jsonb/);

      // Boolean field
      expect(migration).toMatch(/is_guest_session\s+boolean/);
    });

    it("should have proper default values", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toMatch(/is_guest_session\s+boolean\s+default\s+false/);
    });

    it("should have proper constraints on guest_diagnosis_sessions", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      // session_token should be unique and not null
      expect(migration).toMatch(/session_token\s+text\s+unique\s+not\s+null/);

      // overall_score should have check constraint
      expect(migration).toMatch(/overall_score\s+integer\s+check/);

      // migrated_to_user_id should reference auth.users
      expect(migration).toMatch(/migrated_to_user_id\s+uuid\s+references\s+auth\.users/);
    });
  });

  describe("Documentation Validation", () => {
    it("should have comments for all new columns", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      const columnComments = [
        "inquiry_summary",
        "inquiry_chat_history",
        "inquiry_report_files",
        "inquiry_medicine_files",
        "tongue_analysis",
        "face_analysis",
        "body_analysis",
        "audio_analysis",
        "pulse_data",
        "is_guest_session",
        "guest_email",
        "guest_name",
      ];

      columnComments.forEach((column) => {
        expect(migration).toMatch(
          new RegExp(`comment on column.*diagnosis_sessions\\.${column}`, "i")
        );
      });
    });

    it("should have table comment for guest_diagnosis_sessions", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toMatch(/comment on table.*guest_diagnosis_sessions/i);
    });
  });

  describe("Index Strategy Validation", () => {
    it("should use GIN indexes for JSONB columns", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toMatch(/using gin\(tongue_analysis\)/);
      expect(migration).toMatch(/using gin\(face_analysis\)/);
      expect(migration).toMatch(/using gin\(pulse_data\)/);
    });

    it("should use partial indexes where appropriate", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      // Guest email index should be partial (only for guest sessions)
      expect(migration).toMatch(/where is_guest_session = true/);

      // JSONB indexes should be partial (only where not null)
      expect(migration).toMatch(/where tongue_analysis is not null/);
      expect(migration).toMatch(/where face_analysis is not null/);
      expect(migration).toMatch(/where pulse_data is not null/);
    });

    it("should use full-text search for inquiry_summary", () => {
      const migration = readFileSync(migrationPath, "utf-8");

      expect(migration).toMatch(/to_tsvector\('english', inquiry_summary\)/);
    });
  });
});

