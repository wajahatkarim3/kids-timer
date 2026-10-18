package dev.shipkaro.kidstimer.firetv.core

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Parent-controlled settings. Saved instantly on every change. */
data class Settings(
  var secret: Int = 17,
  var dailyMin: Int = 120,
  var sessionMin: Int = 30,
  var breakMin: Int = 10,
  var whenUp: String = "block", // "block" | "off"
  var counted: MutableSet<String> = mutableSetOf(),
  var onboarded: Boolean = false,
)

data class SleepTimer(
  var running: Boolean = false,
  var paused: Boolean = false,
  var endAt: Long = 0,
  var remainingMs: Long = 0,
  var durationMin: Int = 0,
)

/** Today's shared screen-time pool. Reset at local midnight. */
data class Day(
  var key: String = "",
  var usedMs: Long = 0,
  var extraMs: Long = 0,
  var sessionMs: Long = 0,
  var breakUntil: Long = 0,
  var lastApp: String? = null,
  var perApp: MutableMap<String, Long> = mutableMapOf(),
)

data class Event(val t: Long, val text: String)

/** SharedPreferences-backed state, so the engine works while the RN app is closed. */
class Store(context: Context) {
  private val prefs: SharedPreferences =
    context.getSharedPreferences("kids_timer", Context.MODE_PRIVATE)

  val settings = Settings()
  val sleep = SleepTimer()
  val day = Day()
  var grownUntil: Long = 0
  /** dateKey -> { total: ms, apps: { pkg: ms } }, kept for 14 days. */
  val history = mutableMapOf<String, JSONObject>()
  val events = ArrayDeque<Event>()
  val labels = mutableMapOf<String, String>()

  init {
    load()
  }

  // ---- generic strings for JS-owned state (parent-lock lockout etc.) ----

  fun getItem(key: String): String? = prefs.getString("js:$key", null)

  fun setItem(key: String, value: String?) {
    prefs.edit().apply { if (value == null) remove("js:$key") else putString("js:$key", value) }.apply()
  }

  // ---- events / history ----

  fun log(text: String, now: Long = System.currentTimeMillis()) {
    events.addFirst(Event(now, text))
    val cutoff = now - HISTORY_DAYS * DAY_MS
    while (events.size > MAX_EVENTS || (events.lastOrNull()?.t ?: now) < cutoff) events.removeLast()
    save()
  }

  fun archiveDay() {
    if (day.key.isEmpty()) return
    history[day.key] = JSONObject().apply {
      put("total", day.usedMs)
      put("apps", JSONObject(day.perApp as Map<*, *>))
    }
    val keep = history.keys.sortedDescending().take(HISTORY_DAYS)
    history.keys.retainAll(keep.toSet())
  }

  // ---- persistence ----

  fun save() {
    val s = JSONObject().apply {
      put("secret", settings.secret)
      put("dailyMin", settings.dailyMin)
      put("sessionMin", settings.sessionMin)
      put("breakMin", settings.breakMin)
      put("whenUp", settings.whenUp)
      put("counted", JSONArray(settings.counted.toList()))
      put("onboarded", settings.onboarded)
    }
    val sl = JSONObject().apply {
      put("running", sleep.running)
      put("paused", sleep.paused)
      put("endAt", sleep.endAt)
      put("remainingMs", sleep.remainingMs)
      put("durationMin", sleep.durationMin)
    }
    val d = JSONObject().apply {
      put("key", day.key)
      put("usedMs", day.usedMs)
      put("extraMs", day.extraMs)
      put("sessionMs", day.sessionMs)
      put("breakUntil", day.breakUntil)
      put("lastApp", day.lastApp ?: JSONObject.NULL)
      put("perApp", JSONObject(day.perApp as Map<*, *>))
    }
    val ev = JSONArray().apply {
      events.forEach { put(JSONObject().put("t", it.t).put("text", it.text)) }
    }
    prefs.edit()
      .putString("settings", s.toString())
      .putString("sleep", sl.toString())
      .putString("day", d.toString())
      .putLong("grownUntil", grownUntil)
      .putString("history", JSONObject(history as Map<*, *>).toString())
      .putString("events", ev.toString())
      .putString("labels", JSONObject(labels as Map<*, *>).toString())
      .apply()
  }

  private fun load() {
    prefs.getString("settings", null)?.let {
      val o = JSONObject(it)
      settings.secret = o.optInt("secret", 17)
      settings.dailyMin = o.optInt("dailyMin", 120)
      settings.sessionMin = o.optInt("sessionMin", 30)
      settings.breakMin = o.optInt("breakMin", 10)
      settings.whenUp = o.optString("whenUp", "block")
      settings.onboarded = o.optBoolean("onboarded", false)
      val arr = o.optJSONArray("counted") ?: JSONArray()
      settings.counted = (0 until arr.length()).map { i -> arr.getString(i) }.toMutableSet()
    }
    prefs.getString("sleep", null)?.let {
      val o = JSONObject(it)
      sleep.running = o.optBoolean("running")
      sleep.paused = o.optBoolean("paused")
      sleep.endAt = o.optLong("endAt")
      sleep.remainingMs = o.optLong("remainingMs")
      sleep.durationMin = o.optInt("durationMin")
    }
    prefs.getString("day", null)?.let {
      val o = JSONObject(it)
      day.key = o.optString("key")
      day.usedMs = o.optLong("usedMs")
      day.extraMs = o.optLong("extraMs")
      day.sessionMs = o.optLong("sessionMs")
      day.breakUntil = o.optLong("breakUntil")
      day.lastApp = if (o.isNull("lastApp")) null else o.optString("lastApp")
      day.perApp = o.optJSONObject("perApp").toLongMap()
    }
    grownUntil = prefs.getLong("grownUntil", 0)
    prefs.getString("history", null)?.let {
      val o = JSONObject(it)
      o.keys().forEach { k -> history[k] = o.getJSONObject(k) }
    }
    prefs.getString("events", null)?.let {
      val arr = JSONArray(it)
      for (i in 0 until arr.length()) {
        val e = arr.getJSONObject(i)
        events.addLast(Event(e.getLong("t"), e.getString("text")))
      }
    }
    prefs.getString("labels", null)?.let {
      val o = JSONObject(it)
      o.keys().forEach { k -> labels[k] = o.getString(k) }
    }
  }

  companion object {
    const val DAY_MS = 24L * 60 * 60 * 1000
    const val HISTORY_DAYS = 14
    const val MAX_EVENTS = 300

    fun dateKey(t: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(t))
  }
}

fun JSONObject?.toLongMap(): MutableMap<String, Long> {
  val out = mutableMapOf<String, Long>()
  this ?: return out
  keys().forEach { k -> out[k] = optLong(k) }
  return out
}
