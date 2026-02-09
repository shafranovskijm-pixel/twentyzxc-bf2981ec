import { useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";

interface MultiAngleProductProps {
  images: string[];
  autoRotate?: boolean;
}

// 3D Product cylinder with multiple images around it
function MultiAngleProduct({ images, autoRotate = false }: MultiAngleProductProps) {
  const groupRef = useRef<THREE.Group>(null);
  const textures = useLoader(THREE.TextureLoader, images);
  
  // Configure textures
  textures.forEach(texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  });

  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.008;
    }
  });

  const imageCount = images.length;
  const angleStep = (Math.PI * 2) / imageCount;
  const radius = 1.2; // Distance from center

  return (
    <group ref={groupRef}>
      {textures.map((texture, index) => {
        const angle = index * angleStep;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <mesh 
            key={index}
            position={[x, 0.3, z]}
            rotation={[0, -angle + Math.PI, 0]}
          >
            <planeGeometry args={[1.8, 2.4]} />
            <meshStandardMaterial 
              map={texture}
              transparent
              side={THREE.DoubleSide}
              metalness={0.1}
              roughness={0.4}
            />
          </mesh>
        );
      })}
      
      {/* Central connecting glow */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 2.2, 32]} />
        <meshStandardMaterial 
          color="#10b981"
          transparent
          opacity={0.1}
          emissive="#10b981"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

interface SingleImageProductProps {
  imageUrl: string;
  autoRotate?: boolean;
}

// Fallback for single image - create a simple rotating plane
function SingleImageProduct({ imageUrl, autoRotate = false }: SingleImageProductProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  useFrame(() => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += 0.008;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.3, 0]}>
      <planeGeometry args={[2.2, 2.8]} />
      <meshStandardMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
}

// Jewelry pedestal for display
function JewelryPedestal() {
  return (
    <group position={[0, -1.2, 0]}>
      {/* Main pedestal */}
      <mesh>
        <cylinderGeometry args={[1.5, 1.7, 0.25, 64]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Gold rim top */}
      <mesh position={[0, 0.125, 0]}>
        <torusGeometry args={[1.5, 0.025, 16, 64]} />
        <meshStandardMaterial 
          color="#c9a033"
          metalness={1}
          roughness={0.15}
          emissive="#c9a033"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Gold rim bottom */}
      <mesh position={[0, -0.125, 0]}>
        <torusGeometry args={[1.7, 0.02, 16, 64]} />
        <meshStandardMaterial 
          color="#c9a033"
          metalness={1}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

interface Product3DViewerProps {
  imageUrl: string;
  images?: string[]; // Multiple images for 360° view
  onClose?: () => void;
  className?: string;
}

export const Product3DViewer = ({ imageUrl, images, onClose, className = "" }: Product3DViewerProps) => {
  const [autoRotate, setAutoRotate] = useState(true);
  
  // Use multiple images if provided, otherwise just the single image
  const hasMultipleImages = images && images.length > 1;

  return (
    <div className={`relative w-full h-full min-h-[300px] bg-gradient-to-b from-zinc-900 to-black rounded-2xl overflow-hidden ${className}`}>
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 1.5, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <spotLight 
            position={[5, 5, 5]} 
            angle={0.4} 
            penumbra={1} 
            intensity={1.2}
            castShadow
          />
          <spotLight 
            position={[-5, 5, -5]} 
            angle={0.4} 
            penumbra={1} 
            intensity={0.6}
          />
          <pointLight position={[0, 4, 0]} intensity={0.4} color="#10b981" />
          <pointLight position={[3, 0, 3]} intensity={0.2} color="#ffffff" />
          
          {/* Product - Multi-angle or single */}
          {hasMultipleImages ? (
            <MultiAngleProduct images={images} autoRotate={autoRotate} />
          ) : (
            <SingleImageProduct imageUrl={imageUrl} autoRotate={autoRotate} />
          )}
          
          <JewelryPedestal />
          
          {/* Environment for reflections */}
          <Environment preset="studio" />
          
          {/* Shadow beneath product */}
          <ContactShadows 
            position={[0, -1.1, 0]} 
            opacity={0.6} 
            blur={2.5} 
            far={4}
          />
          
          {/* Controls */}
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={10}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors pointer-events-auto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* 3D badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 rounded-full border-2 border-dashed border-white"
          />
          {hasMultipleImages ? `3D • ${images.length} ракурсов` : "3D"}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium transition-all ${
            autoRotate 
              ? "bg-emerald-500 text-white" 
              : "bg-black/60 text-white/70 hover:bg-black/80"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {autoRotate ? "Авто" : "Ручное"}
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-xs text-white/50 text-center">
        Перетащите для вращения • Колёсико для масштаба
      </div>
    </div>
  );
};

export default Product3DViewer;
