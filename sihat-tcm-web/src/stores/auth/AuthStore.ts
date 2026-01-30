/**
 * Auth Store
 * 
 * Manages authentication state, user sessions, and profile data
 * for the Sihat TCM application.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/clientLogger";
import {
  AuthStore,
  Profile,
  UIPreferences,
  STORAGE_KEYS
} from "../interfaces/StoreInterfaces";

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    user: null,
    session: null,
    profile: null,
    authLoading: true,

    // ============================================================================
    // ACTIONS
    // ============================================================================
    setUser: (user) => set({ user }),
    
    setSession: (session) => set({ session }),
    
    setProfile: (profile) => set({ profile }),
    
    setAuthLoading: (loading) => set({ authLoading: loading }),

    signOut: async () => {
      try {
        await supabase.auth.signOut();
        set({ profile: null, user: null, session: null });
        logger.info("AuthStore", "User signed out successfully");
      } catch (error) {
        logger.error("AuthStore", "Error signing out", error);
        throw error;
      }
    },

    refreshProfile: async (userId?: string, initialData?: Profile) => {
      if (initialData) {
        set({ profile: initialData });
        return;
      }

      const { user } = get();
      const idToFetch = userId || user?.id;
      if (!idToFetch) {
        logger.warn("AuthStore", "No user ID provided for profile refresh");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", idToFetch)
          .single();

        if (error) {
          logger.error("AuthStore", "Error fetching profile", error);
          return;
        }

        set({ profile: data });

        // Sync language from localStorage if not in profile
        if (!data.preferred_language && typeof window !== "undefined") {
          const localLanguage = localStorage.getItem(STORAGE_KEYS.language);
          if (localLanguage && ["en", "zh", "ms"].includes(localLanguage)) {
            await get().updatePreferences({ language: localLanguage as any });
          }
        }

        logger.info("AuthStore", "Profile refreshed successfully");
      } catch (error) {
        logger.error("AuthStore", "Unexpected error fetching profile", error);
      } finally {
        set({ authLoading: false });
      }
    },

    updatePreferences: async (newPrefs: Partial<UIPreferences>) => {
      const { user, profile } = get();
      if (!user) {
        logger.warn("AuthStore", "Cannot update preferences: no user logged in");
        return;
      }

      try {
        const currentPrefs = profile?.preferences || {};
        const updatedPrefs = { ...currentPrefs, ...newPrefs };

        const updateData: any = {
          preferences: updatedPrefs,
        };

        // Update preferred_language if language is being changed
        if (newPrefs.language) {
          updateData.preferred_language = newPrefs.language;
        }

        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);

        if (error) {
          logger.error("AuthStore", "Error updating preferences", error);
          return;
        }

        // Update local state
        set({
          profile: profile
            ? {
                ...profile,
                preferences: updatedPrefs,
                ...(newPrefs.language ? { preferred_language: newPrefs.language } : {}),
              }
            : null,
        });

        logger.info("AuthStore", "Preferences updated successfully", { newPrefs });
      } catch (err) {
        logger.error("AuthStore", "Unexpected error updating preferences", err);
      }
    },

    initializeAuth: () => {
      // Get initial session
      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) {
            logger.error("AuthStore", "Error getting initial session", error);
            set({ authLoading: false });
            return;
          }

          const session = data?.session;
          set({ session, user: session?.user ?? null });

          if (session?.user) {
            get().refreshProfile(session.user.id);
          } else {
            set({ authLoading: false });
          }
        })
        .catch((err) => {
          logger.error("AuthStore", "Unexpected error getting initial session", err);
          set({ authLoading: false });
        });

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        logger.info("AuthStore", "Auth state changed", { event, userId: session?.user?.id });
        
        set({ session, user: session?.user ?? null });
        
        if (session?.user) {
          set({ authLoading: true });
          get().refreshProfile(session.user.id);
        } else {
          set({ profile: null, authLoading: false });
        }
      });

      // Return cleanup function
      return () => {
        subscription.unsubscribe();
        logger.info("AuthStore", "Auth subscription cleaned up");
      };
    },
  }))
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.authLoading);
  const signOut = useAuthStore((state) => state.signOut);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile,
    updatePreferences,
    isAuthenticated: !!user,
    isLoading: loading,
  };
};

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

export const useUserRole = () => {
  return useAuthStore((state) => state.profile?.role || null);
};

export const useIsAdmin = () => {
  return useAuthStore((state) => state.profile?.role === "admin");
};

export const useIsDoctor = () => {
  return useAuthStore((state) => state.profile?.role === "doctor");
};

export const useIsPatient = () => {
  return useAuthStore((state) => state.profile?.role === "patient");
};

export const useIsDeveloper = () => {
  return useAuthStore((state) => state.profile?.role === "developer");
};