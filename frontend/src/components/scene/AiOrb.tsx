import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { orbFragmentShader, orbVertexShader } from '../../shaders/orbShader';
import type { AssistantPhase } from '../../types/assistant';

const primary = new THREE.Color('#56ddff');
const secondary = new THREE.Color('#9d63ff');
const accent = new THREE.Color('#ff4fd8');
const errorAccent = new THREE.Color('#ff6a6a');

function phaseValue(phase: AssistantPhase) {
  switch (phase) {
    case 'listening':
      return 1.0;
    case 'processing':
      return 1.45;
    case 'responding':
      return 2.2;
    case 'error':
      return 3.0;
    default:
      return 0.0;
  }
}

export function AiOrb({ audioLevel, phase }: { audioLevel: number; phase: AssistantPhase }) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const shellMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const stateRef = useRef(0);
  const audioRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uState: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPrimary: { value: primary.clone() },
      uSecondary: { value: secondary.clone() },
      uAccent: { value: accent.clone() }
    }),
    []
  );

  useFrame((state, delta) => {
    const targetState = phaseValue(phase);
    stateRef.current = THREE.MathUtils.damp(stateRef.current, targetState, 4.2, delta);
    audioRef.current = THREE.MathUtils.damp(audioRef.current, audioLevel, 7.0, delta);

    const material = materialRef.current;
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uAudio.value = audioRef.current;
      material.uniforms.uState.value = stateRef.current;
      material.uniforms.uPointer.value.set(state.pointer.x, state.pointer.y);
      material.uniforms.uAccent.value.lerp(phase === 'error' ? errorAccent : accent, 0.08);
    }

    const body = bodyRef.current;
    if (body) {
      const position = body.translation();
      const floatY =
        Math.sin(state.clock.elapsedTime * 0.78) * 0.22 +
        Math.sin(state.clock.elapsedTime * 1.47) * 0.045 +
        audioRef.current * 0.18;
      const targetX = state.pointer.x * 0.42;
      const targetZ = state.pointer.y * -0.18;
      const stateLift = phase === 'listening' ? 0.12 : phase === 'responding' ? 0.08 : 0;

      body.applyImpulse(
        {
          x: (targetX - position.x) * 0.045,
          y: (floatY + stateLift - position.y) * 0.055,
          z: (targetZ - position.z) * 0.038
        },
        true
      );
      body.applyTorqueImpulse(
        {
          x: 0.0014 * state.pointer.y + audioRef.current * 0.001,
          y: 0.0016 * Math.sin(state.clock.elapsedTime * 0.6),
          z: -0.0012 * state.pointer.x
        },
        true
      );
    }

    const mesh = meshRef.current;
    if (mesh) {
      const scaleTarget =
        1 +
        audioRef.current * 0.18 +
        (phase === 'listening' ? 0.08 : 0) +
        (phase === 'responding' ? 0.12 : 0) +
        Math.sin(state.clock.elapsedTime * 1.25) * 0.015;
      const nextScale = THREE.MathUtils.damp(mesh.scale.x, scaleTarget, 5.4, delta);
      mesh.scale.setScalar(nextScale);
    }

    const shell = shellRef.current;
    const shellMaterial = shellMaterialRef.current;
    if (shell && shellMaterial) {
      const shellScale =
        1.18 +
        audioRef.current * 0.24 +
        Math.sin(state.clock.elapsedTime * 1.8) * 0.025 +
        stateRef.current * 0.025;
      shell.scale.setScalar(shellScale);
      shellMaterial.opacity = THREE.MathUtils.damp(
        shellMaterial.opacity,
        0.08 + audioRef.current * 0.16 + stateRef.current * 0.025,
        5.0,
        delta
      );
      shell.rotation.y += delta * (0.12 + audioRef.current * 0.22);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders="ball"
      friction={0.05}
      gravityScale={0}
      linearDamping={4.6}
      angularDamping={5.2}
      restitution={0.48}
      position={[0, 0, 0]}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.05, 160, 160]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={orbVertexShader}
          fragmentShader={orbFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={shellRef} scale={1.18}>
        <sphereGeometry args={[1.05, 96, 96]} />
        <meshBasicMaterial
          ref={shellMaterialRef}
          color="#56ddff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </RigidBody>
  );
}
