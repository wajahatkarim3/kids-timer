import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { Chip, Screen } from '../components/ui';
import { native, useEngine } from '../engine';
import { LockReason } from '../nav';
import { colors, fonts, px } from '../theme';

const BADGES: Record<LockReason, string> = {
  open: '🔒 Grown-ups only',
  timer: '🔒 Grown-ups: change the timer',
  addTime: '🔒 Parents: add more time',
};

const TRIES = 3;
const BASE_LOCKOUT_MS = 30_000;

type LockState = { fails: number; until: number; level: number };

function loadLock(): LockState {
  try {
    return { fails: 0, until: 0, level: 0, ...JSON.parse(native.getItem('lock') ?? '{}') };
  } catch {
    return { fails: 0, until: 0, level: 0 };
  }
}

function saveLock(s: LockState) {
  native.setItem('lock', JSON.stringify(s));
}

function newQuestion(): [number, number] {
  const r = () => 2 + Math.floor(Math.random() * 18); // 2..19
  return [r(), r()];
}

// 10–12, 25, 29 — "What is the sum of A and B?" Answer is A + B + secret.
// Lockout state is saved natively, so closing the app doesn't reset it.
export function ParentLock({ reason, onUnlock }: { reason: LockReason; onUnlock: () => void }) {
  const { settings } = useEngine();
  const [[a, b], setQ] = useState(newQuestion);
  const [input, setInput] = useState('');
  const [lock, setLock] = useState(loadLock);
  const [wrong, setWrong] = useState(false);
  const [now, setNow] = useState(Date.now());

  const lockedMs = lock.until - now;
  const locked = lockedMs > 0;

  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [locked]);

  const update = (s: LockState) => {
    setLock(s);
    saveLock(s);
  };

  const press = useCallback(
    (digit: number) => {
      if (Date.now() < lock.until) return;
      setInput((v) => (v.length >= 3 ? v : v + digit));
    },
    [lock.until],
  );

  const enter = () => {
    const t = Date.now();
    setNow(t);
    if (t < lock.until || input === '') return;
    if (Number(input) === a + b + settings.secret) {
      update({ fails: 0, until: 0, level: 0 });
      onUnlock();
      return;
    }
    const fails = lock.fails + 1;
    if (fails >= TRIES) {
      const level = lock.level + 1;
      update({ fails: 0, level, until: t + BASE_LOCKOUT_MS * 2 ** (level - 1) });
    } else {
      update({ ...lock, fails });
    }
    setWrong(true);
    setInput('');
    setQ(newQuestion());
  };
  const enterRef = useRef(enter);
  enterRef.current = enter;

  // Number keys on the remote.
  useEffect(() => {
    const sub = native.addListener('onDigit', (e) => press(e.digit));
    return () => sub.remove();
  }, [press]);

  const triesLeft = TRIES - lock.fails;
  let message = 'Ask a grown-up — they know the secret 😊';
  if (locked) message = `Too many tries — wait ${Math.ceil(lockedMs / 1000)}s ⏳`;
  else if (wrong) message = `Not quite — ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left`;
  const warn = locked || wrong;

  const keys: (number | 'clear' | 'enter')[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'enter'];

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.left}>
          <Chip tone="amber">{BADGES[reason]}</Chip>
          <Text style={styles.question}>
            What is the sum of {a} and {b}?
          </Text>
          <View style={[styles.input, warn && styles.inputWarn]}>
            <Text style={styles.inputText}>{input}</Text>
          </View>
          <Text style={[styles.hint, warn && styles.hintWarn]}>{message}</Text>
        </View>
        <View style={styles.pad}>
          {keys.map((k) => (
            <FocusButton
              key={String(k)}
              variant={k === 'enter' ? 'primary' : 'secondary'}
              preferredFocus={k === 5}
              onPress={() => (k === 'clear' ? setInput('') : k === 'enter' ? enterRef.current() : press(k))}
              style={styles.key}
              focusedStyle={k === 'enter' ? undefined : styles.keyFocused}
              label={k === 'clear' ? 'Clear' : k === 'enter' ? 'Enter' : String(k)}
              textStyle={
                k === 'clear'
                  ? styles.clearText
                  : k === 'enter'
                    ? styles.enterText
                    : styles.digitText
              }
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const KEY_W = 224;
const KEY_H = 160;
const GAP = 26;

const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  left: { width: px(908), justifyContent: 'center', paddingBottom: px(150) },
  question: {
    fontFamily: fonts.heavy,
    fontSize: px(72),
    lineHeight: px(86),
    color: colors.text,
    marginTop: px(34),
  },
  input: {
    height: px(140),
    borderRadius: px(40),
    borderWidth: px(4),
    borderColor: colors.inputBorder,
    backgroundColor: '#0F1715',
    marginTop: px(34),
    justifyContent: 'center',
    paddingHorizontal: px(44),
  },
  inputWarn: { borderColor: colors.amberBorder },
  inputText: { fontFamily: fonts.heavy, fontSize: px(64), color: colors.text, letterSpacing: px(8) },
  hint: { fontFamily: fonts.bold, fontSize: px(32), color: colors.textMuted, marginTop: px(34) },
  hintWarn: { color: colors.amber },
  pad: {
    width: px(KEY_W * 3 + GAP * 2),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: px(GAP),
    marginTop: px(78),
    alignSelf: 'flex-start',
  },
  key: {
    width: px(KEY_W),
    height: px(KEY_H),
    borderRadius: px(32),
    paddingHorizontal: 0,
  },
  keyFocused: { transform: [{ scale: 1.08 }] },
  digitText: { fontSize: px(72), lineHeight: px(86) },
  clearText: { fontSize: px(44), color: colors.amber },
  enterText: { fontSize: px(44) },
});
