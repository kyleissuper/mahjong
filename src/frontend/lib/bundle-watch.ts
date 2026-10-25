// A phone can keep this tab open across deploys for weeks. Its bundle then
// previews hands with old rules while the server records them with new ones
// (seen in prod: a client from before the Aug 25 rule change showed 5 pts for
// a hand the server stored at 8). Vite hashes the bundle filename, so the app
// shell tells us whether we are current: re-fetch it at the natural moments
// and reload when the name changes. A reload is held while a hand is being
// entered so nobody loses their tiles mid-round.

const BUNDLE_RE = /\/assets\/index-[\w-]+\.js/;

export interface BundleWatchDeps {
  doc?: Document;
  win?: Window;
  fetch?: typeof fetch;
  reload?: () => void;
  intervalMs?: number;
}

let currentBundle: string | null = null;
let busy = false;
let pendingReload = false;
let inFlight: Promise<void> | null = null;
let reload: () => void = () => location.reload();
let fetchShell: typeof fetch = (...args) => fetch(...args);

export function bundleFromHtml(html: string): string | null {
  return html.match(BUNDLE_RE)?.[0] ?? null;
}

function loadedBundle(doc: Document): string | null {
  for (const script of Array.from(doc.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'))) {
    const found = bundleFromHtml(script.getAttribute('src') ?? '');
    if (found) return found;
  }
  return null;
}

/** Scorer marks itself busy while tiles are on the board; a pending reload waits. */
export function setBundleWatchBusy(value: boolean): void {
  busy = value;
  if (!busy && pendingReload) {
    pendingReload = false;
    reload();
  }
}

/** Compare the served shell's bundle to ours and reload (or queue one) if it moved. */
export function checkBundle(): Promise<void> {
  if (!currentBundle || inFlight) return inFlight ?? Promise.resolve();
  inFlight = (async () => {
    try {
      const res = await fetchShell('/', { cache: 'no-store', headers: { accept: 'text/html' } });
      if (!res.ok) return;
      const latest = bundleFromHtml(await res.text());
      if (!latest || latest === currentBundle) return;
      if (busy) pendingReload = true;
      else reload();
    } catch {
      // Offline or flaky network: try again at the next trigger.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * Start watching. No-op in dev and tests, where the shell has no hashed bundle.
 * Returns a stop function.
 */
export function startBundleWatch(deps: BundleWatchDeps = {}): () => void {
  const doc = deps.doc ?? document;
  const win = deps.win ?? window;
  if (deps.fetch) fetchShell = deps.fetch;
  if (deps.reload) reload = deps.reload;
  currentBundle = loadedBundle(doc);
  busy = false;
  pendingReload = false;
  if (!currentBundle) return () => {};

  const onVisible = () => { if (doc.visibilityState === 'visible') void checkBundle(); };
  const onFocus = () => { void checkBundle(); };
  // bfcache restores skip the normal load, so an old page can resurface intact.
  const onPageShow = () => { void checkBundle(); };
  doc.addEventListener('visibilitychange', onVisible);
  win.addEventListener('focus', onFocus);
  win.addEventListener('pageshow', onPageShow);
  const timer = win.setInterval(() => {
    if (doc.visibilityState === 'visible') void checkBundle();
  }, deps.intervalMs ?? 5 * 60 * 1000);

  return () => {
    doc.removeEventListener('visibilitychange', onVisible);
    win.removeEventListener('focus', onFocus);
    win.removeEventListener('pageshow', onPageShow);
    win.clearInterval(timer);
    currentBundle = null;
  };
}
