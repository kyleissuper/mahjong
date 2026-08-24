// The UI is designed at a fixed scale; the in-app zoom controls are the way
// to make it bigger. text-size-adjust opts out of system text scaling on
// Chromium/WebKit, but some browsers (Firefox Android) ignore it and multiply
// every font size anyway. Measure the actual inflation with a probe and
// counteract it at the root so 1rem renders at the intended size.
//
// Display/page zoom (a smaller virtual viewport) is deliberately left alone —
// it isn't font scaling and can't be opted out of.

const BASE = 16;

function measureScale(): number {
  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.cssText =
    'position:absolute;visibility:hidden;left:-9999px;' +
    `font-size:${BASE}px;line-height:1;font-family:monospace;padding:0;border:0;`;
  document.body.appendChild(probe);
  const byHeight = probe.offsetHeight / BASE;
  const byComputed = parseFloat(getComputedStyle(probe).fontSize) / BASE;
  probe.remove();
  return Math.max(byHeight, byComputed);
}

export function pinFontScale() {
  try {
    const scale = measureScale();
    if (scale < 1.05) return;
    // The browser multiplies specified sizes by `scale`, so a root of
    // BASE/scale renders at exactly BASE and all rem sizing lands on design.
    document.documentElement.style.fontSize = `${Math.max(8, BASE / scale)}px`;
  } catch {
    // A failed probe must never break the app.
  }
}
