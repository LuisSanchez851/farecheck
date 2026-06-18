import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';
import { colors } from '../constants/colors';

import OnboardingScreen   from '../screens/onboarding/OnboardingScreen';
import LoginScreen        from '../screens/auth/LoginScreen';
import RegisterScreen     from '../screens/auth/RegisterScreen';
import OTPScreen          from '../screens/auth/OTPScreen';
import HomeScreen         from '../screens/home/HomeScreen';
import TurnoActivoScreen  from '../screens/home/TurnoActivoScreen';
import ResumenTurnoScreen from '../screens/home/ResumenTurnoScreen';
import DetalleViajeScreen from '../screens/home/DetalleViajeScreen';
import BalanceScreen      from '../screens/balance/BalanceScreen';
import ProfileScreen      from '../screens/profile/ProfileScreen';
import ConfigUmbralesScreen  from '../screens/profile/ConfigUmbralesScreen';
import DatosPersonalesScreen from '../screens/profile/DatosPersonalesScreen';

import type {
  AuthStackParamList,
  HomeStackParamList,
  BalanceStackParamList,
  ProfileStackParamList,
  AppTabsParamList,
} from '../types/navigation';

const AuthStack    = createNativeStackNavigator<AuthStackParamList>();
const HomeStack    = createNativeStackNavigator<HomeStackParamList>();
const BalanceStack = createNativeStackNavigator<BalanceStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const AppTabs      = createBottomTabNavigator<AppTabsParamList>();

// ── Sub-stacks ────────────────────────────────────────────────────────────────

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home"         component={HomeScreen} />
      <HomeStack.Screen name="TurnoActivo"  component={TurnoActivoScreen} />
      <HomeStack.Screen name="ResumenTurno" component={ResumenTurnoScreen} />
      <HomeStack.Screen name="DetalleViaje" component={DetalleViajeScreen} />
    </HomeStack.Navigator>
  );
}

function BalanceStackNavigator() {
  return (
    <BalanceStack.Navigator screenOptions={{ headerShown: false }}>
      <BalanceStack.Screen name="Balance" component={BalanceScreen} />
    </BalanceStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile"         component={ProfileScreen} />
      <ProfileStack.Screen name="ConfigUmbrales"  component={ConfigUmbralesScreen} />
      <ProfileStack.Screen name="DatosPersonales" component={DatosPersonalesScreen} />
      {/* S4-07: Contactos */}
    </ProfileStack.Navigator>
  );
}

// ── App Tabs ──────────────────────────────────────────────────────────────────

function AppTabsNavigator() {
  return (
    <AppTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor:  colors.border,
          borderTopWidth:  0.5,
          paddingBottom:   4,
          height:          56,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            HomeTab:    { active: 'home',      inactive: 'home-outline' },
            BalanceTab: { active: 'stats-chart', inactive: 'stats-chart-outline' },
            ProfileTab: { active: 'person',    inactive: 'person-outline' },
          };
          const icon = icons[route.name];
          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <AppTabs.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <AppTabs.Screen
        name="BalanceTab"
        component={BalanceStackNavigator}
        options={{ tabBarLabel: 'Balance' }}
      />
      <AppTabs.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </AppTabs.Navigator>
  );
}

// ── Auth Stack ────────────────────────────────────────────────────────────────

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OTP"      component={OTPScreen} />
    </AuthStack.Navigator>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function RootNavigator() {
  // TEMPORAL: bypass auth para desarrollo
  // En producción, descomenta la lógica de auth de abajo
  return <AppTabsNavigator />;

  // const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  // if (!onboardingComplete) return <OnboardingScreen />;
  // return isAuthenticated ? <AppTabsNavigator /> : <AuthStackNavigator />;
}
