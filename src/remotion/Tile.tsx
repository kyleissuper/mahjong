import { Img, staticFile } from 'remotion';

export function Tile({ tile, size = 48 }: { tile: string; size?: number }) {
  const h = Math.round(size * (4 / 3));
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        border: '1.5px solid #d4cfc5',
        background: 'linear-gradient(to bottom, #fefcf8, #f5f0e8)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 1px 0 rgba(0,0,0,0.06)',
        padding: 12,
      }}
    >
      <Img
        src={staticFile(`tiles/${tile}.svg`)}
        width={size}
        height={h}
        style={{ display: 'block' }}
      />
    </div>
  );
}
