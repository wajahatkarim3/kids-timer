package dev.shipkaro.kidstimer.firetv.core

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import dev.shipkaro.kidstimer.firetv.a11y.WatchService
import java.util.Calendar

/**
 * The single source of truth for timers and daily rules. Runs inside
 * [EngineService] so it keeps counting while kids are in other apps.
 */
object Engine {
  const val EXTRA_BLOCK = "kt_block"
  const val BLOCK_TIMES_UP = "timesUp"
  const val BLOCK_BREAK = "break"
  const val BLOCK_DAILY = "daily"

  private const val TAG = "KidsTimer"
  private const val TICK_MS = 1000L
  private const val MIN_MS = 60_000L

  private lateinit var app: Context
  lateinit var store: Store
    private set
  private var pill: PillOverlay? = null
  private val handler = Handler(Looper.getMainLooper())
  private var running = false
  private var lastTick = 0L
  private var lastBlockLaunch = 0L
  private var lastTriedLog = 0L

  /** Block screen the kid must see (null when free to watch). */
  var block: String? = null
    private set
  /** Set when the engine opened the app for a block; consumed by JS. */
  private var pendingBlock: String? = null

  val listeners = mutableSetOf<() -> Unit>()

  /** Our own activity is on screen (known even without the accessibility service). */
  @Volatile var appVisible = false
    set(value) {
      field = value
      if (::app.isInitialized) tickNowForPill()
    }

  private fun ownForeground(fg: String?) = appVisible || fg == app.packageName

  fun init(context: Context) {
    if (::app.isInitialized) return
    app = context.applicationContext
    store = Store(app)
    pill = PillOverlay()
    rollDay(System.currentTimeMillis())
  }

  fun start(context: Context) {
    init(context)
    if (running) return
    running = true
    lastTick = System.currentTimeMillis()
    handler.post(tickRunnable)
  }

  fun stop() {
    running = false
    handler.removeCallbacks(tickRunnable)
    pill?.hide()
  }

  private val tickRunnable = object : Runnable {
    override fun run() {
      if (!running) return
      runCatching { tick() }.onFailure { Log.w(TAG, "tick failed", it) }
      handler.postDelayed(this, TICK_MS)
    }
  }

  // ---------------------------------------------------------------- tick

  private fun tick() {
    val now = System.currentTimeMillis()
    val dt = (now - lastTick).coerceIn(0, 2 * TICK_MS)
    lastTick = now
    rollDay(now)

    val s = store.settings
    val d = store.day
    val fg = WatchService.foregroundPackage
    val ownFg = ownForeground(fg)
    val screenOn = (app.getSystemService(Context.POWER_SERVICE) as PowerManager).isInteractive

    if (store.grownUntil in 1 until now) endGrownUp()
    val grown = grownActive(now)

    // Sleep timer: counts whatever is on screen.
    val sl = store.sleep
    if (sl.running && !sl.paused && sl.endAt <= now) sleepEnded(now)

    // Daily rules: only while a counted app is actually on screen.
    val counted = !grown && screenOn && !ownFg && fg != null && fg in s.counted
    if (counted) {
      when {
        d.breakUntil > now -> blockWatching(BLOCK_BREAK, fg!!, now)
        d.usedMs >= dailyLimitMs() -> blockWatching(BLOCK_DAILY, fg!!, now)
        else -> countWatching(fg!!, dt, now)
      }
    }

    updatePill(now, ownFg, grown, counted, fg)
    notifyListeners()
  }

  private fun countWatching(pkg: String, dt: Long, now: Long) {
    val s = store.settings
    val d = store.day
    if (d.sessionMs == 0L) store.log("Session started · ${label(pkg)}", now)
    d.usedMs += dt
    d.sessionMs += dt
    d.perApp[pkg] = (d.perApp[pkg] ?: 0) + dt
    d.lastApp = pkg

    if (d.usedMs >= dailyLimitMs()) {
      d.sessionMs = 0
      store.log("Daily limit reached · ${label(pkg)}", now)
      if (s.whenUp == "off") turnScreenOff(now)
      showBlock(BLOCK_DAILY, now)
    } else if (d.sessionMs >= s.sessionMin * MIN_MS) {
      d.sessionMs = 0
      if (s.breakMin > 0) {
        d.breakUntil = now + s.breakMin * MIN_MS
        store.log("Session ended, break · ${label(pkg)}", now)
        showBlock(BLOCK_BREAK, now)
      } else {
        store.log("Session ended · ${label(pkg)}", now)
      }
    }
    store.save()
  }

  private fun blockWatching(kind: String, pkg: String, now: Long) {
    if (now - lastTriedLog > MIN_MS) {
      lastTriedLog = now
      val why = if (kind == BLOCK_BREAK) "during a break" else "after the daily limit"
      store.log("Tried to watch $why · ${label(pkg)}", now)
    }
    showBlock(kind, now)
  }

  private fun updatePill(now: Long, ownFg: Boolean, grown: Boolean, counted: Boolean, fg: String?) {
    val p = pill ?: return
    val sl = store.sleep
    val d = store.day
    when {
      ownFg || fg == null && !sl.running -> p.hide()
      sl.running -> p.update(sleepRemaining(now), sl.paused, onHome(fg))
      grown -> p.hide()
      counted -> p.update(watchRemaining(), false, false)
      // Left the counted app mid-session: show the paused time.
      d.sessionMs > 0 && d.breakUntil <= now -> p.update(watchRemaining(), true, onHome(fg))
      else -> p.hide()
    }
  }

  // ---------------------------------------------------------------- day

  private fun rollDay(now: Long) {
    val key = Store.dateKey(now)
    val d = store.day
    if (d.key == key) return
    store.archiveDay()
    d.key = key
    d.usedMs = 0
    d.extraMs = 0
    d.sessionMs = 0
    d.breakUntil = 0
    d.perApp.clear()
    if (block == BLOCK_DAILY || block == BLOCK_BREAK) block = null
    store.save()
  }

  private val homePackages: Set<String> by lazy {
    app.packageManager.queryIntentActivities(
      Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0,
    ).map { it.activityInfo.packageName }.toSet()
  }

  /** The TV home screen draws a clock top-right; the pill moves below it there. */
  private fun onHome(fg: String?): Boolean = fg != null && fg in homePackages

  fun dailyLimitMs(): Long = store.settings.dailyMin * MIN_MS + store.day.extraMs

  private fun watchRemaining(): Long {
    val s = store.settings
    val d = store.day
    val session = s.sessionMin * MIN_MS - d.sessionMs
    val daily = dailyLimitMs() - d.usedMs
    return minOf(session, daily).coerceAtLeast(0)
  }

  // ---------------------------------------------------------------- sleep timer

  fun sleepRemaining(now: Long = System.currentTimeMillis()): Long {
    val sl = store.sleep
    if (!sl.running) return 0
    return if (sl.paused) sl.remainingMs else (sl.endAt - now).coerceAtLeast(0)
  }

  fun startSleep(minutes: Int) {
    val now = System.currentTimeMillis()
    store.sleep.apply {
      running = true
      paused = false
      durationMin = minutes
      endAt = now + minutes * MIN_MS
      remainingMs = 0
    }
    if (block == BLOCK_TIMES_UP) block = null
    store.log("Sleep timer started · $minutes min", now)
    changed()
  }

  fun pauseSleep() {
    val sl = store.sleep
    if (!sl.running || sl.paused) return
    sl.remainingMs = sleepRemaining()
    sl.paused = true
    changed()
  }

  fun resumeSleep() {
    val sl = store.sleep
    if (!sl.running || !sl.paused) return
    sl.endAt = System.currentTimeMillis() + sl.remainingMs
    sl.paused = false
    changed()
  }

  fun adjustSleep(deltaMin: Int) {
    val sl = store.sleep
    if (!sl.running) return
    val next = (sleepRemaining() + deltaMin * MIN_MS).coerceAtLeast(MIN_MS)
    if (sl.paused) sl.remainingMs = next else sl.endAt = System.currentTimeMillis() + next
    changed()
  }

  fun stopSleep() {
    store.sleep.running = false
    store.sleep.paused = false
    store.log("Sleep timer stopped")
    changed()
  }

  private fun sleepEnded(now: Long) {
    store.sleep.running = false
    store.sleep.paused = false
    store.log("Sleep timer ended", now)
    showBlock(BLOCK_TIMES_UP, now, force = true)
    // Let the Time's up page come up first, so it is there when the TV wakes.
    handler.postDelayed({ turnScreenOff(System.currentTimeMillis()) }, 800)
  }

  // ---------------------------------------------------------------- grown-up mode

  fun grownActive(now: Long = System.currentTimeMillis()) = store.grownUntil > now

  fun setGrownUp(mode: String) {
    val now = System.currentTimeMillis()
    store.grownUntil = when (mode) {
      "2h" -> now + 120 * MIN_MS
      "4h" -> now + 240 * MIN_MS
      "midnight" -> Calendar.getInstance().apply {
        add(Calendar.DAY_OF_YEAR, 1)
        set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }.timeInMillis
      else -> Long.MAX_VALUE
    }
    if (block == BLOCK_BREAK || block == BLOCK_DAILY) block = null
    store.log("Grown-up mode on", now)
    changed()
  }

  fun endGrownUp() {
    if (store.grownUntil == 0L) return
    store.grownUntil = 0
    store.log("Grown-up mode off")
    changed()
  }

  // ---------------------------------------------------------------- blocks

  private fun showBlock(kind: String, now: Long, force: Boolean = false) {
    block = kind
    if (!force && now - lastBlockLaunch < 2000) return
    lastBlockLaunch = now
    pendingBlock = kind
    if (kind != BLOCK_DAILY && kind != BLOCK_BREAK) store.log("Blocked", now)
    openApp(kind)
  }

  fun takePendingBlock(): String? = pendingBlock.also { pendingBlock = null }

  fun clearBlock() {
    block = null
    pendingBlock = null
    changed()
  }

  /** Extra time from a parent: new sleep timer, or extra minutes for today. */
  fun addTime(minutes: Int, kind: String) {
    if (kind == BLOCK_TIMES_UP) {
      startSleep(minutes)
    } else {
      store.day.extraMs += minutes * MIN_MS
      store.day.breakUntil = 0
      store.log("Added $minutes min for today")
    }
    block = null
    changed()
  }

  fun skipBreak() {
    store.day.breakUntil = 0
    store.day.sessionMs = 0
    store.log("Break skipped by a grown-up")
    block = null
    changed()
  }

  /** "Continue" after a break: back into the app the kid was watching. */
  fun continueWatching(): Boolean {
    block = null
    changed()
    val pkg = store.day.lastApp ?: return false
    return launchPackage(pkg)
  }

  // ---------------------------------------------------------------- device helpers

  fun openApp(blockKind: String? = null) {
    val pm = app.packageManager
    val intent = pm.getLeanbackLaunchIntentForPackage(app.packageName)
      ?: pm.getLaunchIntentForPackage(app.packageName) ?: return
    intent.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT,
    )
    blockKind?.let { intent.putExtra(EXTRA_BLOCK, it) }
    runCatching { app.startActivity(intent) }
  }

  fun launchPackage(pkg: String): Boolean {
    val pm = app.packageManager
    val intent = pm.getLeanbackLaunchIntentForPackage(pkg) ?: pm.getLaunchIntentForPackage(pkg) ?: return false
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return runCatching { app.startActivity(intent) }.isSuccess
  }

  fun goHome() {
    val intent = Intent(Intent.ACTION_MAIN)
      .addCategory(Intent.CATEGORY_HOME)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    runCatching { app.startActivity(intent) }
  }

  /** Accessibility first, then the optional device-admin backup. */
  fun turnScreenOff(now: Long = System.currentTimeMillis()): Boolean {
    WatchService.instance?.let {
      if (it.lockScreen()) {
        store.log("Screen turned off · accessibility", now)
        return true
      }
    }
    val dpm = app.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    if (dpm.isAdminActive(adminComponent(app))) {
      runCatching { dpm.lockNow() }.onSuccess {
        store.log("Screen turned off · backup", now)
        return true
      }
    }
    return false
  }

  fun adminComponent(context: Context) = ComponentName(context, AdminReceiver::class.java)

  fun label(pkg: String): String {
    store.labels[pkg]?.let { return it }
    val name = runCatching {
      val pm = app.packageManager
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    }.getOrDefault(pkg)
    store.labels[pkg] = name
    return name
  }

  // ---------------------------------------------------------------- state out

  fun changed() {
    store.save()
    tickNowForPill()
    notifyListeners()
  }

  private fun tickNowForPill() {
    val now = System.currentTimeMillis()
    val fg = WatchService.foregroundPackage
    val grown = grownActive(now)
    val own = ownForeground(fg)
    val counted = !grown && fg != null && !own && fg in store.settings.counted
    updatePill(now, own, grown, counted, fg)
  }

  private fun notifyListeners() = listeners.toList().forEach { it() }

  fun snapshot(): Map<String, Any?> {
    val now = System.currentTimeMillis()
    val s = store.settings
    val d = store.day
    val sl = store.sleep
    val days = (6 downTo 0).map { back ->
      val key = Store.dateKey(now - back * Store.DAY_MS)
      val total = if (key == d.key) d.usedMs else store.history[key]?.optLong("total") ?: 0L
      mapOf("key" to key, "totalMs" to total.toDouble())
    }
    return mapOf(
      "now" to now.toDouble(),
      "settings" to mapOf(
        "secret" to s.secret,
        "dailyMin" to s.dailyMin,
        "sessionMin" to s.sessionMin,
        "breakMin" to s.breakMin,
        "whenUp" to s.whenUp,
        "counted" to s.counted.toList(),
        "onboarded" to s.onboarded,
      ),
      "sleep" to mapOf(
        "running" to sl.running,
        "paused" to sl.paused,
        "remainingMs" to sleepRemaining(now).toDouble(),
        "durationMin" to sl.durationMin,
      ),
      "day" to mapOf(
        "usedMs" to d.usedMs.toDouble(),
        "limitMs" to dailyLimitMs().toDouble(),
        "extraMs" to d.extraMs.toDouble(),
        "sessionMs" to d.sessionMs.toDouble(),
        "sessionLimitMs" to (s.sessionMin * MIN_MS).toDouble(),
        "breakUntil" to d.breakUntil.toDouble(),
        "lastApp" to d.lastApp,
        "lastAppLabel" to d.lastApp?.let { label(it) },
        "perApp" to d.perApp.entries.sortedByDescending { it.value }.map {
          mapOf("pkg" to it.key, "label" to label(it.key), "ms" to it.value.toDouble())
        },
      ),
      "grownUntil" to store.grownUntil.toDouble(),
      "grownActive" to grownActive(now),
      "block" to block,
      "foreground" to WatchService.foregroundPackage,
      "week" to days,
      "events" to store.events.take(60).map { mapOf("t" to it.t.toDouble(), "text" to it.text) },
    )
  }
}
