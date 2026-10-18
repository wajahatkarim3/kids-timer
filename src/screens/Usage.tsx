import { StyleSheet, Text, View } from 'react-native';
import { BackLink, Emoji, Screen } from '../components/ui';
import { useEngine } from '../engine';
import { minutesLabel, msToMin, timeOfDay, weekday } from '../format';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

const CHART_H = 150;
const RECENT_ROWS = 5;

// 20 — today vs. allowance, per app, last 7 days and a recent feed.
export function Usage() {
  const nav = useNav();
  const { day, week, events } = useEngine();
  const usedMin = msToMin(day.usedMs);
  const limitMin = msToMin(day.limitMs);
  const full = day.usedMs >= day.limitMs;
  const maxApp = Math.max(1, ...day.perApp.map((a) => a.ms));
  const maxDay = Math.max(1, ...week.map((d) => d.totalMs));

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Emoji size={66}>📊</Emoji>
        <Text style={styles.title}>Usage</Text>
      </View>
      <Text style={styles.sub}>On this TV only</Text>

      <View style={styles.columns}>
        <View style={styles.left}>
          <Text style={styles.label}>TODAY</Text>
          <Text style={styles.today}>
            {minutesLabel(usedMin)} of {minutesLabel(limitMin)}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, (day.usedMs / Math.max(1, day.limitMs)) * 100)}%` },
                full && { backgroundColor: colors.amber },
              ]}
            />
          </View>
          {day.perApp.slice(0, 5).map((a) => (
            <View key={a.pkg} style={styles.appRow}>
              <Text style={styles.appName} numberOfLines={1}>
                {a.label}
              </Text>
              <View style={styles.appTrack}>
                <View style={[styles.appFill, { width: `${(a.ms / maxApp) * 100}%` }]} />
              </View>
              <Text style={styles.appMin}>{minutesLabel(msToMin(a.ms))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.right}>
          <Text style={styles.label}>LAST 7 DAYS</Text>
          <View style={styles.chart}>
            {week.map((d) => {
              const min = msToMin(d.totalMs);
              const h = d.totalMs > 0 ? Math.max(6, (d.totalMs / maxDay) * CHART_H) : 6;
              return (
                <View key={d.key} style={styles.barCol}>
                  <Text style={styles.barValue}>{min > 0 ? min : ''}</Text>
                  <View style={styles.barArea}>
                    <View style={[styles.bar, { height: px(h) }]} />
                  </View>
                  <Text style={styles.barDay} numberOfLines={1}>
                    {weekday(d.key)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={[styles.label, styles.recentLabel]}>RECENT</Text>
          {events.slice(0, RECENT_ROWS).map((e, i) => (
            <View key={`${e.t}-${i}`} style={styles.eventRow}>
              <Text style={styles.eventTime}>{timeOfDay(e.t)}</Text>
              <Text style={styles.eventText} numberOfLines={1}>
                {e.text}
              </Text>
            </View>
          ))}
          {events.length === 0 && <Text style={styles.eventEmpty}>Nothing yet today.</Text>}
        </View>
      </View>
      <BackLink label="Back to setup" onPress={() => nav.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: px(46) },
  title: { fontFamily: fonts.heavy, fontSize: px(64), color: colors.text, marginLeft: px(20) },
  sub: { fontFamily: fonts.bold, fontSize: px(34), color: colors.textMuted },
  columns: { flexDirection: 'row', marginTop: px(32), gap: px(96) },
  left: { width: px(816) },
  right: { flex: 1 },
  label: { fontFamily: fonts.heavy, fontSize: px(30), color: colors.textMuted, letterSpacing: px(1) },
  today: { fontFamily: fonts.heavy, fontSize: px(76), color: colors.mint, marginTop: px(8) },
  track: { height: px(28), borderRadius: px(14), backgroundColor: colors.surface, marginTop: px(18), overflow: 'hidden' },
  fill: { height: '100%', borderRadius: px(14), backgroundColor: colors.mint },
  appRow: { flexDirection: 'row', alignItems: 'center', marginTop: px(40), gap: px(16) },
  appName: { flexShrink: 1, maxWidth: px(420), fontFamily: fonts.heavy, fontSize: px(36), color: colors.text },
  appTrack: { flex: 1, minWidth: px(160), height: px(20), borderRadius: px(10), backgroundColor: colors.surface },
  appFill: { height: '100%', borderRadius: px(10), backgroundColor: colors.mint },
  appMin: { width: px(170), textAlign: 'right', fontFamily: fonts.bold, fontSize: px(34), color: colors.textMuted },
  chart: { flexDirection: 'row', gap: px(28), marginTop: px(16) },
  barCol: { width: px(80), alignItems: 'center' },
  barValue: {
    height: px(34),
    lineHeight: px(34),
    fontFamily: fonts.bold,
    fontSize: px(26),
    color: colors.textMuted,
  },
  barArea: { height: px(CHART_H), justifyContent: 'flex-end' },
  bar: { width: px(52), borderRadius: px(10), backgroundColor: colors.mint },
  barDay: {
    height: px(40),
    lineHeight: px(40),
    fontFamily: fonts.bold,
    fontSize: px(30),
    color: colors.textMuted,
    marginTop: px(6),
  },
  recentLabel: { marginTop: px(30) },
  eventRow: { flexDirection: 'row', height: px(42), alignItems: 'center' },
  eventTime: { width: px(160), fontFamily: fonts.regular, fontSize: px(31), color: colors.textMuted },
  eventText: { flex: 1, fontFamily: fonts.bold, fontSize: px(31), color: colors.text },
  eventEmpty: { fontFamily: fonts.bold, fontSize: px(32), color: colors.textMuted, marginTop: px(8) },
});
