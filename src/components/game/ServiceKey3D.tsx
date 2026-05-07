import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface ServiceKeyProps {
  variant: 'gold' | 'silver' | 'bronze' | 'emerald';
  isHovered: boolean;
}

const KeyModel = ({ variant, isHovered }: ServiceKeyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Colors for different variants
  const colors = {
    gold: { metal: '#d4a439', accent: '#ffd700', gem: '#ff6b35' },
    silver: { metal: '#a8a8a8', accent: '#e8e8e8', gem: '#4a90d9' },
    bronze: { metal: '#cd7f32', accent: '#e8a860', gem: '#50c878' },
    emerald: { metal: '#2a2a2a', accent: '#4a4a4a', gem: '#00d9a5' },
  };
  
  const { metal, accent, gem } = colors[variant];
  
  // Animate rotation on hover
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Continuous gentle Y-axis spin so the key always looks alive,
      // even on touch devices where there is no hover state.
      groupRef.current.rotation.y += delta * (isHovered ? 1.2 : 0.6);

      const targetZ = isHovered ? Math.sin(state.clock.elapsedTime * 3) * 0.3 : 0;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetZ,
        0.1
      );
    }
  });

  return (
    <Float speed={isHovered ? 4 : 1.5} rotationIntensity={isHovered ? 0.8 : 0.2} floatIntensity={isHovered ? 0.5 : 0.2}>
      <group ref={groupRef} scale={isHovered ? 0.9 : 0.8} rotation={[0.3, 0, 0]}>
        {/* Key handle (ring) */}
        <mesh position={[0, 0.8, 0]}>
          <torusGeometry args={[0.35, 0.08, 16, 32]} />
          <meshStandardMaterial
            color={metal}
            metalness={0.9}
            roughness={0.2}
            emissive={accent}
            emissiveIntensity={isHovered ? 0.3 : 0.1}
          />
        </mesh>
        
        {/* Handle decoration */}
        <mesh position={[0, 0.8, 0]}>
          <torusGeometry args={[0.25, 0.04, 12, 24]} />
          <meshStandardMaterial
            color={accent}
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
        
        {/* Gemstone */}
        <mesh position={[0, 0.8, 0.1]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color={gem}
            metalness={0.3}
            roughness={0.1}
            emissive={gem}
            emissiveIntensity={isHovered ? 0.8 : 0.3}
            transparent
            opacity={0.9}
          />
        </mesh>
        
        {/* Key shaft */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.8, 0.05]} />
          <meshStandardMaterial
            color={metal}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        
        {/* Key teeth - different patterns for each variant */}
        {variant === 'gold' && (
          <>
            <mesh position={[0.12, -0.25, 0]}>
              <boxGeometry args={[0.15, 0.08, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.1, -0.35, 0]}>
              <boxGeometry args={[0.1, 0.08, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.14, -0.45, 0]}>
              <boxGeometry args={[0.18, 0.08, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
          </>
        )}
        
        {variant === 'silver' && (
          <>
            <mesh position={[0.1, -0.2, 0]}>
              <boxGeometry args={[0.1, 0.12, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.15, -0.35, 0]}>
              <boxGeometry args={[0.2, 0.06, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.1, -0.45, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
          </>
        )}
        
        {variant === 'bronze' && (
          <>
            <mesh position={[0.12, -0.22, 0]}>
              <boxGeometry args={[0.14, 0.1, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.08, -0.38, 0]}>
              <boxGeometry args={[0.06, 0.1, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.16, -0.38, 0]}>
              <boxGeometry args={[0.12, 0.06, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
          </>
        )}
        
        {variant === 'emerald' && (
          <>
            <mesh position={[0.1, -0.2, 0]}>
              <boxGeometry args={[0.1, 0.06, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.14, -0.3, 0]}>
              <boxGeometry args={[0.18, 0.08, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.08, -0.42, 0]}>
              <boxGeometry args={[0.06, 0.12, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.18, -0.42, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.05]} />
              <meshStandardMaterial color={metal} metalness={0.9} roughness={0.2} />
            </mesh>
          </>
        )}
      </group>
    </Float>
  );
};

interface ServiceKey3DProps {
  variant: 'gold' | 'silver' | 'bronze' | 'emerald';
  isHovered: boolean;
  className?: string;
}

export const ServiceKey3D = ({ variant, isHovered, className = '' }: ServiceKey3DProps) => {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 35 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, -3, 2]} intensity={0.5} />
        <pointLight position={[0, 2, 3]} intensity={0.8} color="#ffd700" />
        <pointLight position={[0, -1, 2]} intensity={0.4} color="#ffffff" />
        <KeyModel variant={variant} isHovered={isHovered} />
      </Canvas>
    </div>
  );
};

export default ServiceKey3D;
