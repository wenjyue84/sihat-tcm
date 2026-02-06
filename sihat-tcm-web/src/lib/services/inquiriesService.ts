/**
 * Inquiries Service
 *
 * Encapsulates all Supabase operations for inquiries table.
 */

import type { ServiceResult, SupabaseInstance, PaginationOptions, SortOptions } from "./types";
import { toServiceError } from "./types";

export interface Inquiry {
  id: string;
  user_id: string;
  diagnosis_session_id?: string | null;
  message: string;
  response?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInquiryDTO {
  user_id: string;
  diagnosis_session_id?: string;
  message: string;
  response?: string;
  status?: string;
}

export interface InquiryListOptions extends PaginationOptions, Partial<SortOptions> {
  userId?: string;
  diagnosisSessionId?: string;
  status?: string;
}

export interface InquiriesService {
  getById(id: string): Promise<ServiceResult<Inquiry>>;
  list(options?: InquiryListOptions): Promise<ServiceResult<Inquiry[]>>;
  listByUserId(userId: string, options?: InquiryListOptions): Promise<ServiceResult<Inquiry[]>>;
  listByDiagnosisSession(
    sessionId: string,
    options?: InquiryListOptions
  ): Promise<ServiceResult<Inquiry[]>>;
  create(data: CreateInquiryDTO): Promise<ServiceResult<Inquiry>>;
  update(id: string, data: Partial<Inquiry>): Promise<ServiceResult<Inquiry>>;
  respond(id: string, response: string): Promise<ServiceResult<Inquiry>>;
  delete(id: string): Promise<ServiceResult<void>>;
  deleteByUserId(userId: string): Promise<ServiceResult<void>>;
  count(userId?: string): Promise<ServiceResult<number>>;
}

export function createInquiriesService(supabase: SupabaseInstance): InquiriesService {
  return {
    async getById(id: string): Promise<ServiceResult<Inquiry>> {
      const { data, error } = await supabase.from("inquiries").select("*").eq("id", id).single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Inquiry, error: null };
    },

    async list(options: InquiryListOptions = {}): Promise<ServiceResult<Inquiry[]>> {
      const { page = 1, limit = 50, column = "created_at", ascending = false, status } = options;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("inquiries")
        .select("*")
        .order(column, { ascending })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Inquiry[], error: null };
    },

    async listByUserId(
      userId: string,
      options: InquiryListOptions = {}
    ): Promise<ServiceResult<Inquiry[]>> {
      const { page = 1, limit = 50, column = "created_at", ascending = false } = options;
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .eq("user_id", userId)
        .order(column, { ascending })
        .range(offset, offset + limit - 1);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Inquiry[], error: null };
    },

    async listByDiagnosisSession(
      sessionId: string,
      options: InquiryListOptions = {}
    ): Promise<ServiceResult<Inquiry[]>> {
      const { page = 1, limit = 50, column = "created_at", ascending = false } = options;
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .eq("diagnosis_session_id", sessionId)
        .order(column, { ascending })
        .range(offset, offset + limit - 1);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: data as Inquiry[], error: null };
    },

    async create(data: CreateInquiryDTO): Promise<ServiceResult<Inquiry>> {
      const { data: result, error } = await supabase
        .from("inquiries")
        .insert(data)
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Inquiry, error: null };
    },

    async update(id: string, data: Partial<Inquiry>): Promise<ServiceResult<Inquiry>> {
      const { data: result, error } = await supabase
        .from("inquiries")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Inquiry, error: null };
    },

    async respond(id: string, response: string): Promise<ServiceResult<Inquiry>> {
      const { data: result, error } = await supabase
        .from("inquiries")
        .update({ response, status: "responded" })
        .eq("id", id)
        .select()
        .single();

      if (error) return { data: null, error: toServiceError(error) };
      return { data: result as Inquiry, error: null };
    },

    async delete(id: string): Promise<ServiceResult<void>> {
      const { error } = await supabase.from("inquiries").delete().eq("id", id);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async deleteByUserId(userId: string): Promise<ServiceResult<void>> {
      const { error } = await supabase.from("inquiries").delete().eq("user_id", userId);

      if (error) return { data: null, error: toServiceError(error) };
      return { data: undefined, error: null };
    },

    async count(userId?: string): Promise<ServiceResult<number>> {
      let query = supabase.from("inquiries").select("*", { count: "exact", head: true });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { count, error } = await query;

      if (error) return { data: null, error: toServiceError(error) };
      return { data: count ?? 0, error: null };
    },
  };
}
