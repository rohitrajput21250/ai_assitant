import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AssistantPhase } from '../../types/assistant';

export function SceneLights({ audioLevel, phase }: { audioLevel: number; phase: AssistantPhase }) {
  const cyanRef = useRef<THREE.PointLight>(null);
  const violetRef = useRef<THREE.PointLight>(null);
  const magentaRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const activeBoost = phase === 'listening' || phase === 'responding' ? 1.2 : 0.45;

    if (cyanRef.current) {
      cyanRef.current.position.set(Math.sin(t * 0.45) * 2.6, 1.8 + audioLevel * 0.4, 2.4);
      cyanRef.current.intensity = THREE.MathUtils.damp(cyanRef.current.intensity, 3.8 + audioLevel * 4.5, 4, delta);
    }

    if (violetRef.current) {
      violetRef.current.position.set(-2.4, Math.cos(t * 0.38) * 1.2, -1.4);
      violetRef.current.intensity = THREE.MathUtils.damp(violetRef.current.intensity, 2.2 + activeBoost, 4, delta);
    }

    if (magentaRef.current) {
      magentaRef.current.position.set(2.2, -1.2, -2.0);
      magentaRef.current.intensity = THREE.MathUtils.damp(magentaRef.current.intensity, 1.2 + audioLevel * 2.4, 4, delta);
    }
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight ref={cyanRef} color="#56ddff" intensity={3.4} distance={8} />
      <pointLight ref={violetRef} color="#9d63ff" intensity={2.4} distance={9} />
      <pointLight ref={magentaRef} color="#ff4fd8" intensity={1.4} distance={7} />
    </>
  );
}
