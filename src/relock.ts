// "Opening the app always asks for the lock first." Leaving for a system
// settings screen we opened ourselves is not "opening the app" again, so those
// trips are marked here and skip the re-lock once.

let expecting = false;

export function expectExternalReturn() {
  expecting = true;
}

export function consumeExternalReturn(): boolean {
  const was = expecting;
  expecting = false;
  return was;
}
