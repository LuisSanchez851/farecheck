import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // true cuando el usuario ya vio el onboarding (persistido en AsyncStorage)
  onboardingComplete: boolean;
  // true cuando persist terminó de rehidratar — evita parpadeo del onboarding
  // en usuarios que ya lo vieron
  hasHydrated: boolean;

  setOnboardingComplete: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      hasHydrated: false,

      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: '@farecheck_app',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistimos la bandera de onboarding — hasHydrated es de runtime
      partialize: (state) => ({ onboardingComplete: state.onboardingComplete }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
