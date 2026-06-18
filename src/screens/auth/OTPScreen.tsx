import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import type { OTPScreenProps } from '../../types/navigation';

// NOTA: Phone auth migrado a @react-native-firebase en S3.
// Se removió expo-firebase-recaptcha (verificador reCAPTCHA del Firebase JS SDK)
// porque estaba deprecado desde SDK 48 y rompía los builds nativos (duplicaba
// expo-constants). La pantalla se mantiene como placeholder; el envío y la
// verificación reales de SMS se reconectan con @react-native-firebase (nativo,
// sin reCAPTCHA) en Sprint 3. Lógica de referencia en services/auth.service.ts
// (signInWithPhone / verifyOTP).

const PENDIENTE_S3 = 'El flujo SMS/OTP se migra a @react-native-firebase en S3 (sin reCAPTCHA).';

export default function OTPScreen({ route, navigation }: OTPScreenProps) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const enviarCodigo = () => {
    Alert.alert('Disponible en S3', PENDIENTE_S3);
    setCodigoEnviado(true); // muestra el campo de código para conservar la pantalla completa
  };

  const verificarCodigo = () => {
    // S3 (@react-native-firebase): await confirmation.confirm(code) → navega a Register
    Alert.alert('Disponible en S3', PENDIENTE_S3);
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

          {/* Aviso de estado temporal */}
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>{PENDIENTE_S3}</Text>
          </View>

          {!codigoEnviado ? (
            <TouchableOpacity style={styles.boton} onPress={enviarCodigo} activeOpacity={0.85}>
              <Text style={styles.botonTexto}>Enviar código OTP</Text>
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
                style={[styles.boton, { opacity: code.length === 6 ? 1 : 0.45 }]}
                onPress={verificarCodigo}
                disabled={code.length !== 6}
                activeOpacity={0.85}
              >
                <Text style={styles.botonTexto}>Verificar código</Text>
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

  aviso: {
    backgroundColor: colors.amberBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  avisoTexto: { fontSize: typography.caption.fontSize, color: colors.navy, lineHeight: 18 },

  boton: { paddingVertical: 16, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', marginTop: spacing.sm },
  botonTexto: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },

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
