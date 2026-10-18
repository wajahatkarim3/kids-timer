package dev.shipkaro.kidstimer.firetv.core

import android.view.KeyEvent
import android.view.Window

/**
 * Wraps the activity's window callback so number keys on the remote reach JS
 * (react-native-tvos only forwards D-pad and media keys).
 */
class DigitKeyCallback(
  private val base: Window.Callback,
  private val onDigit: (Int) -> Unit,
) : Window.Callback by base {
  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    val digit = when (event.keyCode) {
      in KeyEvent.KEYCODE_0..KeyEvent.KEYCODE_9 -> event.keyCode - KeyEvent.KEYCODE_0
      in KeyEvent.KEYCODE_NUMPAD_0..KeyEvent.KEYCODE_NUMPAD_9 -> event.keyCode - KeyEvent.KEYCODE_NUMPAD_0
      else -> return base.dispatchKeyEvent(event)
    }
    if (event.action == KeyEvent.ACTION_DOWN) onDigit(digit)
    return true
  }
}
