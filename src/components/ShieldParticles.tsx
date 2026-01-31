import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 800;

// Shield shape points
const generateShieldPoints = () => {
  const points: [number, number, number][] = [];
  
  // Shield outline
  for (let i = 0; i < 100; i++) {
    const t = (i / 100) * Math.PI * 2;
    // Shield shape formula
    const r = 1.2 + 0.3 * Math.cos(2 * t);
    const x = r * Math.sin(t) * 0.8;
    const y = r * Math.cos(t) * 1.1 - 0.2;
    points.push([x, y, 0]);
  }
  
  // Fill shield with particles
  for (let i = 0; i < PARTICLE_COUNT - 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 1.0;
    const x = radius * Math.sin(angle) * 0.7;
    const y = radius * Math.cos(angle) * 1.0;
    
    // Check if inside shield shape
    if (y > -1.2 && y < 1.2) {
      points.push([x, y, (Math.random() - 0.5) * 0.2]);
    }
  }
  
  // Add checkmark inside
  for (let i = 0; i < 50; i++) {
    const t = i / 50;
    if (t < 0.4) {
      const x = -0.3 + t * 0.6;
      const y = -0.2 - t * 0.4;
      points.push([x, y, 0.1]);
    } else {
      const tt = (t - 0.4) / 0.6;
      const x = 0.0 + tt * 0.5;
      const y = -0.36 + tt * 0.7;
      points.push([x, y, 0.1]);
    }
  }
  
  return points;
};

const Particles = () => {
  const meshRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());
  
  const { positions, randomOffsets, targetPositions } = useMemo(() => {
    const shieldPoints = generateShieldPoints();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const randomOffsets = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random starting positions (scattered)
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      
      // Random offset for floating effect
      randomOffsets[i * 3] = Math.random() * Math.PI * 2;
      randomOffsets[i * 3 + 1] = Math.random() * Math.PI * 2;
      randomOffsets[i * 3 + 2] = Math.random() * 0.5 + 0.5;
      
      // Target positions (shield shape)
      if (i < shieldPoints.length) {
        targetPositions[i * 3] = shieldPoints[i][0];
        targetPositions[i * 3 + 1] = shieldPoints[i][1];
        targetPositions[i * 3 + 2] = shieldPoints[i][2];
      } else {
        // Extra particles float around
        const a = Math.random() * Math.PI * 2;
        const r = 1.5 + Math.random() * 0.5;
        targetPositions[i * 3] = Math.cos(a) * r;
        targetPositions[i * 3 + 1] = Math.sin(a) * r;
        targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    
    return { positions, randomOffsets, targetPositions };
  }, []);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const geometry = meshRef.current.geometry;
    const positionAttr = geometry.attributes.position;
    
    // Animation progress (0 to 1 over 3 seconds, then stay at 1)
    const progress = Math.min(elapsed / 3, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Interpolate from start to target
      const startX = positions[i3];
      const startY = positions[i3 + 1];
      const startZ = positions[i3 + 2];
      
      const targetX = targetPositions[i3];
      const targetY = targetPositions[i3 + 1];
      const targetZ = targetPositions[i3 + 2];
      
      // Add subtle floating motion after assembled
      const floatX = Math.sin(elapsed * randomOffsets[i3 + 2] + randomOffsets[i3]) * 0.02 * progress;
      const floatY = Math.cos(elapsed * randomOffsets[i3 + 2] + randomOffsets[i3 + 1]) * 0.02 * progress;
      
      positionAttr.setXYZ(
        i,
        startX + (targetX - startX) * eased + floatX,
        startY + (targetY - startY) * eased + floatY,
        startZ + (targetZ - startZ) * eased
      );
    }
    
    positionAttr.needsUpdate = true;
    
    // Slow rotation
    meshRef.current.rotation.y = Math.sin(elapsed * 0.3) * 0.1;
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#d4a843"
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const ShieldParticles = () => {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <Particles />
      </Canvas>
    </div>
  );
};

export default ShieldParticles;
