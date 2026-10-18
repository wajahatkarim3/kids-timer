import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { InstalledApp } from '../../modules/kids-timer-native';
import { FocusButton } from '../components/FocusButton';
import { BackLink, ProgressDots, Screen, Subtitle, Title } from '../components/ui';
import { native, useEngine } from '../engine';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

const OWN = 'dev.shipkaro.kidstimer.firetv';

// First-run suggestion: count everything except Kids Timer and system settings.
const NEVER_COUNTED = /(^|\.)(settings|tvsettings)(\.|$)/;

function defaultCounted(apps: InstalledApp[]): string[] {
  return apps.map((a) => a.pkg).filter((p) => p !== OWN && !NEVER_COUNTED.test(p));
}

// 08 (onboarding) and 18 (App auto-start) — which apps use screen time.
export function Apps({ onboarding }: { onboarding: boolean }) {
  const nav = useNav();
  const { settings } = useEngine();
  const [apps, setApps] = useState<InstalledApp[] | null>(null);

  useEffect(() => {
    native.getInstalledApps().then((list) => {
      setApps(list);
      if (onboarding && native.getItem('appsSeeded') == null) {
        native.setItem('appsSeeded', '1');
        native.setSettings({ counted: defaultCounted(list) });
      }
    });
  }, [onboarding]);

  const counted = new Set(settings.counted);
  const toggle = (pkg: string) => {
    const next = new Set(counted);
    if (next.has(pkg)) next.delete(pkg);
    else next.add(pkg);
    native.setSettings({ counted: [...next] });
  };

  const right = onboarding ? (
    <>
      <ProgressDots step={3} />
      <FocusButton
        variant="primary"
        label="Next ▶"
        onPress={() => nav.push({ name: 'allSet' })}
        style={styles.headerNext}
        textStyle={styles.headerNextText}
      />
    </>
  ) : (
    <>
      <View style={styles.tabActive}>
        <Text style={styles.tabActiveText}>⚡ Auto-start</Text>
      </View>
      <FocusButton
        label="⏱ Limits"
        onPress={() => nav.push({ name: 'limits' })}
        style={styles.tab}
        textStyle={styles.tabText}
      />
    </>
  );

  return (
    <Screen right={right}>
      <Title style={styles.title}>Which apps count?</Title>
      {!onboarding && <Subtitle style={styles.subtitle}>Turn On the apps to limit.</Subtitle>}
      <ScrollView
        style={[styles.list, onboarding ? styles.listOnboarding : styles.listSettings]}
        contentContainerStyle={styles.listContent}
      >
        {apps?.map((app, i) => {
          const on = counted.has(app.pkg);
          return (
            <View key={app.pkg} style={styles.row}>
              <Image source={{ uri: app.icon }} style={styles.icon} />
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={1}>
                  {app.label}
                </Text>
                <Text style={styles.sub}>{on ? '⏱ Counts' : 'Free'}</Text>
              </View>
              <Toggle on={on} onPress={() => toggle(app.pkg)} preferredFocus={i === 0} />
              {!onboarding && (
                <FocusButton
                  variant="primary"
                  label="▶  Open"
                  onPress={() => native.openApp(app.pkg)}
                  style={styles.open}
                  textStyle={styles.openText}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
      {!onboarding && <BackLink label="Back to setup" onPress={() => nav.back()} />}
    </Screen>
  );
}

export function Toggle({ on, onPress, preferredFocus }: { on: boolean; onPress: () => void; preferredFocus?: boolean }) {
  return (
    <FocusButton
      variant="raised"
      onPress={onPress}
      preferredFocus={preferredFocus}
      style={styles.toggle}
      focusedStyle={styles.toggleFocused}
    >
      <Text style={[styles.toggleText, { color: on ? colors.mint : colors.textMuted }]}>
        {on ? '●' : '○'} {on ? 'On' : 'Off'}
      </Text>
    </FocusButton>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'left', fontSize: px(64), lineHeight: px(80), marginTop: px(50) },
  subtitle: { textAlign: 'left', fontSize: px(34), marginTop: px(4) },
  list: { marginHorizontal: -px(12) },
  listOnboarding: { marginTop: px(36), marginBottom: px(40) },
  listSettings: { marginTop: px(32), marginBottom: px(130) },
  listContent: { gap: px(20), padding: px(12) },
  row: {
    height: px(118),
    borderRadius: px(28),
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: px(34),
    paddingRight: px(26),
    gap: px(16),
  },
  icon: { width: px(80), height: px(80), borderRadius: px(16) },
  rowText: { flex: 1, marginLeft: px(24) },
  name: { fontFamily: fonts.heavy, fontSize: px(40), color: colors.text },
  sub: { fontFamily: fonts.bold, fontSize: px(30), color: colors.textMuted },
  toggle: { width: px(152), height: px(78), minHeight: 0, borderRadius: px(39), paddingHorizontal: 0 },
  toggleFocused: { width: px(164), height: px(88), borderRadius: px(44) },
  toggleText: { fontFamily: fonts.heavy, fontSize: px(36) },
  open: { width: px(166), height: px(74), minHeight: 0, borderRadius: px(37), paddingHorizontal: 0 },
  openText: { fontSize: px(34) },
  headerNext: { height: px(74), minHeight: 0, borderRadius: px(37), paddingHorizontal: px(40), marginLeft: px(36) },
  headerNextText: { fontSize: px(36) },
  tabActive: {
    height: px(58),
    borderRadius: px(29),
    paddingHorizontal: px(30),
    backgroundColor: colors.mintChip,
    justifyContent: 'center',
  },
  tabActiveText: { fontFamily: fonts.heavy, fontSize: px(32), color: colors.mint },
  tab: { height: px(70), minHeight: 0, borderRadius: px(35), paddingHorizontal: px(30) },
  tabText: { fontSize: px(32) },
});
