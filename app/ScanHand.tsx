import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Meld } from '../src/types.js';

// Cap the captured frame at 2048px on the long edge — well above what tile
// recognition needs, small enough to POST quickly.
const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.92;

async function recognize(dataUrl: string): Promise<Meld[]> {
  const resp = await fetch('/api/recognize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
  });
  const data = (await resp.json()) as { melds?: Meld[]; error?: string };
  if (!resp.ok) throw new Error(data.error ?? `Request failed (${resp.status})`);
  if (!data.melds?.length) throw new Error('No tiles found — try a clearer photo.');
  return data.melds;
}

function frameToDataUrl(source: HTMLVideoElement | HTMLImageElement, w: number, h: number): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

const buttonStyle: CSSProperties = {
  appearance: 'none',
  border: '1px solid #d8d0c0',
  background: '#fff',
  borderRadius: 8,
  padding: '10px 18px',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#333',
  cursor: 'pointer',
};

// --- Full-screen live camera ---

function CameraCapture({ onScan, onClose }: { onScan: (melds: Meld[]) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'starting' | 'ready' | 'working'>('starting');
  const [error, setError] = useState<string | null>(null);
  const [noCamera, setNoCamera] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 2560 },
            height: { ideal: 1440 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPhase('ready');
      } catch {
        // No camera / permission denied / insecure context — offer photo fallback.
        setNoCamera(true);
        setError('Camera unavailable. Choose a photo instead.');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function submit(dataUrl: string) {
    setPhase('working');
    setError(null);
    try {
      const melds = await recognize(dataUrl);
      streamRef.current?.getTracks().forEach(t => t.stop());
      onScan(melds);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setPhase('ready');
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    // The video is object-fit: cover, so it's cropped to fill the screen. Capture
    // exactly that visible region (not the full sensor frame) so the on-screen
    // top/bottom guide lines up with what the model actually receives.
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    const cw = v.clientWidth || vw;
    const ch = v.clientHeight || vh;
    const coverScale = Math.max(cw / vw, ch / vh);
    const visW = cw / coverScale;
    const visH = ch / coverScale;
    const sx = (vw - visW) / 2;
    const sy = (vh - visH) / 2;
    const outScale = Math.min(1, MAX_EDGE / Math.max(visW, visH));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(visW * outScale);
    canvas.height = Math.round(visH * outScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas not supported');
      return;
    }
    ctx.drawImage(v, sx, sy, visW, visH, 0, 0, canvas.width, canvas.height);
    submit(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
  }

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        submit(frameToDataUrl(img, img.width, img.height));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read image');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Could not read that image');
    };
    img.src = url;
  }

  // Portal to <body> so the overlay escapes the app's nested stacking contexts
  // (the bottom sheet and sticky app bar) and truly covers the viewport.
  return createPortal(
    <div style={overlayStyle}>
      <button aria-label="Close" onClick={onClose} style={closeStyle}>✕</button>

      {!noCamera && (
        <video ref={videoRef} playsInline autoPlay muted style={videoStyle} />
      )}

      {!noCamera && phase !== 'starting' && (
        <>
          <div style={guideLineStyle} />
          <div style={{ ...guidePillStyle, top: '20%' }}>Exposed · top half</div>
          <div style={{ ...guidePillStyle, top: '70%' }}>Concealed · bottom half</div>
        </>
      )}

      {phase === 'working' && (
        <div style={statusStyle}>Reading tiles…</div>
      )}
      {error && <div style={{ ...statusStyle, bottom: 120, color: '#ffb4a2' }}>{error}</div>}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPickFile} />

      <div style={controlsStyle}>
        {!noCamera ? (
          <button
            aria-label="Take photo"
            onClick={capture}
            disabled={phase !== 'ready'}
            style={{ ...shutterStyle, opacity: phase === 'ready' ? 1 : 0.5 }}
          />
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{ ...buttonStyle, padding: '14px 22px' }}>
            Choose a photo
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 2000, background: '#000',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
};
const videoStyle: CSSProperties = {
  width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0,
};
const closeStyle: CSSProperties = {
  position: 'absolute', top: 16, right: 16, zIndex: 2, width: 40, height: 40,
  borderRadius: 20, border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff',
  fontSize: '1.1rem', cursor: 'pointer',
};
const controlsStyle: CSSProperties = {
  position: 'absolute', bottom: 40, zIndex: 2, display: 'flex', justifyContent: 'center', width: '100%',
};
const shutterStyle: CSSProperties = {
  width: 72, height: 72, borderRadius: 36, background: '#fff',
  border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer',
};
const guideLineStyle: CSSProperties = {
  position: 'absolute', left: 0, right: 0, top: '50%', zIndex: 1,
  borderTop: '2px dashed rgba(255,255,255,0.85)', pointerEvents: 'none',
};
const guidePillStyle: CSSProperties = {
  position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 1,
  background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 12px', borderRadius: 14,
  fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
  whiteSpace: 'nowrap', pointerEvents: 'none',
};
const statusStyle: CSSProperties = {
  position: 'absolute', bottom: 140, zIndex: 2, color: '#fff',
  background: 'rgba(0,0,0,0.55)', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem',
};

// --- Trigger button (host places this; the camera overlay is fixed-position) ---

export function ScanHand({ onScan }: { onScan: (melds: Meld[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button style={buttonStyle} onClick={() => setOpen(true)}>📷 Scan a photo</button>
      {open && <CameraCapture onScan={onScan} onClose={() => setOpen(false)} />}
    </div>
  );
}
