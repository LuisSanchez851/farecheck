import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { auth } from './firebase';

// Configura el SDK nativo de Google una sola vez al importar el módulo.
// webClientId = OAuth client tipo "Web application" (EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID).
// El client Android lo resuelve el SDK nativo desde google-services.json — ya NO se
// usa EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID en JS.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID;

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
});

/**
 * Inicia sesión con Google usando el SDK nativo (@react-native-google-signin) y
 * canjea el idToken por una sesión Firebase nativa. Sin navegador ni custom URI scheme.
 */
export async function signInWithGoogle(): Promise<FirebaseAuthTypes.User> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    throw new Error('google-sign-in-cancelled'); // el usuario cerró el diálogo
  }
  const idToken = response.data.idToken;
  if (!idToken) throw new Error('No se recibió idToken de Google.');
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
