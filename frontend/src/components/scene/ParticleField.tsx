import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AssistantPhase } from '../../types/assistant';

const particleCount = 1150;
const bounds = 7.8;

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function phaseForce(phase: AssistantPhase) {
  if (phase === 'listening') return 1.18;
  if (phase === 'responding') return 1.35;
  if (phase === 'processing') return 0.92;
  if (phase === 'error') return 1.55;
  return 0.5;
}

export function ParticleField({ audioLevel, phase }: { audioLevel: number; phase: AssistantPhase }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { colors, positions, seeds, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);
    const palette = [
      new THREE.Color('#56ddff'),
      new THREE.Color('#9d63ff'),
      new THREE.Color('#ff4fd8'),
      new THREE.Color('#8fffca')
    ];

    for (let i = 0; i < particleCount; i += 1) {
      const radius = randomInRange(1.8, bounds);
      const theta = randomInRange(0, Math.PI * 2);
      const phi = Math.acos(randomInRange(-1, 1));
      const index = i * 3;

      positions[index] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index + 1] = radius * Math.cos(phi) * 0.68;
      positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
      velocities[index] = randomInRange(-0.002, 0.002);
      velocities[index + 1] = randomInRange(-0.002, 0.002);
      velocities[index + 2] = randomInRange(-0.002, 0.002);
      seeds[i] = Math.random();

      const color = palette[i % palette.length].clone().lerp(new THREE.Color('#ffffff'), Math.random() * 0.18);
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    return { colors, positions, seeds, velocities };
  }, []);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) {
      return;
    }

    const positionAttribute = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const force = phaseForce(phase);
    const pointerX = state.pointer.x * 1.9;
    const pointerY = state.pointer.y * 1.3;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < particleCount; i += 1) {
      const index = i * 3;
      let x = positions[index];
      let y = positions[index + 1];
      let z = positions[index + 2];

      const distance = Math.sqrt(x * x + y * y + z * z) + 0.0001;
      const invDistance = 1 / distance;
      const swirl = 0.012 + seeds[i] * 0.02 + audioLevel * 0.055;
      const radialPush = (audioLevel * 0.032 + 0.002 * force) * (2.2 / distance);
      const pointerPush = 0.006 * force;

      velocities[index] += (-z * invDistance * swirl + x * invDistance * radialPush + (pointerX - x) * pointerPush * 0.012) * delta * 60;
      velocities[index + 1] +=
        (Math.sin(time * (0.5 + seeds[i]) + seeds[i] * 12.0) * 0.002 +
          y * invDistance * radialPush +
          (pointerY - y) * pointerPush * 0.01) *
        delta *
        60;
      velocities[index + 2] += (x * invDistance * swirl + z * invDistance * radialPush) * delta * 60;

      velocities[index] *= 0.965;
      velocities[index + 1] *= 0.968;
      velocities[index + 2] *= 0.965;

      x += velocities[index];
      y += velocities[index + 1];
      z += velocities[index + 2];

      const nextDistance = Math.sqrt(x * x + y * y + z * z);
      if (nextDistance > bounds || nextDistance < 0.85) {
        const resetRadius = nextDistance > bounds ? randomInRange(2.2, 4.8) : randomInRange(4.2, bounds);
        const theta = randomInRange(0, Math.PI * 2);
        const phi = Math.acos(randomInRange(-1, 1));
        x = resetRadius * Math.sin(phi) * Math.cos(theta);
        y = resetRadius * Math.cos(phi) * 0.72;
        z = resetRadius * Math.sin(phi) * Math.sin(theta);
        velocities[index] *= 0.2;
        velocities[index + 1] *= 0.2;
        velocities[index + 2] *= 0.2;
      }

      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;
      positionAttribute.setXYZ(i, x, y, z);
    }

    positionAttribute.needsUpdate = true;
    points.rotation.y += delta * (0.025 + audioLevel * 0.035);
    points.rotation.x = Math.sin(time * 0.08) * 0.05;

    const material = points.material as THREE.PointsMaterial;
    material.opacity = THREE.MathUtils.damp(material.opacity, 0.36 + audioLevel * 0.34, 4.0, delta);
    material.size = THREE.MathUtils.damp(material.size, 0.028 + audioLevel * 0.032, 5.0, delta);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.42}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
