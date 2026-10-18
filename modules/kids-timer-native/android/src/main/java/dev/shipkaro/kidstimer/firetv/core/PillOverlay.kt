package dev.shipkaro.kidstimer.firetv.core

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.random.Random

/**
 * The countdown pill floating in the top-right corner over any app.
 * Sizes come from the 1920x1080 design and are scaled to the real screen.
 */
class PillOverlay(private val context: Context) {
  private val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private var root: LinearLayout? = null
  private var timeView: TextView? = null
  private var pauseView: TextView? = null
  private var params: WindowManager.LayoutParams? = null
  private var pulse: ObjectAnimator? = null
  private var lastShiftMinute = -1L
  private var shiftX = 0
  private var shiftY = 0

  // displayMetrics instead of currentWindowMetrics: Fire OS 7 is API 28.
  private val scale: Float
    get() = context.resources.displayMetrics.let { maxOf(it.widthPixels, it.heightPixels) } / 1920f

  private fun d(ref: Int): Int = (ref * scale).toInt().coerceAtLeast(1)

  fun update(remainingMs: Long, paused: Boolean) {
    if (!Settings.canDrawOverlays(context)) {
      hide()
      return
    }
    if (root == null) create()
    timeView?.text = format(remainingMs)
    pauseView?.visibility = if (paused) View.VISIBLE else View.GONE
    updatePulse(!paused && remainingMs in 1..PULSE_WINDOW_MS)
    updateShift()
  }

  fun hide() {
    pulse?.cancel()
    pulse = null
    root?.let { runCatching { wm.removeView(it) } }
    root = null
    timeView = null
    pauseView = null
  }

  private fun create() {
    val pill = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      setPadding(d(38), d(18), d(42), d(18))
      // Fully opaque background, so video never shows through.
      background = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = d(58).toFloat()
        setColor(Color.rgb(0x0E, 0x15, 0x13))
        setStroke(d(2), Color.rgb(0x26, 0x30, 0x2D))
      }
    }
    // Perfect circle: equal width/height and an OVAL shape.
    val dotSize = d(32)
    val dot = View(context).apply {
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.rgb(0x7F, 0xE0, 0xB8))
      }
    }
    pill.addView(dot, LinearLayout.LayoutParams(dotSize, dotSize).apply { marginEnd = d(26) })

    val pause = TextView(context).apply {
      text = "⏸️"
      setTextSize(TypedValue.COMPLEX_UNIT_PX, d(44).toFloat())
      includeFontPadding = false
      visibility = View.GONE
    }
    pill.addView(pause, LinearLayout.LayoutParams(-2, -2).apply { marginEnd = d(14) })

    val time = TextView(context).apply {
      setTextColor(Color.rgb(0xEE, 0xF4, 0xF1))
      setTextSize(TypedValue.COMPLEX_UNIT_PX, d(56).toFloat())
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
      fontFeatureSettings = "tnum"
      includeFontPadding = false
    }
    pill.addView(time)

    val lp = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.END
      x = d(MARGIN_RIGHT)
      y = d(MARGIN_TOP)
    }
    runCatching { wm.addView(pill, lp) }.onFailure { return }
    root = pill
    timeView = time
    pauseView = pause
    params = lp
  }

  private fun updatePulse(on: Boolean) {
    val view = root ?: return
    if (on && pulse == null) {
      pulse = ObjectAnimator.ofFloat(view, View.ALPHA, 1f, 0.55f).apply {
        duration = 1000
        repeatMode = ValueAnimator.REVERSE
        repeatCount = ValueAnimator.INFINITE
        start()
      }
    } else if (!on && pulse != null) {
      pulse?.cancel()
      pulse = null
      view.alpha = 1f
    }
  }

  // Move a few pixels every minute so the pill never burns into the panel.
  private fun updateShift() {
    val minute = System.currentTimeMillis() / 60_000
    if (minute == lastShiftMinute) return
    lastShiftMinute = minute
    shiftX = Random.nextInt(-SHIFT, SHIFT + 1)
    shiftY = Random.nextInt(-SHIFT, SHIFT + 1)
    val lp = params ?: return
    lp.x = d(MARGIN_RIGHT + shiftX)
    lp.y = d(MARGIN_TOP + shiftY)
    root?.let { runCatching { wm.updateViewLayout(it, lp) } }
  }

  companion object {
    private const val MARGIN_RIGHT = 58
    private const val MARGIN_TOP = 57
    private const val SHIFT = 6
    private const val PULSE_WINDOW_MS = 5 * 60_000L

    fun format(ms: Long): String {
      val total = ((ms + 999) / 1000).coerceAtLeast(0)
      val h = total / 3600
      val m = (total % 3600) / 60
      val s = total % 60
      return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)
    }
  }
}
