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

  fun installed(context: Context): List<Map<String, Any?>> {
    val pm = context.packageManager
    val seen = linkedMapOf<String, Map<String, Any?>>()
    for (category in listOf(Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER)) {
      val query = Intent(Intent.ACTION_MAIN).addCategory(category)
      for (info in pm.queryIntentActivities(query, 0)) {
        val pkg = info.activityInfo.packageName
        if (pkg in seen) continue
        val label = info.loadLabel(pm).toString()
        val icon = iconCache.getOrPut(pkg) { encode(info.loadIcon(pm)) }
        seen[pkg] = mapOf("pkg" to pkg, "label" to label, "icon" to icon)
      }
    }
    // Our own app first (as in the design), then A-Z.
    return seen.values.sortedWith(
      compareBy<Map<String, Any?>> { it["pkg"] != context.packageName }
        .thenBy { (it["label"] as String).lowercase() },
    )
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
