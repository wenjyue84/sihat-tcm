/**
 * Doctor Level Store
 * 
 * Manages doctor level configuration and AI model selection
 * for the Sihat TCM application.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/clientLogger";
import { DOCTOR_LEVELS, DoctorLevel } from "@/lib/doctorLevels";
import {
  DoctorLevelStore,
  ADMIN_LEVEL_MAPPING
} from "../interfaces/StoreInterfaces";

export const useDoctorLevelStore = create<DoctorLevelStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    doctorLevel: "physician",
    doctorLevelLoading: true,

    // ============================================================================
    // ACTIONS
    // ============================================================================
    setDoctorLevel: (level) => {
      set({ doctorLevel: level });
      logger.info("DoctorLevelStore", "Doctor level updated", { level });
    },

    setDoctorLevelLoading: (loading) => {
      set({ doctorLevelLoading: loading });
    },

    getModel: () => {
      const { doctorLevel } = get();
      const model = DOCTOR_LEVELS[doctorLevel].model;
      logger.debug("DoctorLevelStore", "Model requested", { doctorLevel, model });
      return model;
    },

    getDoctorInfo: () => {
      const { doctorLevel } = get();
      const info = DOCTOR_LEVELS[doctorLevel];
      logger.debug("DoctorLevelStore", "Doctor info requested", { doctorLevel, info });
      return info;
    },

    initializeDoctorLevel: async () => {
      try {
        set({ doctorLevelLoading: true });
        
        logger.info("DoctorLevelStore", "Initializing doctor level from admin settings");

        const { data, error } = await supabase
          .from("system_prompts")
          .select("config")
          .eq("role", "doctor")
          .single();

        if (error) {
          logger.warn("DoctorLevelStore", "No admin settings found, using default", { error });
          set({ doctorLevel: "physician", doctorLevelLoading: false });
          return;
        }

        if (data?.config?.default_level) {
          const adminLevel = data.config.default_level;
          const mappedLevel = ADMIN_LEVEL_MAPPING[adminLevel];
          
          if (mappedLevel) {
            set({ doctorLevel: mappedLevel });
            logger.info("DoctorLevelStore", "Doctor level loaded from admin settings", {
              adminLevel,
              mappedLevel,
              model: DOCTOR_LEVELS[mappedLevel].model
            });
          } else {
            logger.warn("DoctorLevelStore", "Invalid admin level mapping", { adminLevel });
            set({ doctorLevel: "physician" });
          }
        } else {
          logger.info("DoctorLevelStore", "No default level in admin config, using physician");
          set({ doctorLevel: "physician" });
        }
      } catch (error) {
        logger.error("DoctorLevelStore", "Error initializing doctor level", error);
        set({ doctorLevel: "physician" });
      } finally {
        set({ doctorLevelLoading: false });
      }
    },
  }))
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export const useDoctorLevel = () => {
  const doctorLevel = useDoctorLevelStore((state) => state.doctorLevel);
  const setDoctorLevel = useDoctorLevelStore((state) => state.setDoctorLevel);
  const getModel = useDoctorLevelStore((state) => state.getModel);
  const getDoctorInfo = useDoctorLevelStore((state) => state.getDoctorInfo);
  const isLoadingDefault = useDoctorLevelStore((state) => state.doctorLevelLoading);

  return {
    doctorLevel,
    setDoctorLevel,
    getModel,
    getDoctorInfo,
    isLoadingDefault,
    isLoading: isLoadingDefault,
  };
};

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

/**
 * Hook for getting current AI model
 */
export const useCurrentModel = () => {
  return useDoctorLevelStore((state) => {
    const level = state.doctorLevel;
    return DOCTOR_LEVELS[level].model;
  });
};

/**
 * Hook for getting doctor capabilities
 */
export const useDoctorCapabilities = () => {
  return useDoctorLevelStore((state) => {
    const level = state.doctorLevel;
    const info = DOCTOR_LEVELS[level];
    
    return {
      level,
      name: info.name,
      model: info.model,
      capabilities: info.capabilities || [],
      description: info.description || "",
      maxTokens: info.maxTokens || 8192,
      temperature: info.temperature || 0.7,
    };
  });
};

/**
 * Hook for checking if current level supports a capability
 */
export const useHasCapability = (capability: string) => {
  return useDoctorLevelStore((state) => {
    const level = state.doctorLevel;
    const info = DOCTOR_LEVELS[level];
    return info.capabilities?.includes(capability) || false;
  });
};

/**
 * Hook for getting available doctor levels
 */
export const useAvailableDoctorLevels = () => {
  const currentLevel = useDoctorLevelStore((state) => state.doctorLevel);
  
  const levels = Object.entries(DOCTOR_LEVELS).map(([key, info]) => ({
    key: key as DoctorLevel,
    name: info.name,
    model: info.model,
    description: info.description || "",
    isCurrent: key === currentLevel,
  }));

  return {
    levels,
    currentLevel,
    count: levels.length,
  };
};