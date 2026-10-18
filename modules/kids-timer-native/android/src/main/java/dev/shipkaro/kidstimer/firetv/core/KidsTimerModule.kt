package dev.shipkaro.kidstimer.firetv.core

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

  private val foregroundListener: (String) -> Unit = { pkg ->
    sendEvent("onForegroundApp", mapOf("packageName" to pkg))
  }

  override fun definition() = ModuleDefinition {
    Name("KidsTimerNative")

    Events("onForegroundApp")

    OnStartObserving { WatchService.listeners.add(foregroundListener) }
    OnStopObserving { WatchService.listeners.remove(foregroundListener) }

    Function("getPermissions") {
      mapOf(
        "overlay" to Settings.canDrawOverlays(context),
        "accessibility" to WatchService.isEnabled(context),
      )
    }

    Function("getForegroundApp") { WatchService.foregroundPackage }

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
