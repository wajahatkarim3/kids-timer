package dev.shipkaro.kidstimer.firetv.a11y

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityWindowInfo
import dev.shipkaro.kidstimer.firetv.core.EngineService

/**
 * Watches which app is in front, so screen time only counts while a counted
 * app is on screen, and turns the screen off when time is up.
 */
class WatchService : AccessibilityService() {

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
    // A window change only fires on the next app switch, so look up the app
    // that is already open (the service may restart mid-show).
    foregroundPackage = null
    findAppInFront(attempt = 0)
    EngineService.start(this)
  }

  private val handler = Handler(Looper.getMainLooper())

  private fun findAppInFront(attempt: Int) {
    if (instance !== this || foregroundPackage != null) return
    val pkg = runCatching { appInFront() }.getOrNull()
    when {
      pkg != null -> setForeground(pkg)
      // The window list can be empty right after connecting.
      attempt < 5 -> handler.postDelayed({ findAppInFront(attempt + 1) }, 500)
    }
  }

  private fun appInFront(): String? {
    val apps = windows.filter { it.type == AccessibilityWindowInfo.TYPE_APPLICATION }
    val top = apps.firstOrNull { it.isFocused || it.isActive } ?: apps.firstOrNull() ?: return null
    val pkg = top.root?.packageName?.toString() ?: return null
    return pkg.takeUnless { it in IGNORED }
  }

  private fun setForeground(pkg: String) {
    if (pkg == foregroundPackage) return
    foregroundPackage = pkg
    listeners.toList().forEach { it(pkg) }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    // System UI / IME windows sit on top of the real app; ignore them.
    if (pkg in IGNORED) return
    // Overlays (including our own pill), toasts and dialogs also fire this
    // event. Only a real activity means the app in front changed.
    if (!isActivity(pkg, event.className?.toString())) return
    setForeground(pkg)
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    instance = null
    handler.removeCallbacksAndMessages(null)
    super.onDestroy()
  }

  private val activityCache = mutableMapOf<String, Boolean>()

  private fun isActivity(pkg: String, cls: String?): Boolean {
    cls ?: return false
    return activityCache.getOrPut("$pkg/$cls") {
      runCatching { packageManager.getActivityInfo(ComponentName(pkg, cls), 0) }
        .map { true }
        .getOrElse {
          // Packages hidden by Android 11+ package visibility can't be looked
          // up; fall back to rejecting plain view/widget classes.
          pkg != packageName && VIEW_PREFIXES.none { cls.startsWith(it) }
        }
    }
  }

  fun lockScreen(): Boolean =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
      performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)

  companion object {
    private val VIEW_PREFIXES = listOf("android.widget.", "android.view.", "android.app.Dialog", "android.app.AlertDialog")

    private val IGNORED = setOf(
      "com.android.systemui",
      "com.google.android.inputmethod.latin",
      "com.google.android.tvrecommendations",
    )

    @Volatile var instance: WatchService? = null
      private set

    @Volatile var foregroundPackage: String? = null
      private set

    val listeners = mutableSetOf<(String) -> Unit>()

    fun isEnabled(context: Context): Boolean {
      val expected = ComponentName(context, WatchService::class.java)
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
      ) ?: return false
      return enabled.split(':').any { ComponentName.unflattenFromString(it) == expected }
    }
  }
}
