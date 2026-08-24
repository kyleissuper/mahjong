import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function SessionQR({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);

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

  if (!svg) return null;
  return (
    <div
      className="drawer-qr"
      role="img"
      aria-label={`QR code to join session ${code}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
