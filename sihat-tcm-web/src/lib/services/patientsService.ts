/**
 * Patients Service
 *
 * Encapsulates all Supabase operations for patients table.
 */

import type { Patient, PatientStatus, PatientType, PatientFlag } from "@/types/database";
import type { ServiceResult, SupabaseInstance, PaginationOptions, SortOptions } from "./types";
import { toServiceError } from "./types";

export interface PatientListOptions extends PaginationOptions, Partial<SortOptions> {
  status?: PatientStatus;
  type?: PatientType;
  createdBy?: string;
  searchQuery?: string;
}

export interface CreatePatientDTO {
  first_name: string;
  last_name?: string;
  ic_no?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  status?: PatientStatus;
  type?: PatientType;
  user_id?: string;
  created_by?: string;
}

export interface PatientsService {
  getById(id: string): Promise<ServiceResult<Patient>>;
  getByUserId(userId: string): Promise<ServiceResult<Patient>>;
  list(options?: PatientListOptions): Promise<ServiceResult<Patient[]>>;
  listByDoctor(doctorId: string, options?: PatientListOptions): Promise<ServiceResult<Patient[]>>;
  search(query: string, options?: PatientListOptions): Promise<ServiceResult<Patient[]>>;
  create(data: CreatePatientDTO): Promise<ServiceResult<Patient>>;
  update(id: string, data: Partial<Patient>): Promise<ServiceResult<Patient>>;
  updateFlag(id: string, flag: PatientFlag): Promise<ServiceResult<void>>;
  updateClinicalSummary(
    id: string,
    summary: Patient["clinical_summary"]
  ): Promise<ServiceResult<void>>;
  archive(id: string): Promise<ServiceResult<void>>;
  delete(id: string): Promise<ServiceResult<void>>;
  count(options?: { status?: PatientStatus; createdBy?: string }): Promise<ServiceResult<number>>;
}

export function createPatientsService(supabase: SupabaseInstance): PatientsService {
  return {
    async getById(id: string): Promise<ServiceResult<Patient>> {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Patient, error: null };
    },

    async getByUserId(userId: string): Promise<ServiceResult<Patient>> {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Patient, error: null };
    },

    async list(options: PatientListOptions = {}): Promise<ServiceResult<Patient[]>> {
      const {
        page = 1,
        limit = 50,
        column = "created_at",
        ascending = false,
        status,
        type,
        createdBy,
      } = options;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("patients")
        .select("*")
        .order(column, { ascending })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq("status", status);
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (createdBy) {
        query = query.eq("created_by", createdBy);
      }

      const { data, error } = await query;

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Patient[], error: null };
    },

    async listByDoctor(
      doctorId: string,
      options: PatientListOptions = {}
    ): Promise<ServiceResult<Patient[]>> {
      return this.list({ ...options, createdBy: doctorId });
    },

    async search(
      query: string,
      options: PatientListOptions = {}
    ): Promise<ServiceResult<Patient[]>> {
      const { page = 1, limit = 50, column = "created_at", ascending = false } = options;
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,ic_no.ilike.%${query}%,email.ilike.%${query}%`
        )
        .order(column, { ascending })
        .range(offset, offset + limit - 1);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Patient[], error: null };
    },

    async create(data: CreatePatientDTO): Promise<ServiceResult<Patient>> {
      const { data: result, error } = await supabase
        .from("patients")
        .insert({
          ...data,
          status: data.status ?? "active",
          type: data.type ?? "managed",
        })
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Patient, error: null };
    },

    async update(id: string, data: Partial<Patient>): Promise<ServiceResult<Patient>> {
      const { data: result, error } = await supabase
        .from("patients")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Patient, error: null };
    },

    async updateFlag(id: string, flag: PatientFlag): Promise<ServiceResult<void>> {
      const { error } = await supabase.from("patients").update({ flag }).eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async updateClinicalSummary(
      id: string,
      summary: Patient["clinical_summary"]
    ): Promise<ServiceResult<void>> {
      const { error } = await supabase
        .from("patients")
        .update({ clinical_summary: summary })
        .eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async archive(id: string): Promise<ServiceResult<void>> {
      const { error } = await supabase
        .from("patients")
        .update({ status: "archived" as PatientStatus })
        .eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async delete(id: string): Promise<ServiceResult<void>> {
      const { error } = await supabase.from("patients").delete().eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async count(
      options: { status?: PatientStatus; createdBy?: string } = {}
    ): Promise<ServiceResult<number>> {
      let query = supabase.from("patients").select("*", { count: "exact", head: true });

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.createdBy) {
        query = query.eq("created_by", options.createdBy);
      }

      const { count, error } = await query;

      if (error) return { data: null, error: toServiceError(error) };
      return { data: count ?? 0, error: null };
    },
  };
}
