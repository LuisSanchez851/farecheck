#!/usr/bin/env node
/**
 * check-firebase-config.js
 * Verificador local de google-services.json para FareCheck (Android).
 *
 * Uso:
 *   node scripts/check-firebase-config.js
 *
 * NO modifica nada. Solo lee google-services.json y valida lo mínimo para que
 * Firebase Auth nativo (@react-native-firebase) funcione en Android.
 * No imprime claves ni secretos: las huellas (certificate_hash) se muestran
 * enmascaradas.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const EXPECTED_PROJECT_ID = 'farecheck-d7781';
const EXPECTED_PACKAGE = 'com.farecheck.app';

// Permite pasar una ruta alterna: node scripts/check-firebase-config.js ./otro.json
const filePath = path.resolve(
  process.cwd(),
  process.argv[2] || 'google-services.json',
);

const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => console.log('  ✗ ' + m);
const mask = (s) => (typeof s === 'string' && s.length > 8 ? s.slice(0, 6) + '…' + s.slice(-4) : '****');

let failures = 0;
const fail = (m) => { failures++; bad(m); };

console.log('\nVerificando: ' + filePath + '\n');

if (!fs.existsSync(filePath)) {
  fail('google-services.json NO existe en esa ruta.');
  process.exit(1);
}

let json;
try {
  json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (e) {
  fail('google-services.json no es JSON válido: ' + e.message);
  process.exit(1);
}
ok('Archivo encontrado y es JSON válido.');

// project_id
const projectId = json?.project_info?.project_id;
if (projectId === EXPECTED_PROJECT_ID) ok('project_id = ' + projectId);
else fail('project_id esperado "' + EXPECTED_PROJECT_ID + '" pero es "' + projectId + '"');

// client del package esperado
const clients = Array.isArray(json?.client) ? json.client : [];
const client = clients.find(
  (c) => c?.client_info?.android_client_info?.package_name === EXPECTED_PACKAGE,
);

if (!client) {
  fail('No hay un client con package_name "' + EXPECTED_PACKAGE + '".');
  console.log('\nResultado: ' + failures + ' problema(s). Vuelve a Firebase Console.\n');
  process.exit(1);
}
ok('package_name = ' + EXPECTED_PACKAGE);

// oauth_client poblado
const oauthClient = Array.isArray(client.oauth_client) ? client.oauth_client : [];
if (oauthClient.length > 0) ok('oauth_client poblado (' + oauthClient.length + ' entrada/s).');
else fail('oauth_client esta VACIO. Faltan SHA en Firebase Console o no re-descargaste el archivo.');

// certificate_hash en al menos un oauth_client
const withHash = oauthClient.filter(
  (o) => o?.android_info && typeof o.android_info.certificate_hash === 'string' && o.android_info.certificate_hash.length > 0,
);
if (withHash.length > 0) {
  ok('certificate_hash presente (' + withHash.length + '):');
  withHash.forEach((o) => console.log('      - ' + mask(o.android_info.certificate_hash)));
} else {
  fail('No hay certificate_hash. Registra SHA-1/SHA-256 en Firebase Console y re-descarga.');
}

// api_key presente (no se imprime)
const apiKey = client?.api_key?.[0]?.current_key;
if (apiKey) ok('api_key presente (oculta).');
else fail('Falta api_key en el client.');

// ── webClientId del .env vs client_type 3 principal ───────────────────────────
// Para @react-native-google-signin, webClientId DEBE ser el OAuth "Web application"
// que google-services.json lista como client_type 3 DENTRO de client[].oauth_client.
// NO el de services.appinvite_service.other_platform_oauth_client (causa DEVELOPER_ERROR 10).
function readEnvVar(name) {
  for (const fname of ['.env', '.env.local']) {
    const p = path.resolve(process.cwd(), fname);
    if (!fs.existsSync(p)) continue;
    const line = fs
      .readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith(name + '='));
    if (line) {
      return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return undefined;
}

const principalWebClient = oauthClient.find((o) => o.client_type === 3)?.client_id;
const otherPlatform = (client?.services?.appinvite_service?.other_platform_oauth_client ?? [])
  .map((o) => o.client_id)
  .filter(Boolean);
const envWebClientId = readEnvVar('EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID');

if (!principalWebClient) {
  fail('No hay client_type 3 dentro de oauth_client (falta el Web client principal).');
} else if (!envWebClientId) {
  fail('EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID no está definido en .env');
  console.log('      debe ser el principal: ' + mask(principalWebClient));
} else if (envWebClientId === principalWebClient) {
  ok('EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID coincide con el Web client principal (' + mask(principalWebClient) + ').');
} else if (otherPlatform.includes(envWebClientId)) {
  fail('EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID apunta al other_platform_oauth_client — ESO causa DEVELOPER_ERROR (10).');
  console.log('      env actual : ' + mask(envWebClientId));
  console.log('      debe ser   : ' + mask(principalWebClient));
} else {
  fail('EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID no coincide con ningún client de google-services.json.');
  console.log('      env actual : ' + mask(envWebClientId));
  console.log('      debe ser   : ' + mask(principalWebClient));
}

console.log('');
if (failures === 0) {
  console.log('Resultado: OK ✓  google-services.json listo para Firebase Auth en Android.\n');
  process.exit(0);
} else {
  console.log('Resultado: ' + failures + ' problema(s). Corrige en Firebase Console y re-descarga el archivo.\n');
  process.exit(1);
}
