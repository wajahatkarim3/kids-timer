package dev.shipkaro.kidstimer.firetv.a11y

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent

/**
 * Watches which app is in front. Later it also turns the screen off and
 * sends the kid to the TV home screen from block screens.
 */
class WatchService : AccessibilityService() {

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg != foregroundPackage) {
      foregroundPackage = pkg
      listeners.forEach { it(pkg) }
    }
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }

  companion object {
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
