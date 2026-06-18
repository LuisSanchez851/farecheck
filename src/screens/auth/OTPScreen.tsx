import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { signInWithPhone, verifyOTP } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import type { OTPScreenProps } from '../../types/navigation';

// Phone auth con @react-native-firebase: el SMS se envía SIN reCAPTCHA (verificación
// nativa). El flujo: signInWithPhone → ConfirmationResult (en el store) → confirm(code).
// Tras verificar, AppNavigator (onAuthStateChanged) detecta la sesión: si el conductor
// ya existe va a AppTabs; si es nuevo, marca needsRegistration y aquí navegamos a Register.

export default function OTPScreen({ route, navigation }: OTPScreenProps) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const { pendingConfirmation, setPendingConfirmation } = useAuthStore();

  const enviarCodigo = async () => {
    setEnviando(true);
    try {
      const confirmation = await signInWithPhone(phoneNumber);
      setPendingConfirmation(confirmation);
      setCodigoEnviado(true);
    } catch (e) {
      // Surface el error real de Firebase para diagnóstico (code + message):
      // p.ej. auth/invalid-phone-number, auth/app-not-authorized (falta SHA-1),
      // auth/missing-client-identifier, o "native module" si se corre en Expo Go.
      const err = e as { code?: string; message?: string };
      console.warn('[OTP] signInWithPhone falló →', err?.code, err?.message);
      Alert.alert(
        'No se pudo enviar el código',
        err?.code ? `${err.code}\n${err.message ?? ''}` : 'Verifica el número e inténtalo de nuevo.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const verificarCodigo = async () => {
    if (!pendingConfirmation || code.length !== 6) return;
    setVerificando(true);
    try {
      await verifyOTP(pendingConfirmation, code);
      setPendingConfirmation(null);
      // Usuario nuevo → RegisterScreen. Usuario existente → AppNavigator cambia a AppTabs.
      navigation.navigate('Register');
    } catch {
      Alert.alert('Código incorrecto', 'El código ingresado no es válido. Inténtalo de nuevo.');
    } finally {
      setVerificando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.6}>
            <Text style={styles.backTexto}>← Cambiar número</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>Verifica tu teléfono</Text>
          <Text style={styles.subtitulo}>
            {codigoEnviado ? 'Ingresa el código de 6 dígitos enviado a' : 'Te enviaremos un código por SMS a'}
          </Text>
          <Text style={styles.numero}>{phoneNumber}</Text>

          {!codigoEnviado ? (
            <TouchableOpacity
              style={[styles.boton, { opacity: enviando ? 0.6 : 1 }]}
              onPress={enviarCodigo}
              disabled={enviando}
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.botonTexto}>Enviar código OTP</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TextInput
                style={styles.codigoInput}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                autoFocus
                textContentType="oneTimeCode"
              />
              <TouchableOpacity
                style={[styles.boton, { opacity: code.length === 6 && !verificando ? 1 : 0.45 }]}
                onPress={verificarCodigo}
                disabled={code.length !== 6 || verificando}
                activeOpacity={0.85}
              >
                {verificando ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.botonTexto}>Verificar código</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={enviarCodigo}
                disabled={enviando}
                style={styles.reenviar}
                activeOpacity={0.6}
              >
                <Text style={styles.reenviarTexto}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 64 },

  back: { marginBottom: spacing.xl },
  backTexto: { fontSize: 15, color: colors.primary, fontWeight: '500' },

  titulo: { fontSize: typography.h1.fontSize, fontWeight: typography.h1.fontWeight, color: colors.navy, marginBottom: spacing.sm },
  subtitulo: { fontSize: typography.body.fontSize, color: colors.textSecondary, lineHeight: 22 },
  numero: { fontSize: typography.h2.fontSize, fontWeight: '700', color: colors.primary, marginTop: spacing.xs, marginBottom: spacing.xl },

  boton: { paddingVertical: 16, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', marginTop: spacing.sm },
  botonTexto: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },

  reenviar: { marginTop: spacing.lg, alignItems: 'center' },
  reenviarTexto: { fontSize: typography.body.fontSize, color: colors.primary, fontWeight: '500' },

  codigoInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 12,
    color: colors.navy,
    marginBottom: spacing.lg,
  },
});
