/**
 * TCM Practitioners Service
 *
 * Encapsulates all Supabase operations for tcm_practitioners table.
 */

import type { ServiceResult, SupabaseInstance, PaginationOptions, SortOptions } from "./types";
import { toServiceError } from "./types";

export interface TCMPractitioner {
    id: string;
    name: string;
    photo: string;
    clinic_name: string;
    specialties: string[];
    address: string;
    phone: string;
    experience: string;
    waze_link?: string;
    working_hours: string;
    notes?: string;
    // Original service fields kept as optional just in case, but marked for review
    specialty?: string | null;
    credentials?: string | null;
    location?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    photo_url?: string | null;
    is_verified?: boolean | null;
    created_at?: string;
    updated_at?: string;
}

export interface CreatePractitionerDTO {
    name: string;
    specialty?: string;
    credentials?: string;
    location?: string;
    phone?: string;
    email?: string;
    website?: string;
    bio?: string;
    photo_url?: string;
    is_verified?: boolean;
}

export interface PractitionerListOptions extends PaginationOptions, Partial<SortOptions> {
    specialty?: string;
    isVerified?: boolean;
    location?: string;
}

export interface PractitionersService {
    getById(id: string): Promise<ServiceResult<TCMPractitioner>>;
    list(options?: PractitionerListOptions): Promise<ServiceResult<TCMPractitioner[]>>;
    search(query: string, options?: PractitionerListOptions): Promise<ServiceResult<TCMPractitioner[]>>;
    create(data: CreatePractitionerDTO): Promise<ServiceResult<TCMPractitioner>>;
    createMany(data: CreatePractitionerDTO[]): Promise<ServiceResult<TCMPractitioner[]>>;
    update(id: string, data: Partial<TCMPractitioner>): Promise<ServiceResult<TCMPractitioner>>;
    verify(id: string): Promise<ServiceResult<void>>;
    delete(id: string): Promise<ServiceResult<void>>;
    count(options?: { isVerified?: boolean }): Promise<ServiceResult<number>>;
}

export function createPractitionersService(supabase: SupabaseInstance): PractitionersService {
    return {
        async getById(id: string): Promise<ServiceResult<TCMPractitioner>> {
            const { data, error } = await supabase
                .from("tcm_practitioners")
                .select("*")
                .eq("id", id)
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as TCMPractitioner, error: null };
        },

        async list(options: PractitionerListOptions = {}): Promise<ServiceResult<TCMPractitioner[]>> {
            const { page = 1, limit = 50, column = "name", ascending = true, specialty, isVerified, location } = options;
            const offset = (page - 1) * limit;

            let query = supabase
                .from("tcm_practitioners")
                .select("*")
                .order(column, { ascending })
                .range(offset, offset + limit - 1);

            if (specialty) {
                query = query.eq("specialty", specialty);
            }

            if (isVerified !== undefined) {
                query = query.eq("is_verified", isVerified);
            }

            if (location) {
                query = query.ilike("location", `%${location}%`);
            }

            const { data, error } = await query;

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as TCMPractitioner[], error: null };
        },

        async search(query: string, options: PractitionerListOptions = {}): Promise<ServiceResult<TCMPractitioner[]>> {
            const { page = 1, limit = 50, column = "name", ascending = true } = options;
            const offset = (page - 1) * limit;

            const { data, error } = await supabase
                .from("tcm_practitioners")
                .select("*")
                .or(`name.ilike.%${query}%,specialty.ilike.%${query}%,location.ilike.%${query}%`)
                .order(column, { ascending })
                .range(offset, offset + limit - 1);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: data as TCMPractitioner[], error: null };
        },

        async create(data: CreatePractitionerDTO): Promise<ServiceResult<TCMPractitioner>> {
            const { data: result, error } = await supabase
                .from("tcm_practitioners")
                .insert(data)
                .select()
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: result as TCMPractitioner, error: null };
        },

        async createMany(data: CreatePractitionerDTO[]): Promise<ServiceResult<TCMPractitioner[]>> {
            const { data: result, error } = await supabase
                .from("tcm_practitioners")
                .insert(data)
                .select();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: result as TCMPractitioner[], error: null };
        },

        async update(id: string, data: Partial<TCMPractitioner>): Promise<ServiceResult<TCMPractitioner>> {
            const { data: result, error } = await supabase
                .from("tcm_practitioners")
                .update(data)
                .eq("id", id)
                .select()
                .single();

            if (error) return { data: null, error: toServiceError(error) };
            return { data: result as TCMPractitioner, error: null };
        },

        async verify(id: string): Promise<ServiceResult<void>> {
            const { error } = await supabase
                .from("tcm_practitioners")
                .update({ is_verified: true })
                .eq("id", id);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: undefined, error: null };
        },

        async delete(id: string): Promise<ServiceResult<void>> {
            const { error } = await supabase
                .from("tcm_practitioners")
                .delete()
                .eq("id", id);

            if (error) return { data: null, error: toServiceError(error) };
            return { data: undefined, error: null };
        },

        async count(options: { isVerified?: boolean } = {}): Promise<ServiceResult<number>> {
            let query = supabase.from("tcm_practitioners").select("*", { count: "exact", head: true });

            if (options.isVerified !== undefined) {
                query = query.eq("is_verified", options.isVerified);
            }

            const { count, error } = await query;

            if (error) return { data: null, error: toServiceError(error) };
            return { data: count ?? 0, error: null };
        },
    };
}
