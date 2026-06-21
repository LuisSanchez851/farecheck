import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { signInWithGoogle } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

// Tipado mínimo — se expande cuando se conecte react-navigation en S1-06
interface LoginNavigation {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}

export default function LoginScreen({ navigation }: { navigation: LoginNavigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { setLoading, isLoading } = useAuthStore();
  const needsRegistration = useAuthStore((s) => s.needsRegistration);

  // ── Google Sign-In (nativo) ─────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // En éxito, onAuthStateChanged (AppNavigator) decide AppTabs o RegisterScreen
      // y desmonta esta pantalla; no reseteamos isLoading aquí (igual que antes).
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setLoading(false);
      if (err?.message === 'google-sign-in-cancelled') return; // sin alerta
      // Loguea el code/message exacto (p.ej. DEVELOPER_ERROR si webClientId/SHA no
      // coinciden, o auth/account-exists-with-different-credential de Firebase).
      if (__DEV__) console.warn('[Login] signInWithGoogle (nativo) falló →', err?.code, err?.message);
      Alert.alert(
        'Error de autenticación',
        err?.code ? `${err.code}\n${err.message ?? ''}` : 'No se pudo verificar tu cuenta de Google.',
      );
    }
  };

  // Usuario autenticado en Firebase pero sin conductor en BD → a registrarse.
  useEffect(() => {
    if (needsRegistration) navigation.navigate('Register');
  }, [needsRegistration, navigation]);

  const handlePhoneContinue = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      Alert.alert('Número inválido', 'Ingresa exactamente 10 dígitos después del +57.');
      return;
    }
    navigation.navigate('OTP', { phoneNumber: `+57${digits}` });
  };

  const isPhoneValid = phoneNumber.replace(/\D/g, '').length === 10;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: 64,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: radius.full,
              backgroundColor: colors.navy,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            {/* Reemplazar con <Image source={require('../../../assets/logo.png')} /> en S1-09 */}
            <Text style={{ color: colors.primary, fontSize: 26, fontWeight: '700' }}>FC</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.navy, letterSpacing: 0.3 }}>
            FareCheck
          </Text>
        </View>

        {/* ── Heading ──────────────────────────────────────────── */}
        <Text
          style={{
            fontSize: typography.h1.fontSize,
            fontWeight: typography.h1.fontWeight,
            color: colors.navy,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
        >
          ¡Bienvenido a FareCheck!
        </Text>
        <Text
          style={{
            fontSize: typography.body.fontSize,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: spacing.xxl + spacing.sm,
          }}
        >
          La inteligencia para tus servicios de transporte.
        </Text>

        {/* ── Botón Google ─────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: 14,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.white,
            marginBottom: spacing.lg,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <AntDesign name="google" size={18} color={colors.navy} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.navy }}>
            Continuar con Google
          </Text>
        </TouchableOpacity>

        {/* ── Divisor ──────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ marginHorizontal: spacing.md, fontSize: typography.caption.fontSize, color: colors.textMuted }}>
            o con tu teléfono
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        {/* ── Campo teléfono ────────────────────────────────────── */}
        <View style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              fontSize: typography.label.fontSize,
              fontWeight: typography.label.fontWeight,
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              marginBottom: spacing.sm,
            }}
          >
            Número de teléfono
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.sm,
              overflow: 'hidden',
            }}
          >
            {/* Prefijo +57 */}
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: 14,
                backgroundColor: colors.background,
                borderRightWidth: 1,
                borderRightColor: colors.border,
                minWidth: 56,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.navy }}>+57</Text>
            </View>

            <TextInput
              style={{
                flex: 1,
                paddingHorizontal: spacing.md,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.navy,
              }}
              placeholder="300 123 4567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={12}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              returnKeyType="done"
              onSubmitEditing={isPhoneValid ? handlePhoneContinue : undefined}
              autoComplete="tel"
            />
          </View>
        </View>

        {/* ── Botón Continuar ──────────────────────────────────── */}
        <TouchableOpacity
          onPress={handlePhoneContinue}
          disabled={!isPhoneValid || isLoading}
          activeOpacity={0.8}
          style={{
            paddingVertical: 14,
            borderRadius: radius.md,
            backgroundColor: colors.primary,
            alignItems: 'center',
            marginBottom: spacing.lg,
            opacity: !isPhoneValid || isLoading ? 0.45 : 1,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
            Continuar
          </Text>
        </TouchableOpacity>

        {/* ── Links ────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing.xxl,
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Recuperar acceso',
                'Usa "Continuar con teléfono" para acceder con tu número registrado.',
              )
            }
          >
            <Text style={{ fontSize: typography.caption.fontSize, color: colors.textSecondary }}>
              ¿Olvidó su contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text
              style={{
                fontSize: typography.caption.fontSize,
                color: colors.primary,
                fontWeight: '600',
              }}
            >
              Registrarse
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Texto legal ──────────────────────────────────────── */}
        <Text
          style={{
            fontSize: typography.caption.fontSize,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 18,
          }}
        >
          Al continuar aceptas los{' '}
          <Text style={{ color: colors.primary }}>términos y condiciones</Text>
          {' '}y la{' '}
          <Text style={{ color: colors.primary }}>política de privacidad</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
