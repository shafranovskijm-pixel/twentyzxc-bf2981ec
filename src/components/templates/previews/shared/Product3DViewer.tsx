import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";

interface ProductPlaneProps {
  imageUrl: string;
  autoRotate?: boolean;
}

// 3D Product as a curved surface for realistic jewelry display
function ProductDisplay({ imageUrl, autoRotate = false }: ProductPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Make texture look better
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group>
      {/* Main product image on a slightly curved plane */}
      <mesh ref={meshRef} position={[0, 0.2, 0]}>
        <planeGeometry args={[2.5, 3, 32, 32]} />
        <meshStandardMaterial 
          map={texture} 
          transparent 
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
      
      {/* Reflective base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <circleGeometry args={[2, 64]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// Jewelry pedestal for display
function JewelryPedestal() {
  return (
    <group position={[0, -1.5, 0]}>
      {/* Main pedestal */}
      <mesh>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 64]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Gold rim */}
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[1.2, 0.02, 16, 64]} />
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
  onClose?: () => void;
  className?: string;
}

export const Product3DViewer = ({ imageUrl, onClose, className = "" }: Product3DViewerProps) => {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className={`relative w-full h-full min-h-[300px] bg-gradient-to-b from-zinc-900 to-black rounded-2xl overflow-hidden ${className}`}>
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 1, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <spotLight 
            position={[5, 5, 5]} 
            angle={0.3} 
            penumbra={1} 
            intensity={1}
            castShadow
          />
          <spotLight 
            position={[-5, 5, -5]} 
            angle={0.3} 
            penumbra={1} 
            intensity={0.5}
          />
          <pointLight position={[0, 3, 0]} intensity={0.3} color="#10b981" />
          
          {/* Product */}
          <ProductDisplay imageUrl={imageUrl} autoRotate={autoRotate} />
          <JewelryPedestal />
          
          {/* Environment for reflections */}
          <Environment preset="studio" />
          
          {/* Shadow beneath product */}
          <ContactShadows 
            position={[0, -1.35, 0]} 
            opacity={0.5} 
            blur={2} 
            far={4}
          />
          
          {/* Controls */}
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
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
        
        {/* 360 badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 rounded-full border-2 border-dashed border-white"
          />
          3D
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
