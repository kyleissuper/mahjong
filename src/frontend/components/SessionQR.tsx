import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function SessionQR({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toString(`${location.origin}/?code=${code}`, {
      type: 'svg',
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: '#333333', light: '#0000' },
    })
      .then(setSvg)
      .catch(() => setSvg(null));
  }, [code]);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(`${location.origin}/?code=${code}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!svg) return null;
  return (
    <div className="drawer-qr" onClick={handleClick} title="Copy join link"
      role="button" aria-label={`QR code to join session ${code}. Tap to copy join link`}>
      <div role="img" dangerouslySetInnerHTML={{ __html: svg }} />
      {copied && <span className="copyable-copied drawer-qr-copied">Link copied!</span>}
    </div>
  );
}
