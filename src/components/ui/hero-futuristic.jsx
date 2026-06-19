'use client';

import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useAspect, useTexture } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

const TEXTUREMAP = { src: 'https://i.postimg.cc/XYwvXN8D/img-4.png' };
const DEPTHMAP = { src: 'https://i.postimg.cc/2SHKQh2q/raw-4.webp' };

const WIDTH = 300;
const HEIGHT = 300;

// Fallback scene using standard Three.js (no WebGPU required)
const Scene = () => {
  const meshRef = useRef(null);
  const [textures, setTextures] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all([
      new Promise(res => loader.load(TEXTUREMAP.src, res, undefined, () => res(null))),
      new Promise(res => loader.load(DEPTHMAP.src, res, undefined, () => res(null))),
    ]).then(([rawMap, depthMap]) => {
      if (rawMap && depthMap) setTextures({ rawMap, depthMap });
    });
  }, []);

  const material = useMemo(() => {
    if (!textures) return new THREE.MeshBasicMaterial({ color: '#0a0a0f', transparent: true, opacity: 0.8 });
    return new THREE.MeshBasicMaterial({
      map: textures.rawMap,
      transparent: true,
      opacity: 0.9,
    });
  }, [textures]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.04;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.02;
      if (meshRef.current.material?.opacity !== undefined) {
        meshRef.current.material.opacity = THREE.MathUtils.lerp(
          meshRef.current.material.opacity,
          textures ? 0.92 : 0.0,
          0.05
        );
      }
    }
  });

  return (
    <mesh ref={meshRef} scale={[2.2, 2.2, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
};

// Ambient particles for atmosphere
const Particles = () => {
  const points = useRef(null);
  const count = 120;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.03;
      points.current.rotation.x = clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#FF5C00" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

export default function HeroFuturistic({ className = '' }) {
  const [webGPUSupported] = useState(() => {
    try { return typeof navigator !== 'undefined' && 'gpu' in navigator; } catch { return false; }
  });

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <Scene />
        <Particles />
      </Canvas>
    </div>
  );
}