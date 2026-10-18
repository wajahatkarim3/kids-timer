package dev.shipkaro.kidstimer.firetv.core

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

/** Keeps [Engine] ticking while other apps are on screen. */
class EngineService : Service() {

  override fun onCreate() {
    super.onCreate()
    startForegroundCompat()
    Engine.start(this)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

  override fun onDestroy() {
    Engine.stop()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startForegroundCompat() {
    val nm = getSystemService(NotificationManager::class.java)
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL, "Kids Timer", NotificationManager.IMPORTANCE_MIN),
    )
    val notification = Notification.Builder(this, CHANNEL)
      .setContentTitle("Kids Timer is on")
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setOngoing(true)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(ID, notification)
    }
  }

  companion object {
    private const val CHANNEL = "engine"
    private const val ID = 17

    fun start(context: Context) {
      Engine.init(context)
      runCatching {
        context.startForegroundService(Intent(context, EngineService::class.java))
      }.onFailure {
        // Background start not allowed right now: tick in-process instead.
        Engine.start(context)
      }
    }
  }
}
