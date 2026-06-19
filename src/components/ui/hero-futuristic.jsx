import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { TextureLoader } from 'three';

const TEXTUREMAP = 'https://i.postimg.cc/XYwvXN8D/img-4.png';
const DEPTHMAP = 'https://i.postimg.cc/2SHKQh2q/raw-4.webp';

function Scene() {
  const meshRef = useRef(null);
  const [opacity, setOpacity] = useState(0);

  const [rawMap, depthMap] = useLoader(TextureLoader, [TEXTUREMAP, DEPTHMAP]);

  useEffect(() => {
    if (rawMap && depthMap) {
      const t = setTimeout(() => setOpacity(0.92), 100);
      return () => clearTimeout(t);
    }
  }, [rawMap, depthMap]);

  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.04 + pointer.x * 0.03;
    meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.02 - pointer.y * 0.02;
    const mat = meshRef.current.material;
    if (mat) mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity, 0.06);
  });

  return (
    <mesh ref={meshRef} scale={[2.4, 2.4, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={rawMap} transparent opacity={0} />
    </mesh>
  );
}

function Particles() {
  const points = useRef(null);
  const count = 150;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.04;
      points.current.rotation.x = clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#FF5C00" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function SceneWithSuspense() {
  return (
    <>
      <Scene />
      <Particles />
    </>
  );
}

function FallbackParticles() {
  const points = useRef(null);
  const count = 150;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.04;
    }
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#FF5C00" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

export default function HeroFuturistic({ className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <SceneWithSuspense />
      </Canvas>
    </div>
  );
}