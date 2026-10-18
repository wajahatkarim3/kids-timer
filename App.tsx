import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { native } from './src/engine';
import { NavProvider, Route, useNav } from './src/nav';
import { consumeExternalReturn } from './src/relock';
import { AllSet } from './src/screens/AllSet';
import { Apps } from './src/screens/Apps';
import { AddTime, Block } from './src/screens/Block';
import { GrownUpActive, GrownUpChooser } from './src/screens/GrownUp';
import { Home } from './src/screens/Home';
import { Limits } from './src/screens/Limits';
import { LookAway } from './src/screens/LookAway';
import { ParentLock } from './src/screens/ParentLock';
import { Permission } from './src/screens/Permission';
import { Running } from './src/screens/Running';
import { SecretNumber } from './src/screens/SecretNumber';
import { SetupCheck } from './src/screens/SetupCheck';
import { Usage } from './src/screens/Usage';
import { Welcome } from './src/screens/Welcome';
import { colors } from './src/theme';

// Where opening the app lands: setup, a block the engine asked for, or the lock.
function entryRoute(): Route {
  const state = native.getState();
  if (!state.settings.onboarded) return { name: 'welcome' };
  const block = native.takePendingBlock();
  if (block) return { name: 'block', kind: block };
  return state.sleep.running
    ? { name: 'lock', reason: 'timer', then: { name: 'running' } }
    : { name: 'lock', reason: 'open', then: { name: 'home' } };
}

const ONBOARDING = new Set(['welcome', 'permOverlay', 'permA11y', 'lookAway', 'allSet']);

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <NavProvider initial={entryRoute()}>
        <Router />
      </NavProvider>
    </View>
  );
}

function Router() {
  const nav = useNav();
  const route = nav.route;
  const routeRef = useRef(route);
  routeRef.current = route;

  // The engine opens the app for blocks (break, time's up, daily limit).
  useEffect(() => {
    const check = () => {
      const block = native.takePendingBlock();
      if (block) nav.reset({ name: 'block', kind: block });
    };
    const sub = native.addListener('onState', check);
    check();
    return () => sub.remove();
  }, [nav.reset]);

  // Coming back to the app asks for the lock again — except during setup, on
  // block screens, or when returning from a settings screen we opened.
  useEffect(() => {
    let wasBackground = false;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') wasBackground = true;
      if (s !== 'active' || !wasBackground) return;
      wasBackground = false;
      if (consumeExternalReturn()) return;
      const r = routeRef.current;
      const onboarding =
        ONBOARDING.has(r.name) || ((r.name === 'secret' || r.name === 'apps') && r.onboarding);
      if (onboarding || r.name === 'block' || r.name === 'addTime') return;
      nav.reset(entryRoute());
    });
    return () => sub.remove();
  }, [nav.reset]);

  // Actions that run after a parent unlock.
  useEffect(() => {
    if (route.name !== 'skipBreak') return;
    native.skipBreak();
    if (!native.continueWatching()) native.goHome();
    nav.reset({ name: 'home' });
  }, [route, nav]);

  switch (route.name) {
    case 'welcome':
      return <Welcome />;
    case 'permOverlay':
      return <Permission kind="overlay" onNext={() => nav.push({ name: 'permA11y' })} />;
    case 'permA11y':
      return <Permission kind="accessibility" onNext={() => nav.push({ name: 'lookAway' })} />;
    case 'lookAway':
      return <LookAway />;
    case 'secret':
      return <SecretNumber onboarding={route.onboarding} />;
    case 'apps':
      return <Apps onboarding={route.onboarding} />;
    case 'allSet':
      return <AllSet />;
    case 'lock':
      return (
        <ParentLock key={JSON.stringify(route)} reason={route.reason} onUnlock={() => nav.replace(route.then)} />
      );
    case 'home':
      return <Home />;
    case 'grownUp':
      return <GrownUpChooser />;
    case 'grownUpActive':
      return <GrownUpActive />;
    case 'limits':
      return <Limits />;
    case 'usage':
      return <Usage />;
    case 'setupCheck':
      return <SetupCheck />;
    case 'running':
      return <Running />;
    case 'block':
      return <Block kind={route.kind} />;
    case 'addTime':
      return <AddTime kind={route.kind} />;
    case 'skipBreak':
      return <View style={styles.root} />;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
