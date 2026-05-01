import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AssistantPhase } from '../../types/assistant';

const ringColors = ['#56ddff', '#9d63ff', '#ff4fd8'];

function phaseBoost(phase: AssistantPhase) {
  if (phase === 'listening') return 0.28;
  if (phase === 'responding') return 0.42;
  if (phase === 'processing') return 0.18;
  if (phase === 'error') return 0.36;
  return 0.08;
}

export function EnergyRings({ audioLevel, phase }: { audioLevel: number; phase: AssistantPhase }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group) {
      group.rotation.y += delta * 0.1;
      group.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.12;
    }

    ringsRef.current.forEach((ring, index) => {
      const material = ring.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * (1.1 + index * 0.37) + index) * 0.5 + 0.5;
      const boost = phaseBoost(phase);
      const scale = 1 + audioLevel * (0.18 + index * 0.08) + pulse * boost * 0.08;
      ring.scale.setScalar(scale);
      ring.rotation.z += delta * (0.08 + index * 0.035 + audioLevel * 0.1);
      material.opacity = THREE.MathUtils.damp(
        material.opacity,
        0.12 + boost + audioLevel * 0.25 - index * 0.035,
        5.0,
        delta
      );
    });
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((ring) => (
        <mesh
          key={ring}
          ref={(node) => {
            if (node) ringsRef.current[ring] = node;
          }}
          rotation={[Math.PI * (ring % 2 ? 0.5 : 0.12), Math.PI * (0.18 + ring * 0.12), 0]}
        >
          <torusGeometry args={[1.52 + ring * 0.2, 0.006 + ring * 0.0015, 12, 220]} />
          <meshBasicMaterial
            color={ringColors[ring]}
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
