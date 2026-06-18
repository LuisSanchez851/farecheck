import React, { useState } from 'react';
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
import { auth } from '../../services/firebase';
import { authClient, ApiError } from '../../services/api.client';
import { useAuthStore } from '../../store/auth.store';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import type { RegisterScreenProps } from '../../types/navigation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setConductor } = useAuthStore();

  const emailError = email.length > 0 && !EMAIL_RE.test(email);
  const isNombreValid = nombre.trim().length >= 2;
  const canSubmit = isNombreValid && termsAccepted && !emailError && !loading;

  const handleRegistro = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Sesión expirada', 'Por favor vuelve a iniciar sesión.');
        return;
      }

      const firebase_token = await user.getIdToken();

      const body: Parameters<typeof authClient.registro>[0] = {
        firebase_token,
        nombre: nombre.trim(),
      };
      if (email.trim()) body.email = email.trim().toLowerCase();
      if (telefono.trim()) body.telefono = `+57${telefono.replace(/\D/g, '')}`;

      const response = await authClient.registro(body);
      setConductor(response.data.conductor);
      // AppNavigator reacciona a isAuthenticated=true y navega a AppTabs
    } catch (err) {
      let message = 'Ocurrió un error inesperado. Intenta de nuevo.';
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 409) message = err.message;
      }
      Alert.alert('Error al registrarse', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: 56,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back ─────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: spacing.lg }}
          activeOpacity={0.6}
        >
          <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '500' }}>
            ← Volver
          </Text>
        </TouchableOpacity>

        {/* ── Header ───────────────────────────────────────────── */}
        <Text
          style={{
            fontSize: typography.h1.fontSize,
            fontWeight: typography.h1.fontWeight,
            color: colors.navy,
            marginBottom: spacing.xs,
          }}
        >
          Crear cuenta
        </Text>
        <Text
          style={{
            fontSize: typography.body.fontSize,
            color: colors.textSecondary,
            lineHeight: 22,
            marginBottom: spacing.xxl,
          }}
        >
          Ingresa tus datos para empezar a analizar tus servicios.
        </Text>

        {/* ── Nombre completo ───────────────────────────────────── */}
        <FieldLabel text="Nombre completo" />
        <TextInput
          style={inputStyle(nombre.trim().length > 0 && !isNombreValid)}
          placeholder="Ej. Carlos Rodríguez"
          placeholderTextColor={colors.textMuted}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
        />
        {nombre.trim().length > 0 && !isNombreValid && (
          <FieldError text="Mínimo 2 caracteres" />
        )}

        {/* ── Email ─────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.lg }}>
          <FieldLabelOptional text="Correo electrónico" />
          <TextInput
            style={inputStyle(emailError)}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
          {emailError && <FieldError text="Ingresa un correo válido" />}
        </View>

        {/* ── Teléfono ──────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.lg }}>
          <FieldLabelOptional text="Número de teléfono" />
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
              value={telefono}
              onChangeText={setTelefono}
              returnKeyType="done"
              autoComplete="tel"
            />
          </View>
        </View>

        {/* ── Checkbox términos ─────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => setTermsAccepted((v) => !v)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
            marginTop: spacing.xl,
            marginBottom: spacing.xl,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              borderWidth: 2,
              borderColor: termsAccepted ? colors.primary : colors.border,
              backgroundColor: termsAccepted ? colors.primary : colors.white,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 1,
              flexShrink: 0,
            }}
          >
            {termsAccepted && (
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', lineHeight: 15 }}>
                ✓
              </Text>
            )}
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: typography.body.fontSize,
              color: colors.textSecondary,
              lineHeight: 22,
            }}
          >
            Acepto los{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>términos y condiciones</Text>
            {' '}y la{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>política de privacidad</Text>
            {' '}de FareCheck.
          </Text>
        </TouchableOpacity>

        {/* ── Botón Registrarse ─────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleRegistro}
          disabled={!canSubmit}
          activeOpacity={0.8}
          style={{
            paddingVertical: 14,
            borderRadius: radius.md,
            backgroundColor: colors.primary,
            alignItems: 'center',
            opacity: canSubmit ? 1 : 0.45,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
              Registrarse
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function FieldLabel({ text }: { text: string }) {
  return (
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
      {text}
    </Text>
  );
}

function FieldLabelOptional({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
      <Text
        style={{
          fontSize: typography.label.fontSize,
          fontWeight: typography.label.fontWeight,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {text}
      </Text>
      <Text style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, marginLeft: spacing.xs }}>
        {' '}(opcional)
      </Text>
    </View>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: typography.caption.fontSize, color: colors.red, marginTop: 4 }}>
      {text}
    </Text>
  );
}

function inputStyle(hasError: boolean) {
  return {
    borderWidth: 1.5,
    borderColor: hasError ? colors.red : colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.navy,
  } as const;
}
