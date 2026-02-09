import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, Sparkles, useGLTF, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Lock, Unlock, Sparkles as SparklesIcon } from "lucide-react";
import { useInventory } from "@/contexts/InventoryContext";
import * as THREE from "three";

// Stylized 3D Chest made with primitives (no external model needed)
function ChestModel({ isOpen, isUnlocking }: { isOpen: boolean; isUnlocking: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const [lidAngle, setLidAngle] = useState(0);

  // Animate lid opening
  useFrame((state, delta) => {
    if (lidRef.current) {
      const targetAngle = isOpen ? -Math.PI * 0.6 : 0;
      const currentAngle = lidRef.current.rotation.x;
      lidRef.current.rotation.x = THREE.MathUtils.lerp(currentAngle, targetAngle, delta * 3);
    }
    
    // Subtle hover animation
    if (groupRef.current && !isOpen) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.02 - 0.3;
    }
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(45, 80%, 55%)"),
    metalness: 0.8,
    roughness: 0.2,
    emissive: new THREE.Color("hsl(45, 80%, 30%)"),
    emissiveIntensity: 0.2,
  });

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#4a3728"),
    metalness: 0.1,
    roughness: 0.8,
  });

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2d1f16"),
    metalness: 0.1,
    roughness: 0.9,
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={0.8}>
      {/* Base of chest */}
      <mesh position={[0, 0, 0]} material={woodMaterial}>
        <boxGeometry args={[2, 1, 1.2]} />
      </mesh>
      
      {/* Front panel */}
      <mesh position={[0, 0, 0.61]} material={darkWoodMaterial}>
        <boxGeometry args={[1.9, 0.9, 0.02]} />
      </mesh>
      
      {/* Gold trim - bottom */}
      <mesh position={[0, -0.5, 0]} material={goldMaterial}>
        <boxGeometry args={[2.1, 0.08, 1.3]} />
      </mesh>
      
      {/* Gold trim - top edge */}
      <mesh position={[0, 0.5, 0]} material={goldMaterial}>
        <boxGeometry args={[2.1, 0.05, 1.3]} />
      </mesh>
      
      {/* Gold corner pieces */}
      {[[-0.95, -0.25, 0.6], [0.95, -0.25, 0.6], [-0.95, -0.25, -0.6], [0.95, -0.25, -0.6]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} material={goldMaterial}>
          <boxGeometry args={[0.15, 0.6, 0.15]} />
        </mesh>
      ))}
      
      {/* Lock plate */}
      {!isOpen && (
        <mesh position={[0, 0.1, 0.65]} rotation={[Math.PI / 2, 0, 0]} material={goldMaterial}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
        </mesh>
      )}
      
      {/* Lid group */}
      <group ref={lidRef} position={[0, 0.5, -0.55]}>
        {/* Lid main body (curved top) */}
        <mesh position={[0, 0.25, 0.55]} material={woodMaterial}>
          <boxGeometry args={[2, 0.5, 1.2]} />
        </mesh>
        
        {/* Lid curved top */}
        <mesh position={[0, 0.5, 0.55]} rotation={[0, 0, Math.PI / 2]} material={woodMaterial}>
          <cylinderGeometry args={[0.6, 0.6, 2, 16, 1, false, 0, Math.PI]} />
        </mesh>
        
        {/* Gold band on lid */}
        <mesh position={[0, 0.35, 0.65]} material={goldMaterial}>
          <boxGeometry args={[2.1, 0.08, 0.05]} />
        </mesh>
        
        {/* Lid front panel */}
        <mesh position={[0, 0.25, 1.16]} material={darkWoodMaterial}>
          <boxGeometry args={[1.9, 0.4, 0.02]} />
        </mesh>
      </group>
      
      {/* Inner glow when opening */}
      {isOpen && (
        <pointLight position={[0, 0.2, 0]} color="hsl(45, 80%, 55%)" intensity={2} distance={2} />
      )}
      
      {/* Sparkles when open */}
      {isOpen && (
        <Sparkles
          count={50}
          scale={[2, 1.5, 1.5]}
          size={3}
          speed={0.5}
          opacity={0.8}
          color="hsl(45, 80%, 55%)"
        />
      )}
    </group>
  );
}

function ChestScene({ isOpen, isUnlocking }: { isOpen: boolean; isUnlocking: boolean }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="hsl(45, 30%, 90%)" />
      <directionalLight position={[-3, 3, -3]} intensity={0.5} color="hsl(220, 50%, 70%)" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.4}
        penumbra={0.5}
        intensity={1}
        color="hsl(45, 80%, 55%)"
        castShadow
      />
      
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
        <ChestModel isOpen={isOpen} isUnlocking={isUnlocking} />
      </Float>
      
      {/* Ground reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.8}
          roughness={0.4}
          transparent
          opacity={0.5}
        />
      </mesh>
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />
    </>
  );
}

interface TreasureChest3DProps {
  onOpen?: () => void;
  isOpen?: boolean;
}

export function TreasureChest3D({ onOpen, isOpen: controlledIsOpen }: TreasureChest3DProps) {
  const { activeKeyForChest, setActiveKeyForChest, useKey, keys } = useInventory();
  const [isOpen, setIsOpen] = useState(controlledIsOpen || false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Sync with controlled prop
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Handle key drop
  useEffect(() => {
    if (activeKeyForChest && !isOpen) {
      setIsUnlocking(true);
      
      // Animate unlocking sequence
      setTimeout(() => {
        useKey(activeKeyForChest.id);
        setActiveKeyForChest(null);
        setIsUnlocking(false);
        setIsOpen(true);
        setShowParticles(true);
        onOpen?.();
        
        // Hide particles after animation
        setTimeout(() => setShowParticles(false), 2000);
      }, 1500);
    }
  }, [activeKeyForChest, isOpen, onOpen, setActiveKeyForChest, useKey]);

  return (
    <div className="relative w-full h-[400px] md:h-[500px]">
      {/* Drop zone indicator */}
      <div
        id="chest-drop-zone"
        className={`absolute inset-0 rounded-lg transition-all duration-300 ${
          keys.length > 0 && !isOpen
            ? 'border-2 border-dashed border-primary/30 hover:border-primary/50'
            : ''
        }`}
      >
        {keys.length > 0 && !isOpen && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-primary/30 z-10">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Перетащите ключ сюда
            </span>
          </div>
        )}
      </div>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        shadows
        className="rounded-lg"
      >
        <Suspense fallback={null}>
          <ChestScene isOpen={isOpen} isUnlocking={isUnlocking} />
        </Suspense>
      </Canvas>
      
      {/* Unlocking overlay */}
      <AnimatePresence>
        {isUnlocking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg z-20"
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <KeyRound className="w-12 h-12 text-primary" />
                <motion.div
                  className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>
              <span className="text-primary font-medium">Открываем...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Golden particles burst */}
      <AnimatePresence>
        {showParticles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden z-10"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  left: '50%',
                  top: '60%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  left: `${50 + (Math.random() - 0.5) * 100}%`,
                  top: `${60 + (Math.random() - 0.5) * 80}%`,
                  scale: Math.random() * 1.5 + 0.5,
                  opacity: 0,
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  delay: Math.random() * 0.3,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_hsl(45_80%_55%)]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Status indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-primary/20">
        {isOpen ? (
          <>
            <Unlock className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Сундук открыт</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Сундук закрыт</span>
          </>
        )}
      </div>
    </div>
  );
}
