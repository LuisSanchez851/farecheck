import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { auth } from './firebase';

/**
 * Intercambia el idToken de Google (obtenido con expo-auth-session) por una sesión
 * Firebase nativa (@react-native-firebase).
 */
export async function signInWithGoogle(idToken: string): Promise<FirebaseAuthTypes.User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credential);
  return user;
}

/**
 * Inicia el flujo de autenticación por teléfono. Con @react-native-firebase el SMS se
 * envía SIN reCAPTCHA (verificación nativa de la app vía Play Integrity / APNs).
 * @param phoneNumber Formato E.164: '+573001234567'
 * @returns ConfirmationResult — guardar en auth.store para el paso verifyOTP.
 */
export async function signInWithPhone(
  phoneNumber: string,
): Promise<FirebaseAuthTypes.ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber);
}

/** Confirma el código OTP recibido por SMS. */
export async function verifyOTP(
  confirmationResult: FirebaseAuthTypes.ConfirmationResult,
  code: string,
): Promise<FirebaseAuthTypes.User> {
  const result = await confirmationResult.confirm(code);
  if (!result?.user) throw new Error('Verificación OTP fallida');
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Suscribe al estado de autenticación de Firebase. Llamar en el componente raíz
 * (AppNavigator) para mantener el store sincronizado.
 * @returns Función para desuscribirse.
 */
export function subscribeToAuthChanges(
  onUserChange: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return onAuthStateChanged(auth, onUserChange);
}

/** Obtiene el idToken JWT del usuario actual para enviarlo al backend. */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
