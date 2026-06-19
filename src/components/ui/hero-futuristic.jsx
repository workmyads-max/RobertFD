import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroFuturistic({ className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const width = el.clientWidth || 600;
    const height = el.clientHeight || 500;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 2.5;

    // Texture image plane
    const loader = new THREE.TextureLoader();
    let planeMesh = null;
    loader.load(
      'https://i.postimg.cc/XYwvXN8D/img-4.png',
      (tex) => {
        const geo = new THREE.PlaneGeometry(1, 1);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
        planeMesh = new THREE.Mesh(geo, mat);
        planeMesh.scale.set(2.4, 2.4, 1);
        scene.add(planeMesh);
      },
      undefined,
      () => {} // silently ignore load errors
    );

    // Particles
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 7;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pmat = new THREE.PointsMaterial({ size: 0.018, color: 0xff5c00, transparent: true, opacity: 0.55, sizeAttenuation: true });
    const particles = new THREE.Points(pgeo, pmat);
    scene.add(particles);

    // Mouse tracking
    let mx = 0, my = 0;
    const onMouse = (e) => {
      const rect = el.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      my = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    el.addEventListener('mousemove', onMouse);

    // Resize
    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animate
    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.015;

      if (planeMesh) {
        planeMesh.rotation.y = Math.sin(t * 0.15) * 0.04 + mx * 0.03;
        planeMesh.rotation.x = Math.sin(t * 0.1) * 0.02 - my * 0.02;
        planeMesh.material.opacity = Math.min(planeMesh.material.opacity + 0.005, 0.92);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      el.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '100%' }}
    />
  );
}