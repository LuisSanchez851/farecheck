import { create } from 'zustand';
import type { User, ConfirmationResult } from 'firebase/auth';
import type { Conductor, Suscripcion } from '../types/api.types';

interface AuthState {
  user: User | null;                    // Usuario Firebase (local)
  conductor: Conductor | null;          // Datos del conductor en el backend
  suscripcion: Suscripcion | null;      // Estado de la suscripción
  isLoading: boolean;
  isAuthenticated: boolean;             // true solo cuando backend confirma el conductor
  subscriptionExpired: boolean;         // true cuando el backend responde 402
  pendingConfirmation: ConfirmationResult | null;

  setUser: (user: User | null) => void;
  setConductor: (conductor: Conductor | null) => void;
  setSuscripcion: (suscripcion: Suscripcion | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingConfirmation: (result: ConfirmationResult | null) => void;
  setSubscriptionExpired: (expired: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  conductor: null,
  suscripcion: null,
  isLoading: false,
  isAuthenticated: false,
  subscriptionExpired: false,
  pendingConfirmation: null,

  // Solo guarda el usuario Firebase — no cambia isAuthenticated
  // La navegación a AppTabs ocurre cuando el backend confirma el conductor
  setUser: (user) => set({ user }),

  // Confirma la identidad en el backend → activa la navegación a AppTabs
  setConductor: (conductor) =>
    set({ conductor, isAuthenticated: conductor !== null, isLoading: false }),

  setSuscripcion: (suscripcion) => set({ suscripcion }),

  setLoading: (isLoading) => set({ isLoading }),

  setPendingConfirmation: (pendingConfirmation) => set({ pendingConfirmation }),

  setSubscriptionExpired: (subscriptionExpired) => set({ subscriptionExpired }),

  reset: () =>
    set({
      user: null,
      conductor: null,
      suscripcion: null,
      isAuthenticated: false,
      isLoading: false,
      subscriptionExpired: false,
      pendingConfirmation: null,
    }),
}));
