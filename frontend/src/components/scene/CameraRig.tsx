import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const target = new THREE.Vector3();
const lookAt = new THREE.Vector3(0, 0, 0);

export function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame((_state, delta) => {
    target.set(pointer.x * 0.55, pointer.y * 0.34, 5.7);
    camera.position.lerp(target, 1 - Math.pow(0.001, delta));
    camera.lookAt(lookAt);
  });

  return null;
}
