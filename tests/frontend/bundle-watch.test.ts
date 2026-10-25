import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startBundleWatch, checkBundle, setBundleWatchBusy, bundleFromHtml } from '../../src/frontend/lib/bundle-watch.ts';

const OLD = '/assets/index-OLD11111.js';
const NEW = '/assets/index-NEW22222.js';

function shell(bundle: string) {
  return `<!DOCTYPE html><html><body><script type="module" src="${bundle}"></script></body></html>`;
}

function loadScript(bundle: string | null) {
  document.body.innerHTML = '';
  if (bundle) {
    const s = document.createElement('script');
    s.type = 'module';
    s.setAttribute('src', bundle);
    document.body.appendChild(s);
  }
}

describe('bundle watch', () => {
  let stop: () => void = () => {};
  let reload: ReturnType<typeof vi.fn<() => void>>;
  let served: string | null;
  const fetchShell = vi.fn(async () => ({
    ok: served !== null,
    text: async () => (served ? shell(served) : ''),
  })) as unknown as typeof fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    reload = vi.fn<() => void>();
    served = OLD;
  });
  afterEach(() => { stop(); vi.useRealTimers(); });

  it('extracts the hashed bundle name from the shell', () => {
    expect(bundleFromHtml(shell(OLD))).toBe(OLD);
    expect(bundleFromHtml('<html></html>')).toBeNull();
  });

  it('does nothing when the page has no hashed bundle (dev, tests)', async () => {
    loadScript(null);
    stop = startBundleWatch({ fetch: fetchShell, reload });
    await checkBundle();
    expect(fetchShell).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('leaves a current page alone', async () => {
    loadScript(OLD);
    stop = startBundleWatch({ fetch: fetchShell, reload });
    await checkBundle();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads when the served bundle moves on', async () => {
    loadScript(OLD);
    stop = startBundleWatch({ fetch: fetchShell, reload });
    served = NEW;
    await checkBundle();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('bypasses the HTTP cache when re-fetching the shell', async () => {
    loadScript(OLD);
    stop = startBundleWatch({ fetch: fetchShell, reload });
    await checkBundle();
    expect(fetchShell).toHaveBeenCalledWith('/', expect.objectContaining({ cache: 'no-store' }));
  });

  it('holds the reload while a hand is being entered, then fires when idle', async () => {
    loadScript(OLD);
    stop = startBundleWatch({ fetch: fetchShell, reload });
    setBundleWatchBusy(true);
    served = NEW;
    await checkBundle();
    expect(reload).not.toHaveBeenCalled();
    setBundleWatchBusy(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('checks when the tab becomes visible again', async () => {
    loadScript(OLD);
    stop = startBundleWatch({ fetch: fetchShell, reload });
    served = NEW;
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('checks on a timer while visible', async () => {
    loadScript(OLD);
    stop = startBundleWatch({ fetch: fetchShell, reload, intervalMs: 1000 });
    served = NEW;
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    await vi.advanceTimersByTimeAsync(1000);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed shell fetch and keeps the page', async () => {
    loadScript(OLD);
    served = null;
    stop = startBundleWatch({ fetch: fetchShell, reload });
    await checkBundle();
    expect(reload).not.toHaveBeenCalled();
  });
});
