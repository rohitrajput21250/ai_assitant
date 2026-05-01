import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, Preload } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { AssistantPhase } from '../../types/assistant';
import { AiOrb } from './AiOrb';
import { CameraRig } from './CameraRig';
import { EnergyRings } from './EnergyRings';
import { ParticleField } from './ParticleField';
import { SceneLights } from './SceneLights';

export function ExperienceCanvas({
  audioLevel,
  phase
}: {
  audioLevel: number;
  phase: AssistantPhase;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.7], fov: 42, near: 0.1, far: 80 }}
      dpr={[1, 1.75]}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance'
      }}
    >
      <color attach="background" args={['#050713']} />
      <fog attach="fog" args={['#050713', 8, 18]} />
      <Suspense fallback={null}>
        <SceneLights audioLevel={audioLevel} phase={phase} />
        <Physics gravity={[0, 0, 0]} interpolate timeStep="vary">
          <AiOrb audioLevel={audioLevel} phase={phase} />
        </Physics>
        <EnergyRings audioLevel={audioLevel} phase={phase} />
        <ParticleField audioLevel={audioLevel} phase={phase} />
        <CameraRig />
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.65} luminanceThreshold={0.18} luminanceSmoothing={0.72} mipmapBlur />
          <Vignette darkness={0.55} eskil={false} offset={0.18} />
        </EffectComposer>
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
