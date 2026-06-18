package com.farecheck.app.ocr;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.farecheck.app.R;

/**
 * Muestra un overlay flotante con el resultado del semáforo SOBRE la app de transporte
 * usando SYSTEM_ALERT_WINDOW (WindowManager.addView). El conductor decide aceptar o
 * rechazar sin salir de DiDi/Uber.
 *
 * Se controla con startService + Intent:
 *   - ACTION_SHOW (+ semáforo, mensaje, viaje_id) → muestra/actualiza el overlay.
 *   - ACTION_HIDE                                  → lo quita y detiene el servicio.
 *
 * Al tocar Aceptar/Rechazar, reenvía la decisión a JS vía
 * {@link OcrBridgeModule#emitDecision} (JS hace el PATCH /analisis/:id/decision).
 * El chip es arrastrable y se minimiza tocando el punto de color.
 */
public class FloatingOverlayService extends Service {

    private static final String TAG = "FareCheckOcr";

    public static final String ACTION_SHOW   = "com.farecheck.app.ocr.SHOW_OVERLAY";
    public static final String ACTION_HIDE   = "com.farecheck.app.ocr.HIDE_OVERLAY";
    public static final String EXTRA_SEMAFORO = "semaforo";
    public static final String EXTRA_MENSAJE  = "mensaje";
    public static final String EXTRA_VIAJE_ID = "viaje_id";

    @Nullable private WindowManager windowManager;
    @Nullable private View overlayView;
    @Nullable private WindowManager.LayoutParams params;

    @Nullable private String viajeId;
    private boolean expandido = true;

    @Override
    public int onStartCommand(@Nullable Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        if (ACTION_HIDE.equals(intent.getAction())) {
            removeOverlay();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_SHOW.equals(intent.getAction())) {
            final String semaforo = intent.getStringExtra(EXTRA_SEMAFORO);
            String mensaje = intent.getStringExtra(EXTRA_MENSAJE);
            if (mensaje == null || mensaje.isEmpty()) mensaje = SemaforoVisual.defaultMessage(semaforo);
            viajeId = intent.getStringExtra(EXTRA_VIAJE_ID);
            mostrar(semaforo, mensaje);
        }
        return START_NOT_STICKY;
    }

    private void mostrar(@Nullable String semaforo, String mensaje) {
        // Sin permiso para dibujar encima no podemos hacer nada.
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "Sin permiso SYSTEM_ALERT_WINDOW; no se puede mostrar el overlay.");
            stopSelf();
            return;
        }

        if (windowManager == null) {
            windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        }

        if (overlayView == null) {
            overlayView = LayoutInflater.from(this).inflate(R.layout.semaforo_overlay, null);
            params = construirLayoutParams();
            cablearInteraccion();
            windowManager.addView(overlayView, params);
        }

        pintar(semaforo, mensaje);
    }

    /** Aplica color/título/mensaje del semáforo actual al overlay ya inflado. */
    private void pintar(@Nullable String semaforo, String mensaje) {
        if (overlayView == null) return;
        final int color = SemaforoVisual.colorForName(semaforo);

        final View dot = overlayView.findViewById(R.id.overlay_dot);
        if (dot.getBackground() instanceof GradientDrawable) {
            ((GradientDrawable) dot.getBackground()).setColor(color);
        } else {
            dot.setBackgroundColor(color);
        }

        final TextView title = overlayView.findViewById(R.id.overlay_title);
        title.setText(SemaforoVisual.titleForName(semaforo));
        title.setTextColor(color);

        ((TextView) overlayView.findViewById(R.id.overlay_mensaje)).setText(mensaje);

        // Asegura que se muestre expandido al recibir una nueva oferta.
        expandido = true;
        overlayView.findViewById(R.id.overlay_detail).setVisibility(View.VISIBLE);
    }

    private void cablearInteraccion() {
        if (overlayView == null) return;

        overlayView.findViewById(R.id.btn_aceptar).setOnClickListener(v -> decidir("aceptado"));
        overlayView.findViewById(R.id.btn_rechazar).setOnClickListener(v -> decidir("rechazado"));

        // Tocar el punto de color minimiza/expande el detalle.
        final View detail = overlayView.findViewById(R.id.overlay_detail);
        overlayView.findViewById(R.id.overlay_dot).setOnClickListener(v -> {
            expandido = !expandido;
            detail.setVisibility(expandido ? View.VISIBLE : View.GONE);
        });

        // Arrastrar el chip por el header.
        overlayView.findViewById(R.id.overlay_header).setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float touchX, touchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if (params == null || windowManager == null) return false;
                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x; initialY = params.y;
                        touchX = event.getRawX(); touchY = event.getRawY();
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (touchX - event.getRawX()); // gravedad END
                        params.y = initialY + (int) (event.getRawY() - touchY);
                        windowManager.updateViewLayout(overlayView, params);
                        return true;
                    default:
                        return false;
                }
            }
        });
    }

    private void decidir(String decision) {
        OcrBridgeModule.emitDecision(viajeId, decision);
        removeOverlay();
        stopSelf();
    }

    private WindowManager.LayoutParams construirLayoutParams() {
        final int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams p = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);

        p.gravity = Gravity.TOP | Gravity.END;
        final int margin = dp(12);
        p.x = margin;
        p.y = dp(80); // bajo la status bar / la cabecera de la app
        return p;
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics());
    }

    private void removeOverlay() {
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (IllegalArgumentException ignored) { /* ya removido */ }
        }
        overlayView = null;
    }

    @Override
    public void onDestroy() {
        removeOverlay();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // servicio "started", no "bound"
    }
}
