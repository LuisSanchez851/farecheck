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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AntDesign } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { signInWithGoogle } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

// Necesario para que expo-auth-session cierre el browser al volver a la app
WebBrowser.maybeCompleteAuthSession();

// Tipado mínimo — se expande cuando se conecte react-navigation en S1-06
interface LoginNavigation {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}

export default function LoginScreen({ navigation }: { navigation: LoginNavigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { setUser, setLoading, isLoading } = useAuthStore();

  // ── Google Sign-In DESACTIVADO — solo teléfono por ahora ──────────────────────
  // Para reactivarlo: descomentar el hook, el useEffect y handleGoogleSignIn,
  // y restaurar el botón "Continuar con Google" en el JSX.
  // const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  //   androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  //   iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  // });
  //
  // useEffect(() => {
  //   if (response?.type !== 'success') {
  //     if (response?.type === 'error' || response?.type === 'dismiss') {
  //       setLoading(false);
  //     }
  //     return;
  //   }
  //   const idToken = response.params.id_token;
  //   if (!idToken) {
  //     setLoading(false);
  //     Alert.alert('Error', 'No se recibió el token de Google. Intenta de nuevo.');
  //     return;
  //   }
  //   signInWithGoogle(idToken)
  //     .then((user) => setUser(user))
  //     .catch(() => {
  //       setLoading(false);
  //       Alert.alert('Error de autenticación', 'No se pudo verificar tu cuenta de Google.');
  //     });
  // }, [response]);
  //
  // const handleGoogleSignIn = async () => {
  //   setLoading(true);
  //   promptAsync();
  // };

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

        {/* Botón Google y divisor removidos — login solo por teléfono */}

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
