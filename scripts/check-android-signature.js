#!/usr/bin/env node
/**
 * check-android-signature.js
 * Diagnóstico de firma Android para FareCheck. NO toca código de la app.
 *
 * Compara:
 *   1. SHA-1 del debug keystore local (~/.android/debug.keystore)
 *   2. SHA-1 del APK debug generado (android/app/build/outputs/apk/debug/app-debug.apk), si existe
 *   3. certificate_hash registrado en google-services.json
 *
 * Si (1) o (2) NO coinciden con (3) → DEVELOPER_ERROR (10) es por SHA mismatch.
 *
 * Uso:  node scripts/check-android-signature.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const APK = path.resolve(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk');
// El keystore GLOBAL del usuario y el LOCAL del proyecto (este último es el que
// gradle usa por defecto para firmar — ver android/app/build.gradle storeFile).
const DEBUG_KEYSTORE_GLOBAL = path.join(os.homedir(), '.android', 'debug.keystore');
const DEBUG_KEYSTORE_PROJECT = path.resolve(process.cwd(), 'android/app/debug.keystore');
const GS = path.resolve(process.cwd(), 'google-services.json');

const norm = (s) => (s || '').replace(/:/g, '').toLowerCase();
const grabSha1 = (out) => {
  const m =
    out.match(/SHA-?1[^:]*:\s*([0-9A-Fa-f:]{20,})/i) ||
    out.match(/SHA1:\s*([0-9A-Fa-f:]+)/i);
  return m ? norm(m[1]) : null;
};

// Localiza un binario probando PATH y rutas candidatas.
function findBin(name, candidates) {
  for (const k of [name, ...candidates]) {
    try {
      execSync(`"${k}" --version`, { stdio: 'ignore' });
      return k;
    } catch (_) {
      try {
        execSync(`"${k}" -help`, { stdio: 'ignore' });
        return k;
      } catch (_2) {
        /* sigue */
      }
    }
  }
  return null;
}

function findKeytool() {
  const c = [];
  if (process.env.JAVA_HOME) c.push(path.join(process.env.JAVA_HOME, 'bin', 'keytool'));
  return findBin('keytool', c);
}

// apksigner del Android SDK build-tools (necesario para firma v2/v3 de APKs modernos;
// keytool -jarfile solo lee la firma v1, que estos APK ya no llevan).
function findApksigner() {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
  const c = [];
  if (sdk && fs.existsSync(path.join(sdk, 'build-tools'))) {
    for (const ver of fs.readdirSync(path.join(sdk, 'build-tools')).sort().reverse()) {
      c.push(path.join(sdk, 'build-tools', ver, 'apksigner.bat'));
      c.push(path.join(sdk, 'build-tools', ver, 'apksigner'));
    }
  }
  for (const k of c) {
    if (fs.existsSync(k)) return k;
  }
  return null;
}

function keystoreSha(keytool, ksPath) {
  if (!fs.existsSync(ksPath)) return null;
  try {
    const out = execSync(
      `"${keytool}" -list -v -keystore "${ksPath}" -alias androiddebugkey -storepass android -keypass android`,
      { encoding: 'utf8' },
    );
    return grabSha1(out);
  } catch (_) {
    return null;
  }
}

console.log('');
const keytool = findKeytool();
if (!keytool) {
  console.log('✗ No encuentro keytool. Setea JAVA_HOME o usa la ruta completa del JDK, p.ej.:');
  console.log('    & "C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot\\bin\\keytool.exe" ...');
  process.exit(1);
}

// (3) certificate_hash de google-services.json
let gsHash = null;
try {
  const json = JSON.parse(fs.readFileSync(GS, 'utf8'));
  for (const c of json.client || []) {
    for (const o of c.oauth_client || []) {
      if (o?.android_info?.certificate_hash) gsHash = norm(o.android_info.certificate_hash);
    }
  }
} catch (e) {
  console.log('✗ No pude leer google-services.json:', e.message);
}
console.log('google-services.json certificate_hash : ' + (gsHash || 'NO ENCONTRADO') + '  (registrado en Firebase)');

// (1) keystores: global del usuario y LOCAL del proyecto (el que gradle usa de verdad)
const globalSha = keystoreSha(keytool, DEBUG_KEYSTORE_GLOBAL);
const projectSha = keystoreSha(keytool, DEBUG_KEYSTORE_PROJECT);
console.log('~/.android/debug.keystore SHA-1       : ' + (globalSha || 'NO DISPONIBLE') + '  (global del usuario)');
console.log('android/app/debug.keystore SHA-1      : ' + (projectSha || 'NO DISPONIBLE') + '  (FIRMA REAL del build)');

// (2) APK generado — apksigner (firma v2/v3); fallback a keytool -jarfile (v1)
let apkSha = null;
if (fs.existsSync(APK)) {
  const apksigner = findApksigner();
  if (apksigner) {
    try {
      const out = execSync(`"${apksigner}" verify --print-certs "${APK}"`, { encoding: 'utf8' });
      apkSha = grabSha1(out);
    } catch (_) { /* intenta keytool abajo */ }
  }
  if (!apkSha) {
    try {
      const out = execSync(`"${keytool}" -printcert -jarfile "${APK}"`, { encoding: 'utf8' });
      apkSha = grabSha1(out);
    } catch (_) { /* sin firma v1 */ }
  }
  if (!apkSha) console.log('  (no pude extraer la firma del APK; instala build-tools/apksigner)');
} else {
  console.log('  (APK debug no existe — compila con `npx expo run:android`)');
}
console.log('app-debug.apk SHA-1                    : ' + (apkSha || 'NO DISPONIBLE') + '  (lo que está INSTALADO)');

// Veredicto: lo único que importa para DEVELOPER_ERROR es el SHA del APK instalado.
console.log('');
const signSha = apkSha || projectSha;
if (!gsHash) {
  console.log('  ? Sin certificate_hash en google-services.json para comparar.');
} else if (!signSha) {
  console.log('  ? No pude determinar la firma del build.');
} else if (signSha === gsHash) {
  console.log('  ✓ La firma del build COINCIDE con Firebase. El SHA no es la causa.');
} else {
  console.log('  ✗ SHA MISMATCH → causa de DEVELOPER_ERROR (10).');
  console.log('    Firma del build : ' + signSha);
  console.log('    Firebase espera : ' + gsHash);
  console.log('    FIX: registra el SHA-1 del build (' + signSha + ') en Firebase Console,');
  console.log('         o haz que gradle firme con el keystore cuyo SHA ya está registrado.');
}
console.log('');
