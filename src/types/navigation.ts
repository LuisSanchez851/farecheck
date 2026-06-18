import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ── Auth Stack ────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
  OTP:      { phoneNumber: string };
};

// ── Home Stack ────────────────────────────────────────────────────────────────
export type HomeStackParamList = {
  Home:         undefined;
  TurnoActivo:  undefined;
  DetalleViaje: { id: string };
  ResumenTurno: { turnoId: string };
};

// ── Balance Stack ─────────────────────────────────────────────────────────────
export type BalanceStackParamList = {
  Balance: undefined;
};

// ── Profile Stack ─────────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  Profile:         undefined;
  ConfigUmbrales:  undefined;
  DatosPersonales: undefined;
  Contactos:       undefined;
};

// ── Bottom Tabs ───────────────────────────────────────────────────────────────
export type AppTabsParamList = {
  HomeTab:    undefined;
  BalanceTab: undefined;
  ProfileTab: undefined;
};

// ── Screen props helpers ──────────────────────────────────────────────────────
export type LoginScreenProps    = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type OTPScreenProps      = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

export type HomeScreenProps        = NativeStackScreenProps<HomeStackParamList, 'Home'>;
export type TurnoActivoScreenProps = NativeStackScreenProps<HomeStackParamList, 'TurnoActivo'>;
export type ResumenTurnoScreenProps = NativeStackScreenProps<HomeStackParamList, 'ResumenTurno'>;
export type DetalleViajeScreenProps = NativeStackScreenProps<HomeStackParamList, 'DetalleViaje'>;
export type BalanceScreenProps = NativeStackScreenProps<BalanceStackParamList, 'Balance'>;
export type ProfileScreenProps         = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;
export type ConfigUmbralesScreenProps  = NativeStackScreenProps<ProfileStackParamList, 'ConfigUmbrales'>;
export type DatosPersonalesScreenProps = NativeStackScreenProps<ProfileStackParamList, 'DatosPersonales'>;
