import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LiquidEther({
  colors = ['#5227FF', '#FF9FFC', '#B19EEF'],
  mouseForce = 20,
  cursorSize = 100,
  isViscous = false,
  viscous = 30,
  iterationsViscous = 32,
  iterationsPoisson = 32,
  resolution = 0.5,
  isBounce = false,
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  takeoverDuration = 0.25,
  autoResumeDelay = 3000,
  autoRampDuration = 0.6,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio * resolution);
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Create particle system
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    // Convert hex colors to RGB
    const rgbColors = colors.map(color => {
      const c = new THREE.Color(color);
      return [c.r, c.g, c.b];
    });

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Position
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;

      // Velocity
      velocities[i3] = (Math.random() - 0.5) * 0.5;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      // Color
      const colorIndex = Math.floor(Math.random() * rgbColors.length);
      colorArray[i3] = rgbColors[colorIndex][0];
      colorArray[i3 + 1] = rgbColors[colorIndex][1];
      colorArray[i3 + 2] = rgbColors[colorIndex][2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    // Particle material
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = { positions, velocities, geometry, particleCount };

    // Mouse interaction
    let isMouseActive = false;
    let mouseTimeout;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      isMouseActive = true;
      
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        isMouseActive = false;
      }, autoResumeDelay);
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let autoTime = 0;
    const animate = () => {
      autoTime += 0.016;

      if (particlesRef.current) {
        const { positions, velocities, geometry, particleCount } = particlesRef.current;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          // Auto demo mode
          if (autoDemo && !isMouseActive) {
            const autoForceX = Math.sin(autoTime * autoSpeed + i * 0.1) * autoIntensity * 0.01;
            const autoForceY = Math.cos(autoTime * autoSpeed * 0.7 + i * 0.1) * autoIntensity * 0.01;
            
            velocities[i3] += autoForceX;
            velocities[i3 + 1] += autoForceY;
          }

          // Mouse interaction
          if (isMouseActive) {
            const dx = mouseRef.current.x * 50 - positions[i3];
            const dy = mouseRef.current.y * 50 - positions[i3 + 1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < cursorSize / 10) {
              const force = (1 - distance / (cursorSize / 10)) * mouseForce * 0.01;
              velocities[i3] += dx * force;
              velocities[i3 + 1] += dy * force;
            }
          }

          // Update positions
          positions[i3] += velocities[i3];
          positions[i3 + 1] += velocities[i3 + 1];
          positions[i3 + 2] += velocities[i3 + 2];

          // Apply damping
          velocities[i3] *= 0.95;
          velocities[i3 + 1] *= 0.95;
          velocities[i3 + 2] *= 0.98;

          // Boundary conditions
          if (Math.abs(positions[i3]) > 50) {
            positions[i3] = Math.sign(positions[i3]) * 50;
            velocities[i3] *= isBounce ? -0.5 : -1;
          }
          if (Math.abs(positions[i3 + 1]) > 50) {
            positions[i3 + 1] = Math.sign(positions[i3 + 1]) * 50;
            velocities[i3 + 1] *= isBounce ? -0.5 : -1;
          }
          if (Math.abs(positions[i3 + 2]) > 25) {
            positions[i3 + 2] = Math.sign(positions[i3 + 2]) * 25;
            velocities[i3 + 2] *= -0.5;
          }
        }

        geometry.attributes.position.needsUpdate = true;
      }

      // Rotate scene slightly for depth
      if (particles) {
        particles.rotation.z += 0.0001;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      clearTimeout(mouseTimeout);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [colors, mouseForce, cursorSize, autoDemo, autoSpeed, autoIntensity, resolution, isBounce, autoResumeDelay]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        background: 'transparent'
      }} 
    />
  );
}
