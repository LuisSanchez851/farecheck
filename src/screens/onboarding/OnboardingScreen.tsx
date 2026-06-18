import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { useAppStore } from '../../store/app.store';

// ── Contenido de los slides ─────────────────────────────────────────────────────

interface Slide {
  key: string;
  title: string;
  description: string;
  // Illustration: o un ícono de Ionicons o el semáforo (3 círculos)
  icon?: keyof typeof Ionicons.glyphMap;
  semaforo?: boolean;
}

const SLIDES: Slide[] = [
  {
    key: 'ganancias',
    title: 'Controla tus ganancias',
    description:
      'Analiza cada oferta en tiempo real y decide cuáles servicios son rentables para ti.',
    icon: 'stats-chart-outline',
  },
  {
    key: 'ocr',
    title: 'Analiza cada servicio',
    description:
      'Nuestro sistema OCR lee automáticamente los datos de la oferta de tu pantalla.',
    icon: 'scan-outline',
  },
  {
    key: 'semaforo',
    title: 'Tu semáforo personal',
    description:
      'Configura tus umbrales de rentabilidad: VERDE (aceptar), AMARILLO (evaluar), ROJO (rechazar).',
    semaforo: true,
  },
];

// ── Ilustración por slide ────────────────────────────────────────────────────────

function SlideIllustration({ slide }: { slide: Slide }) {
  if (slide.semaforo) {
    return (
      <View style={styles.illustrationCircle}>
        <View style={styles.semaforoRow}>
          <View style={[styles.semaforoDot, { backgroundColor: colors.green }]} />
          <View style={[styles.semaforoDot, { backgroundColor: colors.amber }]} />
          <View style={[styles.semaforoDot, { backgroundColor: colors.red }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.illustrationCircle}>
      <Ionicons name={slide.icon ?? 'ellipse-outline'} size={72} color={colors.primary} />
    </View>
  );
}

// ── Dots de paginación ───────────────────────────────────────────────────────────

function PaginationDots({ count, current }: { count: number; current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ── Pantalla ─────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);

  const isLast = page === SLIDES.length - 1;

  // Marca el onboarding como visto → RootNavigator enruta a Login o AppTabs
  const finish = () => setOnboardingComplete(true);

  const handleNext = () => {
    if (isLast) {
      finish();
      return;
    }
    pagerRef.current?.setPage(page + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Saltar ──────────────────────────────────────────────── */}
      <View style={styles.skipRow}>
        <TouchableOpacity
          onPress={finish}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ opacity: isLast ? 0 : 1 }}
          disabled={isLast}
        >
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Slides swipeables ───────────────────────────────────── */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <SlideIllustration slide={slide} />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </PagerView>

      {/* ── Footer: dots + botón ────────────────────────────────── */}
      <View style={styles.footer}>
        <PaginationDots count={SLIDES.length} current={page} />

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{isLast ? 'Comenzar' : 'Siguiente'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────────

const ILLUSTRATION_SIZE = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    height: 40,
  },
  skipText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.textSecondary,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustrationCircle: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.cyanLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  semaforoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  semaforoDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
  },
  title: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.border,
  },
  button: {
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.white,
  },
});
