import * as THREE from 'three';
import React, { useEffect, useRef } from 'react';

const VLU_RED = 0xd72134;
const VLU_BLUE = 0x3d7cc9;
const VLU_WHITE = 0xf1f5f9;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function Welcome3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = prefersReducedMotion();
    const canvas = document.createElement('canvas');
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1628, 0.018);

    const sizes = { w: mount.clientWidth, h: mount.clientHeight };
    const camera = new THREE.PerspectiveCamera(60, sizes.w / sizes.h, 0.1, 100);
    camera.position.set(0, 0, 34);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(sizes.w, sizes.h);
    renderer.setClearColor(0x000000, 0);

    // --- Particle field (VLU red / blue / white) ---
    const count = Math.min(2600, Math.floor((sizes.w * sizes.h) / 700));
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [VLU_RED, VLU_BLUE, VLU_WHITE];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 46;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Central wireframe accent: torus knot (VLU red) + tilted ring (blue) ---
    const knotGeo = new THREE.TorusKnotGeometry(4.2, 1.15, 140, 18);
    const knotMat = new THREE.MeshBasicMaterial({ color: VLU_RED, wireframe: true, transparent: true, opacity: 0.5 });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(0, 0.5, 0);
    scene.add(knot);

    const ringGeo = new THREE.TorusGeometry(7.4, 0.05, 24, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: VLU_BLUE, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.set(Math.PI / 2.4, 0.5, 0);
    scene.add(ring);

    // --- Mouse parallax + animation ---
    let mouse = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };

    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduce) window.addEventListener('mousemove', onMouseMove);

    const animate = (time) => {
      const t = time * 0.001;
      target.x += (mouse.x * 1.6 - target.x) * 0.03;
      target.y += (mouse.y * 1.1 - target.y) * 0.03;
      camera.position.x = target.x;
      camera.position.y = -target.y;

      knot.rotation.x = t * 0.18;
      knot.rotation.y = t * 0.14;
      ring.rotation.z = t * 0.08;
      particles.rotation.y = t * 0.02;
      particles.rotation.x = Math.sin(t * 0.05) * 0.08;

      renderer.render(scene, camera);
    };
    if (reduce) renderer.render(scene, camera);
    else renderer.setAnimationLoop(animate);

    const onResize = () => {
      sizes.w = mount.clientWidth;
      sizes.h = mount.clientHeight;
      camera.aspect = sizes.w / sizes.h;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.w, sizes.h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      renderer.setAnimationLoop(null);
      particleGeo.dispose();
      particleMat.dispose();
      knotGeo.dispose();
      knotMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={mountRef} className="wl-3d-mount" aria-hidden="true" />;
}