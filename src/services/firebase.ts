import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

// @react-native-firebase se inicializa de forma NATIVA desde google-services.json
// (Android) / GoogleService-Info.plist (iOS) durante el build — no requiere
// initializeApp(config) como el Firebase JS SDK web. Permite phone auth (SMS) sin
// reCAPTCHA. La config web JS (EXPO_PUBLIC_FIREBASE_*) ya no se usa aquí.
export const auth = getAuth(getApp());
export default getApp();
