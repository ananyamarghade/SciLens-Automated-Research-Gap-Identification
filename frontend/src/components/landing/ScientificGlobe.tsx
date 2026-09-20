import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createKnowledgeSphereTextures } from './knowledgeSphereTexture';
import { useTheme } from '../../context/ThemeContext';

interface ScientificGlobeProps {
  scrollProgress?: number; // 0 to 1
  mousePos?: { x: number; y: number }; // normalized -1 to 1
  className?: string;
}

export const ScientificGlobe: React.FC<ScientificGlobeProps> = ({
  scrollProgress = 0,
  mousePos = { x: 0, y: 0 },
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const reqIdRef = useRef<number | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup — Focused perspective
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.3);

    // 3. WebGL Renderer with High-Fidelity ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Main Globe Group (Positioned on the right, commanding presence)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = (8.0 * Math.PI) / 180;
    globeGroup.rotation.x = 0.08;
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 5. 3D Spherical Knowledge Field (Constructed entirely from research typography)
    const isDark = theme === 'dark';
    const { colorMap, bumpMap, emissiveMap } = createKnowledgeSphereTextures(isDark);
    const sphereRadius = 1.34;

    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      map: colorMap,
      bumpMap: bumpMap,
      bumpScale: 0.045,
      emissiveMap: emissiveMap,
      emissive: new THREE.Color(0x5eead4),
      emissiveIntensity: isDark ? 0.65 : 0.45,
      roughness: 0.60,
      metalness: 0.12,
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.renderOrder = 0;
    globeGroup.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // 6. Scientific Atmospheric Rim Shader (Cyan limb illumination)
    const atmosphereGeometry = new THREE.SphereGeometry(sphereRadius * 1.022, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.60 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          vec3 atmosphereColor = vec3(0.12, 0.58, 0.62);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.75);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 7. Outer Fine Coordinate Cage (Subtle scientific coordinate cage)
    const cageGeometry = new THREE.SphereGeometry(sphereRadius * 1.006, 24, 16);
    const cageMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? 0x2dd4bf : 0x1b6b75,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.035 : 0.045,
    });
    const cageMesh = new THREE.Mesh(cageGeometry, cageMaterial);
    globeGroup.add(cageMesh);

    // 8. Lighting (Calm, scientific, balanced illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.90 : 1.20);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.45 : 1.65);
    keyLight.position.set(5, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x2dd4bf, isDark ? 0.95 : 0.70);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // 9. Continuous Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Knowledge sphere rotates smoothly and calmly
      if (sphereMeshRef.current) {
        sphereMeshRef.current.rotation.y += delta * 0.020;
      }
      if (cageMesh) {
        cageMesh.rotation.y += delta * 0.020;
      }

      // Subtle mouse tilt & parallax
      if (globeGroupRef.current) {
        const targetRotX = 0.08 + mousePos.y * 0.035;
        const targetRotY = mousePos.x * 0.055;
        globeGroupRef.current.rotation.x += (targetRotX - globeGroupRef.current.rotation.x) * 0.05;
        globeGroupRef.current.rotation.y += (targetRotY - globeGroupRef.current.rotation.y) * 0.05;

        const scrollScale = 1 - scrollProgress * 0.10;
        globeGroupRef.current.scale.set(scrollScale, scrollScale, scrollScale);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Handle Resizing
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      colorMap.dispose();
      bumpMap.dispose();
      emissiveMap.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      cageGeometry.dispose();
      cageMaterial.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full flex items-center justify-center select-none pointer-events-auto ${className}`}
      style={{ minHeight: '480px' }}
    />
  );
};
