package dev.shipkaro.kidstimer.firetv.core

import android.app.admin.DevicePolicyManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import dev.shipkaro.kidstimer.firetv.a11y.WatchService
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KidsTimerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val stateListener: () -> Unit = { sendEvent("onState", Engine.snapshot()) }

  override fun definition() = ModuleDefinition {
    Name("KidsTimerNative")

    Events("onState", "onDigit")

    // Listen for the module's whole life: OnStopObserving fires when the last
    // listener of *any* event goes away (e.g. onDigit), which would cut state.
    OnCreate {
      appContext.reactContext?.let { EngineService.start(it) }
      Engine.listeners.add(stateListener)
    }
    OnDestroy { Engine.listeners.remove(stateListener) }

    OnActivityEntersForeground {
      Engine.appVisible = true
      installDigitHook()
    }
    OnActivityEntersBackground { Engine.appVisible = false }

    // ---- state ----

    Function("getState") { Engine.snapshot() }
    Function("takePendingBlock") { Engine.takePendingBlock() }
    Function("clearBlock") { Engine.clearBlock() }

    Function("setSettings") { patch: Map<String, Any?> ->
      val s = Engine.store.settings
      (patch["secret"] as? Number)?.let { s.secret = it.toInt() }
      (patch["dailyMin"] as? Number)?.let { s.dailyMin = it.toInt() }
      (patch["sessionMin"] as? Number)?.let { s.sessionMin = it.toInt() }
      (patch["breakMin"] as? Number)?.let { s.breakMin = it.toInt() }
      (patch["whenUp"] as? String)?.let { s.whenUp = it }
      (patch["onboarded"] as? Boolean)?.let { s.onboarded = it }
      (patch["counted"] as? List<*>)?.let { list -> s.counted = list.map { it.toString() }.toMutableSet() }
      Engine.changed()
    }

    Function("getItem") { key: String -> Engine.store.getItem(key) }
    Function("setItem") { key: String, value: String? -> Engine.store.setItem(key, value) }

    // ---- sleep timer ----

    Function("startSleep") { minutes: Int -> Engine.startSleep(minutes) }
    Function("pauseSleep") { Engine.pauseSleep() }
    Function("resumeSleep") { Engine.resumeSleep() }
    Function("adjustSleep") { deltaMin: Int -> Engine.adjustSleep(deltaMin) }
    Function("stopSleep") { Engine.stopSleep() }

    // ---- daily rules / grown-up mode ----

    Function("setGrownUp") { mode: String -> Engine.setGrownUp(mode) }
    Function("endGrownUp") { Engine.endGrownUp() }
    Function("addTime") { minutes: Int, kind: String -> Engine.addTime(minutes, kind) }
    Function("skipBreak") { Engine.skipBreak() }
    Function("continueWatching") { Engine.continueWatching() }

    // ---- navigation out of the app ----

    Function("goHome") { Engine.goHome() }
    Function("backToWatching") {
      appContext.currentActivity?.moveTaskToBack(true) ?: Engine.goHome()
    }
    Function("openApp") { pkg: String -> Engine.launchPackage(pkg) }
    AsyncFunction("getInstalledApps") { AppsRepo.installed(context) }
    Function("turnScreenOff") { Engine.turnScreenOff() }

    // ---- permissions ----

    Function("getPermissions") {
      val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
      mapOf(
        "overlay" to Settings.canDrawOverlays(context),
        "accessibility" to WatchService.isEnabled(context),
        "admin" to dpm.isAdminActive(Engine.adminComponent(context)),
      )
    }

    Function("openOverlaySettings") {
      val pkgUri = Uri.parse("package:${context.packageName}")
      startFirst(
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, pkgUri),
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkgUri),
        Intent(Settings.ACTION_SETTINGS),
      )
    }

    Function("openAccessibilitySettings") {
      startFirst(
        Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
        Intent(Settings.ACTION_SETTINGS),
      )
    }

    Function("requestAdmin") {
      startFirst(
        Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
          .putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, Engine.adminComponent(context))
          .putExtra(
            DevicePolicyManager.EXTRA_ADD_EXPLANATION,
            "Lets Kids Timer turn the TV screen off when time is up.",
          ),
        Intent(Settings.ACTION_SECURITY_SETTINGS),
      )
    }
  }

  private fun installDigitHook() {
    val window = appContext.currentActivity?.window ?: return
    val current = window.callback ?: return
    if (current is DigitKeyCallback) return
    window.callback = DigitKeyCallback(current) { sendEvent("onDigit", mapOf("digit" to it)) }
  }

  // Fire OS hides some settings screens; fall back until one opens.
  private fun startFirst(vararg intents: Intent): Boolean {
    for (intent in intents) {
      try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        return true
      } catch (_: ActivityNotFoundException) {
      } catch (_: SecurityException) {
      }
    }
    return false
  }
}
