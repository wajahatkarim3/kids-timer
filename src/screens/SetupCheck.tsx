import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { BackLink, Emoji, Screen } from '../components/ui';
import { native } from '../engine';
import { usePermissions } from '../hooks/usePermissions';
import { useNav } from '../nav';
import { expectExternalReturn } from '../relock';
import { colors, fonts, px } from '../theme';

// 21 — each permission, its state, and a button to the matching setting.
export function SetupCheck() {
  const nav = useNav();
  const perms = usePermissions();
  const open = (fn: () => boolean) => () => {
    expectExternalReturn();
    fn();
  };

  const rows = [
    { emoji: '📺', title: 'Timer over apps', on: perms.overlay, action: open(native.openOverlaySettings), cta: 'Settings' },
    { emoji: '👀', title: 'Spot the app + TV off', on: perms.accessibility, action: open(native.openAccessibilitySettings), cta: 'Settings' },
    {
      emoji: '🔌',
      title: 'Backup TV off (optional)',
      on: perms.admin,
      action: perms.admin ? () => native.removeAdmin() : open(native.requestAdmin),
      cta: perms.admin ? 'Turn off' : 'Turn on',
    },
  ];

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Emoji size={66}>🛡️</Emoji>
        <Text style={styles.title}>Setup check</Text>
      </View>
      <Text style={styles.sub}>Turn these on once.</Text>
      <View style={styles.rows}>
        {rows.map((r, i) => (
          <View key={r.title} style={styles.row}>
            <View style={styles.rowText}>
              <View style={styles.rowTitleLine}>
                <Emoji size={44}>{r.emoji}</Emoji>
                <Text style={styles.rowTitle}>{r.title}</Text>
              </View>
              <Text style={styles.rowStatus}>{r.on ? '✓ On' : '● Off'}</Text>
            </View>
            <FocusButton
              variant={r.on || r.cta === 'Settings' ? 'raised' : 'primary'}
              label={r.cta}
              preferredFocus={i === 0}
              onPress={r.action}
              style={styles.button}
              textStyle={styles.buttonText}
            />
          </View>
        ))}
      </View>
      <BackLink label="Back to setup" onPress={() => nav.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: px(46) },
  title: { fontFamily: fonts.heavy, fontSize: px(64), color: colors.text, marginLeft: px(20) },
  sub: { fontFamily: fonts.bold, fontSize: px(34), color: colors.textMuted },
  rows: { marginTop: px(44), gap: px(22) },
  row: {
    height: px(118),
    borderRadius: px(28),
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: px(34),
  },
  rowText: { flex: 1 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontFamily: fonts.heavy, fontSize: px(40), color: colors.text, marginLeft: px(22) },
  rowStatus: { fontFamily: fonts.bold, fontSize: px(30), color: colors.textMuted },
  button: { height: px(78), minHeight: 0, borderRadius: px(39), paddingHorizontal: px(40) },
  buttonText: { fontSize: px(36) },
});
