# Checkpoint técnico — Autenticación Android + Backend Railway

> Estado: **CERRADO Y VALIDADO** (Android). Fecha de checkpoint: 2026-06-21.
> Este documento describe la configuración real en el momento de cerrar el frente de
> autenticación. No es un tutorial genérico: refleja decisiones y valores concretos del
> proyecto (sin secretos).

---

## 1. Stack real actual

| Capa | Tecnología |
|---|---|
| App móvil | Expo (React Native) + TypeScript + `expo-dev-client` (build nativo, **no** Expo Go) |
| Auth cliente | `@react-native-firebase/auth` (SDK nativo) + `@react-native-google-signin/google-signin` |
| Backend | Node.js + Express + Prisma + PostgreSQL |
| Deploy backend | Railway (auto-deploy desde `main`) |
| Auth servidor | Firebase Admin SDK (verifica el `firebase_token` que envía la app) |

**Paquete Android:** `com.farecheck.app` · **Proyecto Firebase:** `farecheck-d7781`

---

## 2. Decisiones tomadas

1. **Google Sign-In nativo** (`@react-native-google-signin`) en lugar de `expo-auth-session`.
2. **Phone Auth** vía `@react-native-firebase` (SMS sin reCAPTCHA, verificación nativa).
3. La lógica de negocio vive en el backend; el cliente solo envía el `firebase_token`.
4. `POST /api/v1/conductor/crear` se monta **antes** del `authMiddleware` (registro del
   conductor nuevo cuando aún no existe en BD); deriva el `uid` del token igualmente.
5. El cliente Android resuelve el OAuth client desde `google-services.json`; en JS solo se
   usa el **Web Client ID** como `webClientId`.

### Por qué se abandonó `expo-auth-session`
- Requería navegador/custom URI scheme y `WebBrowser.maybeCompleteAuthSession()`.
- Flujo más frágil y con peor UX que el diálogo nativo de Google.
- El SDK nativo entrega directamente el `idToken` que se canjea por sesión Firebase con
  `GoogleAuthProvider.credential(idToken)` → `signInWithCredential(auth, credential)`.

---

## 3. Flujo final de autenticación

### Google (validado ✅)
```
LoginScreen.handleGoogleSignIn()
  → GoogleSignin.hasPlayServices()
  → GoogleSignin.signIn()                       // diálogo nativo
  → GoogleAuthProvider.credential(idToken)
  → signInWithCredential(auth, credential)      // sesión Firebase
  → onAuthStateChanged (AppNavigator)
      → POST /api/v1/auth/login { firebase_token }
          ├─ conductor existe        → AppTabs
          └─ conductor_no_encontrado → needsRegistration → RegisterScreen
                                        → POST /api/v1/conductor/crear
```

### Teléfono / OTP (⚠️ pendiente de validación end-to-end)
```
LoginScreen → OTPScreen
  → signInWithPhoneNumber(auth, '+57XXXXXXXXXX')   // SMS sin reCAPTCHA
  → confirmationResult.confirm(code)               // sesión Firebase
  → navega a Register (nuevo) o AppTabs (existente)
```
> El flujo de Phone Auth está implementado pero **no se validó SMS-recibido + login OK** en
> este checkpoint. Requiere SHA registrado + Play Integrity. Ver Riesgos.

### Sesión persistente (validado ✅)
`onAuthStateChanged` rehidrata la sesión Firebase al abrir la app; cerrar y reabrir mantiene
sesión activa sin re-login.

---

## 4. Configuración Firebase requerida

- App Android `com.farecheck.app` registrada en el proyecto `farecheck-d7781`.
- `google-services.json` (móvil) en la raíz del frontend, con el `certificate_hash` del
  keystore que firma el build.
- Proveedores habilitados en Firebase Console: **Google** y **Phone**.
- Web Client ID (`client_type: 3` dentro de `client[].oauth_client`) usado como `webClientId`.

> ⚠️ **No usar** el client de `services.appinvite_service.other_platform_oauth_client`
> (también es `client_type: 3`): apuntar ahí provoca `DEVELOPER_ERROR` (código 10).

---

## 5. SHA requeridos — debug keystore global vs proyecto

Google Sign-In valida la firma del APK contra el `certificate_hash` de `google-services.json`.
Si no coinciden → **`DEVELOPER_ERROR` (código 10)**.

| Keystore | Ruta | Uso |
|---|---|---|
| **Global** | `~/.android/debug.keystore` | Default histórico de Android/Gradle |
| **Proyecto** | `android/app/debug.keystore` | El que Gradle usa por defecto en este build (ver `storeFile` en `android/app/build.gradle`) |

**Fix aplicado:** se registró en Firebase el **SHA-1/SHA-256 real del keystore que firma el
build** (el del proyecto), resolviendo el `DEVELOPER_ERROR 10`. Verificar con:

```bash
node scripts/check-android-signature.js
```
Compara SHA-1 de (1) keystore global, (2) APK debug generado y (3) `google-services.json`.
Si (1)/(2) no coinciden con (3) → el error 10 es por SHA mismatch.

---

## 6. Variables de entorno

### Frontend `.env` (prefijo `EXPO_PUBLIC_`, **se empaquetan en el bundle**)
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID=     # ÚNICO usado en JS (webClientId)
EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID= # documentado; lo resuelve el SDK nativo
EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID=     # build nativo iOS
EXPO_PUBLIC_API_BASE_URL=                   # https://<proyecto>.railway.app/api/v1
EXPO_PUBLIC_DEV_AUTH_UID=                   # solo dev con AUTH_DEV_BYPASS
```
> 🔴 **NO** poner secretos reales bajo `EXPO_PUBLIC_` (ver Riesgo #1). Plantilla en `.env.example`.

### Backend Railway (valores en Railway Variables, **nunca** en el repo)
```
NODE_ENV
PORT
CORS_ORIGIN
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY          # secreto
AUTH_DEV_BYPASS               # false en producción
RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_MS / ANALISIS_RATE_LIMIT_MAX
TRIAL_DIAS
# RAILWAY_GIT_COMMIT_SHA / RAILWAY_GIT_BRANCH las inyecta Railway automáticamente
```

---

## 7. Endpoints relevantes

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/health` | público | devuelve `status`, `commit`, `branch` (verificar qué commit está vivo) |
| POST | `/api/v1/auth/login` | público | body `{ firebase_token }` → conductor o `conductor_no_encontrado` |
| POST | `/api/v1/conductor/crear` | público (antes del middleware) | registro del conductor nuevo |

---

## 8. Comandos de validación

```bash
# Frontend — verificar config Firebase y firma Android (no modifican nada)
node scripts/check-firebase-config.js
node scripts/check-android-signature.js

# Levantar la app en Android (build nativo)
npx expo run:android

# Backend vivo y qué commit está desplegado
curl https://<proyecto>.railway.app/health

# /conductor/crear rechaza token inválido (debe responder 401)
curl -X POST https://<proyecto>.railway.app/api/v1/conductor/crear \
  -H "Authorization: Bearer token-invalido" \
  -H "Content-Type: application/json" \
  -d '{"firebase_token":"token-invalido","nombre":"Test"}'
```

---

## 9. Evidencias de cierre

- ✅ **Login con Google** funcionando en Android (build nativo).
- ✅ **Registro de conductor** OK (`POST /conductor/crear`).
- ✅ **Sesión persistente** validada (cerrar/abrir la app mantiene sesión).
- ✅ Backend Railway desplegó el commit correcto (verificado vía `/health`).
- ✅ `DEVELOPER_ERROR 10` resuelto registrando el SHA real del build.

---

## 10. Riesgos pendientes

1. 🔴 **AWS secret key con prefijo `EXPO_PUBLIC_` en `.env` (trackeado en git).**
   - `EXPO_PUBLIC_` → se empaqueta en el bundle y viaja a cada dispositivo (extraíble).
   - `.env` trackeado → queda en el historial del repo.
   - **Mitigación:** rotar las llaves AWS, mover la subida a **presigned URLs firmadas por el
     backend**, eliminar las llaves del cliente. *(Fuera del alcance de este checkpoint.)*
2. 🟡 **Warnings de `getIdToken` (API namespaced de `@react-native-firebase`).** Solo
   deprecación; **no** son llamadas excesivas (el token se cachea). Migrar a API modular en
   un PR aislado, sin tocar el flujo de auth validado.
3. 🟡 **OTP / Phone Auth no validado end-to-end** (SMS recibido + login OK). Implementado pero
   pendiente de prueba con SHA + Play Integrity.
4. 🟡 **`.env` frontend trackeado.** Decidido: por ahora solo documentar (no se hizo
   `git rm --cached .env`).

---

## 11. Limpieza aplicada en este checkpoint

- Backend: `google-services.json` dejó de trackearse (no lo usa el backend) y se añadió a su
  `.gitignore`.
- Frontend: `client_secret_*.json` añadidos a `.gitignore`.
- Frontend: `console.warn` de Login/OTP gateados en `__DEV__` (evita ecoar datos en producción).
