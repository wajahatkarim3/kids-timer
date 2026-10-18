import { StyleSheet, Text, View } from 'react-native';
import type { BlockKind } from '../../modules/kids-timer-native';
import { FocusButton } from '../components/FocusButton';
import { BlockScreen, Emoji, Title } from '../components/ui';
import { native, useEngine } from '../engine';
import { shortClock } from '../format';
import { useBack, useNav } from '../nav';
import { colors, fonts, px } from '../theme';

// 28, 31, 32, 33 — full-screen blocks. Back never returns to the blocked app;
// it goes to the TV home screen instead.
export function Block({ kind }: { kind: BlockKind }) {
  const nav = useNav();
  const state = useEngine();
  useBack(() => {
    native.goHome();
    return true;
  });

  const finish = () => {
    native.clearBlock();
    native.goHome();
  };
  const addTime = () => nav.push({ name: 'lock', reason: 'addTime', then: { name: 'addTime', kind } });

  if (kind === 'break') {
    const left = state.day.breakUntil - state.now;
    if (left > 0) {
      return (
        <BlockScreen>
          <Emoji size={160}>☕</Emoji>
          <Title style={styles.title}>Take a break</Title>
          <Text style={styles.sub}>Stretch, grab a drink. Back in {shortClock(left)}</Text>
          <View style={styles.row}>
            <FocusButton
              preferredFocus
              label={`Wait ${shortClock(left)}`}
              onPress={() => native.goHome()}
              style={styles.wait}
              textStyle={styles.btnText}
            />
            <FocusButton
              label="Skip break"
              onPress={() =>
                nav.push({ name: 'lock', reason: 'open', then: { name: 'skipBreak' } })
              }
              style={styles.skip}
              textStyle={styles.btnText}
            />
          </View>
          <Text style={styles.hint}>🔒 Skipping needs a grown-up</Text>
        </BlockScreen>
      );
    }
    return (
      <BlockScreen>
        <Emoji size={160}>☕</Emoji>
        <Title style={styles.title}>Take a break</Title>
        <Text style={[styles.sub, { color: colors.mint }]}>Ready when you are.</Text>
        <View style={styles.row}>
          <FocusButton
            variant="primary"
            preferredFocus
            onPress={() => {
              if (!native.continueWatching()) native.goHome();
            }}
            style={styles.continue}
          >
            <Text style={styles.continueText}>▶   Continue</Text>
          </FocusButton>
          <FocusButton label="Done for now" onPress={finish} style={styles.doneNow} textStyle={styles.btnText} />
        </View>
      </BlockScreen>
    );
  }

  const timesUp = kind === 'timesUp';
  return (
    <BlockScreen>
      <Emoji size={160}>🌙</Emoji>
      <Title style={styles.title}>{timesUp ? "Time's up" : "That's all for today"}</Title>
      <Text style={styles.sub}>
        {timesUp ? 'Great watching! See you next time.' : "You used all of today's screen time. See you tomorrow!"}
      </Text>
      <View style={styles.row}>
        <FocusButton
          variant="primary"
          preferredFocus
          label={timesUp ? 'Done' : 'Done for today'}
          onPress={finish}
          style={styles.done}
          textStyle={styles.btnText}
        />
        <FocusButton label="Add time" onPress={addTime} style={styles.add} textStyle={styles.btnText} />
      </View>
      <Text style={styles.hint}>🔒 Adding time needs a grown-up</Text>
    </BlockScreen>
  );
}

const PICKS = [15, 30, 45];

// 30 — after the parent lock: how much more time.
export function AddTime({ kind }: { kind: BlockKind }) {
  const nav = useNav();
  useBack(() => {
    nav.reset({ name: 'block', kind });
    return true;
  });

  return (
    <BlockScreen>
      <View style={styles.card}>
        <Emoji size={100}>⏳</Emoji>
        <Title style={styles.cardTitle}>How much more?</Title>
        <Text style={styles.cardSub}>{kind === 'timesUp' ? 'Starts a new timer.' : 'Extra time for today.'}</Text>
        <View style={styles.picks}>
          {PICKS.map((m, i) => (
            <FocusButton
              key={m}
              variant="amber"
              preferredFocus={i === 0}
              label={`+${m}`}
              onPress={() => {
                native.addTime(m, kind);
                nav.reset({ name: 'home' });
                native.goHome();
              }}
              style={styles.pick}
              textStyle={styles.pickText}
            />
          ))}
        </View>
        <FocusButton
          label="Cancel"
          onPress={() => nav.reset({ name: 'block', kind })}
          style={styles.cancel}
          textStyle={styles.btnText}
        />
        <Text style={styles.hint}>🔒 Unlocked by a grown-up</Text>
      </View>
    </BlockScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: px(96), lineHeight: px(120), marginTop: px(30) },
  sub: { fontFamily: fonts.bold, fontSize: px(40), color: colors.textMuted, marginTop: px(16), textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: px(24), marginTop: px(54) },
  btnText: { fontSize: px(42) },
  wait: { height: px(104), borderRadius: px(52), paddingHorizontal: px(70) },
  skip: { height: px(96), borderRadius: px(48), paddingHorizontal: px(64) },
  continue: { width: px(504), height: px(138), borderRadius: px(36) },
  continueText: { fontFamily: fonts.heavy, fontSize: px(46), color: colors.onMint },
  doneNow: { width: px(400), height: px(128), borderRadius: px(36) },
  done: { height: px(108), borderRadius: px(54), paddingHorizontal: px(72) },
  add: { height: px(96), borderRadius: px(48), paddingHorizontal: px(80) },
  hint: { fontFamily: fonts.bold, fontSize: px(30), color: colors.textMuted, marginTop: px(40) },
  card: {
    width: px(1000),
    borderRadius: px(48),
    borderWidth: px(3),
    borderColor: colors.amberBorder,
    backgroundColor: '#0F1614',
    alignItems: 'center',
    paddingVertical: px(52),
    paddingHorizontal: px(72),
  },
  cardTitle: { fontSize: px(72), lineHeight: px(90), marginTop: px(16) },
  cardSub: { fontFamily: fonts.heavy, fontSize: px(38), color: colors.amber, marginTop: px(16) },
  picks: { flexDirection: 'row', gap: px(28), marginTop: px(32), alignSelf: 'stretch' },
  pick: { flex: 1, height: px(124), borderRadius: px(36) },
  pickText: { fontSize: px(50) },
  cancel: { alignSelf: 'stretch', height: px(92), borderRadius: px(32), marginTop: px(20) },
});
