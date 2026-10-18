package dev.shipkaro.kidstimer.firetv.core

import android.app.admin.DeviceAdminReceiver
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restart the engine after the TV reboots. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) EngineService.start(context)
  }
}

/** Optional "Backup TV off": lets the app lock the screen without accessibility. */
class AdminReceiver : DeviceAdminReceiver()
