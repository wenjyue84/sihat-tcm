/**
 * Profiles Service
 *
 * Encapsulates all Supabase operations for profiles table.
 */

import type { ServiceResult, SupabaseInstance, PaginationOptions, SortOptions } from "./types";
import { toServiceError } from "./types";

export interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  medical_history?: unknown;
  is_approved?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileListOptions extends PaginationOptions, Partial<SortOptions> {
  role?: string;
  isApproved?: boolean;
}

export interface ProfilesService {
  getById(id: string): Promise<ServiceResult<Profile>>;
  getByEmail(email: string): Promise<ServiceResult<Profile>>;
  list(options?: ProfileListOptions): Promise<ServiceResult<Profile[]>>;
  listByRole(role: string, options?: ProfileListOptions): Promise<ServiceResult<Profile[]>>;
  create(data: Partial<Profile> & { id: string }): Promise<ServiceResult<Profile>>;
  update(id: string, data: Partial<Profile>): Promise<ServiceResult<Profile>>;
  upsert(data: Partial<Profile> & { id: string }): Promise<ServiceResult<Profile>>;
  delete(id: string): Promise<ServiceResult<void>>;
  updateMedicalHistory(id: string, medicalHistory: unknown): Promise<ServiceResult<void>>;
  approveDoctor(id: string): Promise<ServiceResult<void>>;
  count(role?: string): Promise<ServiceResult<number>>;
}

export function createProfilesService(supabase: SupabaseInstance): ProfilesService {
  return {
    async getById(id: string): Promise<ServiceResult<Profile>> {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Profile, error: null };
    },

    async getByEmail(email: string): Promise<ServiceResult<Profile>> {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Profile, error: null };
    },

    async list(options: ProfileListOptions = {}): Promise<ServiceResult<Profile[]>> {
      const {
        page = 1,
        limit = 50,
        column = "created_at",
        ascending = false,
        role,
        isApproved,
      } = options;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("profiles")
        .select("*")
        .order(column, { ascending })
        .range(offset, offset + limit - 1);

      if (role) {
        query = query.eq("role", role);
      }

      if (isApproved !== undefined) {
        query = query.eq("is_approved", isApproved);
      }

      const { data, error } = await query;

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Profile[], error: null };
    },

    async listByRole(
      role: string,
      options: ProfileListOptions = {}
    ): Promise<ServiceResult<Profile[]>> {
      return this.list({ ...options, role });
    },

    async create(data: Partial<Profile> & { id: string }): Promise<ServiceResult<Profile>> {
      const { data: result, error } = await supabase
        .from("profiles")
        .insert(data)
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Profile, error: null };
    },

    async update(id: string, data: Partial<Profile>): Promise<ServiceResult<Profile>> {
      const { data: result, error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Profile, error: null };
    },

    async upsert(data: Partial<Profile> & { id: string }): Promise<ServiceResult<Profile>> {
      const { data: result, error } = await supabase
        .from("profiles")
        .upsert(data)
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Profile, error: null };
    },

    async delete(id: string): Promise<ServiceResult<void>> {
      const { error } = await supabase.from("profiles").delete().eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async updateMedicalHistory(id: string, medicalHistory: unknown): Promise<ServiceResult<void>> {
      const { error } = await supabase
        .from("profiles")
        .update({ medical_history: medicalHistory })
        .eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async approveDoctor(id: string): Promise<ServiceResult<void>> {
      const { error } = await supabase.from("profiles").update({ is_approved: true }).eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async count(role?: string): Promise<ServiceResult<number>> {
      let query = supabase.from("profiles").select("*", { count: "exact", head: true });

      if (role) {
        query = query.eq("role", role);
      }

      const { count, error } = await query;

      if (error) return { data: null, error: toServiceError(error) };
      return { data: count ?? 0, error: null };
    },
  };
}
