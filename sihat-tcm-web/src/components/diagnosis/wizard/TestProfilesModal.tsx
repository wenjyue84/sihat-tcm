"use client";

import { MOCK_PROFILES } from "@/data/mockProfiles";

interface MockProfile {
  id: string;
  name: string;
  description: string;
  data: Record<string, unknown>;
}

interface TestProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profileData: Record<string, unknown>) => void;
}

/**
 * Test Profiles Modal - Modal for selecting pre-filled test data profiles
 *
 * Features:
 * - Displays available mock profiles
 * - Each profile has name and description
 * - Selecting a profile populates the diagnosis form with test data
 */
export function TestProfilesModal({ isOpen, onClose, onSelectProfile }: TestProfilesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Select Test Profile</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {MOCK_PROFILES.map((profile: MockProfile) => (
            <button
              key={profile.id}
              onClick={() => {
                onSelectProfile(profile.data);
                onClose();
              }}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 group-hover:text-emerald-700">
                  {profile.name}
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  Full Data
                </span>
              </div>
              <p className="text-xs text-slate-500">{profile.description}</p>
            </button>
          ))}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
          Selecting a profile will overwrite current diagnosis data.
        </div>
      </div>
    </div>
  );
}
