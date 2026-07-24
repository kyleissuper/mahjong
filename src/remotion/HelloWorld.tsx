import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export function HelloWorld() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
      <h1 style={{ color: '#fff', fontSize: 80, fontFamily: 'sans-serif', opacity }}>
        Mahjong Scorer
      </h1>
    </AbsoluteFill>
  );
}
