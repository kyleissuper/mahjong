import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import Webcam from 'react-webcam';
import type { Meld } from '../src/types.js';

// Downscale the captured frame before upload. 1280px on the long edge keeps tiles
// readable while cutting the model's image tokens (and latency) vs a larger frame.
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.9;

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

// Crop to the region a viewport-filling object-fit:cover element actually shows,
// scaled so the long edge is MAX_EDGE — so the on-screen framing matches the
// image the model receives.
function coverCrop(video: HTMLVideoElement): string {
  const sw = video.videoWidth;
  const sh = video.videoHeight;
  const cw = video.clientWidth || sw;
  const ch = video.clientHeight || sh;
  const coverScale = Math.max(cw / sw, ch / sh);
  const visW = cw / coverScale;
  const visH = ch / coverScale;
  const sx = (sw - visW) / 2;
  const sy = (sh - visH) / 2;
  const outScale = Math.min(1, MAX_EDGE / Math.max(visW, visH));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(visW * outScale);
  canvas.height = Math.round(visH * outScale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(video, sx, sy, visW, visH, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function downscaleImage(img: HTMLImageElement): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

// --- Full-screen camera capture ---

function CameraCapture({ onScan, onClose }: { onScan: (melds: Meld[]) => void; onClose: () => void }) {
  const webcamRef = useRef<Webcam>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'starting' | 'ready' | 'working'>('starting');
  const [error, setError] = useState<string | null>(null);
  const [noCamera, setNoCamera] = useState(false);
  const [frozen, setFrozen] = useState<string | null>(null);
  const [landscape, setLandscape] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const onChange = () => setLandscape(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  async function submit(dataUrl: string) {
    // Freeze on the captured still and drop the live camera during recognition,
    // so it doesn't feel like the user has to keep holding the shot.
    setFrozen(dataUrl);
    setPhase('working');
    setError(null);
    try {
      const melds = await recognize(dataUrl);
      onScan(melds);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setFrozen(null);
      setPhase('ready');
    }
  }

  function capture() {
    const video = webcamRef.current?.video;
    if (!video || !video.videoWidth) return;
    submit(coverCrop(video));
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
        submit(downscaleImage(img));
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

  const showLiveCamera = !noCamera && phase !== 'working';

  // Portal to <body> so the overlay escapes the app's nested stacking contexts
  // (the bottom sheet and sticky app bar) and truly covers the viewport.
  return createPortal(
    <div style={overlayStyle}>
      <button aria-label="Close" onClick={onClose} style={closeStyle}>✕</button>

      {showLiveCamera && (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: { ideal: 'environment' },
            width: { ideal: 2560 },
            height: { ideal: 1440 },
          }}
          onUserMedia={() => setPhase('ready')}
          onUserMediaError={() => {
            setNoCamera(true);
            setError('Camera unavailable. Choose a photo instead.');
          }}
          style={videoStyle}
        />
      )}

      {showLiveCamera && phase === 'ready' && (
        <>
          <div style={guideLineStyle} />
          <div style={{ ...guidePillStyle, top: '20%' }}>Exposed · top half</div>
          <div style={{ ...guidePillStyle, top: '70%' }}>Concealed · bottom half</div>
        </>
      )}

      {phase === 'working' && frozen && (
        <>
          <img src={frozen} alt="" style={videoStyle} />
          <div style={processingStyle}>Reading tiles…</div>
        </>
      )}

      {error && <div style={{ ...statusStyle, bottom: 120, color: '#ffb4a2' }}>{error}</div>}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPickFile} />

      <div style={landscape ? controlsLandscapeStyle : controlsStyle}>
        {noCamera ? (
          <button onClick={() => fileRef.current?.click()} style={{ ...buttonStyle, padding: '14px 22px' }}>
            Choose a photo
          </button>
        ) : phase !== 'working' ? (
          <button
            aria-label="Take photo"
            onClick={capture}
            disabled={phase !== 'ready'}
            style={{ ...shutterStyle, opacity: phase === 'ready' ? 1 : 0.5 }}
          />
        ) : null}
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
// Landscape: shutter on the right edge, vertically centered (clears the labels).
const controlsLandscapeStyle: CSSProperties = {
  position: 'absolute', top: 0, bottom: 0, right: 28, zIndex: 2,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
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
const processingStyle: CSSProperties = {
  position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontSize: '1rem', fontWeight: 600,
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
