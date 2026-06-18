/**
 * Config plugin de Expo para el módulo OCR de FareCheck (S3-01).
 *
 * El directorio `android/` lo regenera Expo en cada `prebuild`, así que las fuentes
 * nativas viven versionadas en `ocr-native/` y este plugin las inyecta durante el
 * prebuild. Hace:
 *
 *   1. Copia los .java a android/app/src/main/java/com/farecheck/app/ocr/
 *   2. Copia los recursos res/* (xml del servicio + layout/drawable del overlay).
 *   3. AndroidManifest: <service> AccessibilityService + <service> overlay + permiso
 *      SYSTEM_ALERT_WINDOW; añade los strings de descripción/label.
 *   4. Registra OcrBridgePackage en MainApplication (Kotlin o Java).
 *
 * Uso: añadir "./plugins/withFareCheckOcr" al array `plugins` de app.json.
 */
const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withStringsXml,
  withMainApplication,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');

const PKG_PATH = 'com/farecheck/app/ocr';
const SERVICE_CLASS = 'com.farecheck.app.ocr.OfferReaderAccessibilityService';
const OVERLAY_SERVICE_CLASS = 'com.farecheck.app.ocr.FloatingOverlayService';
const ACCESSIBILITY_DESCRIPTION =
  'FareCheck lee las ofertas de viaje en pantalla para calcular si son rentables ' +
  '(semáforo verde/amarillo/rojo). No realiza acciones por ti.';

// ── 1 + 2. Copia de fuentes nativas (java + res/xml) ──────────────────────────
function withOcrSources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot; // .../android
      const sourceRoot = path.join(projectRoot, 'ocr-native', 'android');

      // Java → android/app/src/main/java/com/farecheck/app/ocr/
      // Copia TODOS los .java del paquete (detector, parsers por plataforma, bridge…).
      const javaSrc = path.join(sourceRoot, 'java', PKG_PATH);
      const javaDest = path.join(platformRoot, 'app', 'src', 'main', 'java', PKG_PATH);
      fs.mkdirSync(javaDest, { recursive: true });
      for (const file of fs.readdirSync(javaSrc)) {
        if (file.endsWith('.java')) {
          fs.copyFileSync(path.join(javaSrc, file), path.join(javaDest, file));
        }
      }

      // res/* → android/app/src/main/res/* (xml, layout, drawable…). Copia recursiva
      // de cada subcarpeta de recursos para que el overlay (layout + drawables) llegue.
      const resSrc = path.join(sourceRoot, 'res');
      const resDest = path.join(platformRoot, 'app', 'src', 'main', 'res');
      for (const sub of fs.readdirSync(resSrc)) {
        const subSrc = path.join(resSrc, sub);
        if (!fs.statSync(subSrc).isDirectory()) continue;
        const subDest = path.join(resDest, sub);
        fs.mkdirSync(subDest, { recursive: true });
        for (const file of fs.readdirSync(subSrc)) {
          fs.copyFileSync(path.join(subSrc, file), path.join(subDest, file));
        }
      }

      return cfg;
    },
  ]);
}

// ── 3a. <service> + permiso en AndroidManifest ────────────────────────────────
function withOcrManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;

    // SYSTEM_ALERT_WINDOW (overlay del semáforo). BIND_ACCESSIBILITY_SERVICE NO es un
    // uses-permission: lo exige el sistema sobre el propio <service> (android:permission).
    manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] || [];
    const perms = manifest.manifest['uses-permission'];
    if (!perms.some((p) => p.$ && p.$['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW')) {
      perms.push({ $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' } });
    }

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.service = app.service || [];

    const tieneServicio = (name) => app.service.some((s) => s.$ && s.$['android:name'] === name);

    // AccessibilityService (lectura de pantalla).
    if (!tieneServicio(SERVICE_CLASS)) {
      app.service.push({
        $: {
          'android:name': SERVICE_CLASS,
          'android:exported': 'false',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:label': '@string/farecheck_accessibility_label',
        },
        'intent-filter': [
          { action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
      });
    }

    // FloatingOverlayService (chip del semáforo, S3-03).
    if (!tieneServicio(OVERLAY_SERVICE_CLASS)) {
      app.service.push({
        $: { 'android:name': OVERLAY_SERVICE_CLASS, 'android:exported': 'false' },
      });
    }

    return cfg;
  });
}

// ── 3b. Strings de descripción / label ────────────────────────────────────────
function withOcrStrings(config) {
  return withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [
        { $: { name: 'farecheck_accessibility_description' }, _: ACCESSIBILITY_DESCRIPTION },
        { $: { name: 'farecheck_accessibility_label' }, _: 'FareCheck' },
      ],
      cfg.modResults,
    );
    return cfg;
  });
}

// ── 4. Registro de OcrBridgePackage en MainApplication ────────────────────────
function withOcrPackageRegistration(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    const importKt = 'import com.farecheck.app.ocr.OcrBridgePackage';
    const importJava = 'import com.farecheck.app.ocr.OcrBridgePackage;';

    if (cfg.modResults.language === 'kt') {
      if (!src.includes(importKt)) {
        src = src.replace(/(package .*\n)/, `$1\n${importKt}\n`);
      }
      if (!src.includes('OcrBridgePackage()')) {
        // Inserta antes de `return packages`
        src = src.replace(
          /(val packages = PackageList\(this\)\.packages)/,
          '$1\n            packages.add(OcrBridgePackage())',
        );
      }
    } else {
      if (!src.includes(importJava)) {
        src = src.replace(/(package .*;\n)/, `$1\n${importJava}\n`);
      }
      if (!src.includes('new OcrBridgePackage()')) {
        src = src.replace(
          /(List<ReactPackage> packages = new PackageList\(this\)\.getPackages\(\);)/,
          '$1\n      packages.add(new OcrBridgePackage());',
        );
      }
    }

    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = function withFareCheckOcr(config) {
  config = withOcrSources(config);
  config = withOcrStrings(config);
  config = withOcrManifest(config);
  config = withOcrPackageRegistration(config);
  return config;
};
