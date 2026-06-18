import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  ConfirmationResult,
  ApplicationVerifier,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Intercambia el idToken de Google (obtenido con expo-auth-session)
 * por una sesión Firebase. Llamar desde el componente que maneja
 * el hook useIdTokenAuthRequest.
 */
export async function signInWithGoogle(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credential);
  return user;
}

/**
 * Inicia el flujo de autenticación por teléfono.
 * @param phoneNumber - Formato E.164: '+573001234567'
 * @param appVerifier - RecaptchaVerifier obtenido en el componente de login.
 *                      En Sprint 3 (bare workflow) esto será manejado
 *                      automáticamente por @react-native-firebase sin reCAPTCHA.
 * @returns ConfirmationResult — guardar en auth.store para el paso verifyOTP
 */
export async function signInWithPhone(
  phoneNumber: string,
  appVerifier: ApplicationVerifier,
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

/**
 * Confirma el código OTP recibido por SMS.
 * @param confirmationResult - El resultado guardado de signInWithPhone
 * @param code - Código de 6 dígitos que ingresó el usuario
 */
export async function verifyOTP(
  confirmationResult: ConfirmationResult,
  code: string,
): Promise<User> {
  const result = await confirmationResult.confirm(code);
  if (!result?.user) throw new Error('Verificación OTP fallida');
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Suscribe al estado de autenticación de Firebase.
 * Llamar en el componente raíz (App.tsx) para mantener el store sincronizado.
 * @returns Función para desuscribirse (llamar en cleanup del useEffect)
 */
export function subscribeToAuthChanges(
  onUserChange: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, onUserChange);
}

/**
 * Obtiene el idToken JWT del usuario actual para enviarlo al backend.
 * El token expira cada hora — Firebase lo refresca automáticamente.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
