package dev.shipkaro.kidstimer.firetv.core

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream

/** Installed TV apps with their icons, for the "Which apps count?" list. */
object AppsRepo {
  private val iconCache = mutableMapOf<String, String>()

  // System settings never make sense as a "counted" app.
  private val HIDDEN = listOf("com.android.tv.settings", "com.amazon.tv.settings", "com.android.settings")

  fun installed(context: Context): List<Map<String, Any?>> {
    val pm = context.packageManager
    val seen = linkedMapOf<String, Map<String, Any?>>()
    // Only real TV apps (leanback launcher entry); phone-style launcher
    // entries are system leftovers like "Third Party Notices".
    val query = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
    for (info in pm.queryIntentActivities(query, 0)) {
      val pkg = info.activityInfo.packageName
      // Kids Timer itself never counts, so it isn't listed.
      if (pkg in seen || pkg == context.packageName || HIDDEN.any { pkg.startsWith(it) }) continue
      val label = info.loadLabel(pm).toString()
      val icon = iconCache.getOrPut(pkg) { encode(info.loadIcon(pm)) }
      seen[pkg] = mapOf("pkg" to pkg, "label" to label, "icon" to icon)
    }
    return seen.values.sortedBy { (it["label"] as String).lowercase() }
  }

  private fun encode(drawable: Drawable, size: Int = 96): String {
    val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    drawable.setBounds(0, 0, size, size)
    drawable.draw(canvas)
    val out = ByteArrayOutputStream()
    bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
    return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }
}
