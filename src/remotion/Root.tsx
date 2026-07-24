import { Composition } from 'remotion';
import { ScoringDemo } from './ScoringDemo.tsx';

export function RemotionRoot() {
  return (
    <Composition
      id="ScoringDemo"
      component={ScoringDemo}
      durationInFrames={540}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
