import { Suspense, useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Sparkles } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { useInventory, KeyItem } from "@/contexts/InventoryContext";
import * as THREE from "three";

// Key colors for different services
const keyColors: Record<string, { main: string; accent: string; gem: string }> = {
  landing: { main: "#d4af37", accent: "#f4d03f", gem: "#e74c3c" }, // Gold + Ruby
  corporate: { main: "#c0c0c0", accent: "#e8e8e8", gem: "#3498db" }, // Silver + Sapphire
  ecommerce: { main: "#cd7f32", accent: "#daa520", gem: "#2ecc71" }, // Bronze + Emerald
  webapp: { main: "#b87333", accent: "#da8a67", gem: "#9b59b6" }, // Copper + Amethyst
  ads: { main: "#ffd700", accent: "#ffec8b", gem: "#e67e22" }, // Pure Gold + Topaz
  license: { main: "#4a4a4a", accent: "#6a6a6a", gem: "#1abc9c" }, // Iron + Turquoise
  frdo: { main: "#8b4513", accent: "#a0522d", gem: "#f1c40f" }, // Bronze + Citrine
};

// 3D Key component with unique design per service
function Key3D({ 
  keyId, 
  position, 
  rotation, 
  scale = 1,
  animate = false 
}: { 
  keyId: string; 
  position: [number, number, number]; 
  rotation: [number, number, number];
  scale?: number;
  animate?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = keyColors[keyId] || keyColors.landing;
  
  const mainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.main),
    metalness: 0.9,
    roughness: 0.1,
    emissive: new THREE.Color(colors.main),
    emissiveIntensity: 0.1,
  }), [colors.main]);

  const accentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.accent),
    metalness: 0.8,
    roughness: 0.2,
  }), [colors.accent]);

  const gemMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.gem),
    metalness: 0.3,
    roughness: 0.1,
    emissive: new THREE.Color(colors.gem),
    emissiveIntensity: 0.5,
  }), [colors.gem]);

  useFrame((state) => {
    if (groupRef.current && animate) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  // Different key blade patterns based on service
  const getBladePattern = () => {
    switch (keyId) {
      case 'landing':
        return [0.08, 0.06, 0.04, 0.07, 0.05];
      case 'corporate':
        return [0.05, 0.08, 0.05, 0.08, 0.05];
      case 'ecommerce':
        return [0.03, 0.06, 0.09, 0.06, 0.03];
      case 'webapp':
        return [0.07, 0.04, 0.07, 0.04, 0.07];
      default:
        return [0.06, 0.05, 0.07, 0.04, 0.06];
    }
  };

  const bladePattern = getBladePattern();

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Key bow (handle) - ornate ring */}
      <mesh position={[0, 0, 0]} material={mainMaterial}>
        <torusGeometry args={[0.15, 0.04, 16, 32]} />
      </mesh>
      
      {/* Decorative inner ring */}
      <mesh position={[0, 0, 0]} material={accentMaterial}>
        <torusGeometry args={[0.1, 0.02, 16, 32]} />
      </mesh>
      
      {/* Gem in center of bow */}
      <mesh position={[0, 0, 0.03]} material={gemMaterial}>
        <octahedronGeometry args={[0.05]} />
      </mesh>
      
      {/* Key shaft */}
      <mesh position={[0, -0.35, 0]} material={mainMaterial}>
        <boxGeometry args={[0.06, 0.5, 0.03]} />
      </mesh>
      
      {/* Decorative collar */}
      <mesh position={[0, -0.12, 0]} material={accentMaterial}>
        <boxGeometry args={[0.1, 0.04, 0.05]} />
      </mesh>
      
      {/* Key blade with unique teeth pattern */}
      <mesh position={[0.05, -0.55, 0]} material={mainMaterial}>
        <boxGeometry args={[0.15, 0.12, 0.02]} />
      </mesh>
      
      {/* Teeth */}
      {bladePattern.map((height, i) => (
        <mesh 
          key={i} 
          position={[0.02 + i * 0.03, -0.62 - height / 2, 0]} 
          material={mainMaterial}
        >
          <boxGeometry args={[0.02, height, 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

// Animated key inserting into lock
function AnimatedKey({ 
  keyId, 
  phase 
}: { 
  keyId: string; 
  phase: 'approaching' | 'inserting' | 'turning' | 'done';
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [keyRotation, setKeyRotation] = useState(0);
  const [keyPosition, setKeyPosition] = useState<[number, number, number]>([0, 2, 2]);
  const targetRotation = useRef(0);
  const targetPosition = useRef<[number, number, number]>([0, 2, 2]);

  useEffect(() => {
    switch (phase) {
      case 'approaching':
        targetPosition.current = [0, 0.3, 1.2];
        targetRotation.current = 0;
        break;
      case 'inserting':
        targetPosition.current = [0, 0.1, 0.7];
        targetRotation.current = 0;
        break;
      case 'turning':
        targetPosition.current = [0, 0.1, 0.7];
        targetRotation.current = Math.PI / 2;
        break;
      case 'done':
        targetPosition.current = [0, 0.1, 0.7];
        targetRotation.current = Math.PI / 2;
        break;
    }
  }, [phase]);

  useFrame((state, delta) => {
    // Smooth position interpolation
    setKeyPosition(prev => [
      THREE.MathUtils.lerp(prev[0], targetPosition.current[0], delta * 3),
      THREE.MathUtils.lerp(prev[1], targetPosition.current[1], delta * 3),
      THREE.MathUtils.lerp(prev[2], targetPosition.current[2], delta * 3),
    ]);
    
    // Smooth rotation interpolation
    setKeyRotation(prev => THREE.MathUtils.lerp(prev, targetRotation.current, delta * 4));
  });

  if (phase === 'done') return null;

  return (
    <group ref={groupRef} position={keyPosition} rotation={[Math.PI / 2, 0, keyRotation]}>
      <Key3D 
        keyId={keyId} 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]} 
        scale={1.5}
      />
      
      {/* Glow effect */}
      <pointLight position={[0, 0, 0.2]} color="#d4af37" intensity={2} distance={1} />
    </group>
  );
}

// Chest model with animated lid
function ChestModel({ 
  isOpen, 
  unlockPhase,
  activeKeyId 
}: { 
  isOpen: boolean; 
  unlockPhase: 'idle' | 'approaching' | 'inserting' | 'turning' | 'opening' | 'done';
  activeKeyId: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Group>(null);
  const [lockVisible, setLockVisible] = useState(true);
  const [innerGlowIntensity, setInnerGlowIntensity] = useState(0);

  // Hide lock after turning
  useEffect(() => {
    if (unlockPhase === 'opening' || unlockPhase === 'done') {
      setLockVisible(false);
    } else if (unlockPhase === 'idle') {
      setLockVisible(true);
    }
  }, [unlockPhase]);

  useFrame((state, delta) => {
    if (lidRef.current) {
      // Only open after turning phase
      const shouldOpen = unlockPhase === 'opening' || unlockPhase === 'done' || isOpen;
      const targetAngle = shouldOpen ? -Math.PI * 0.65 : 0;
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x, 
        targetAngle, 
        delta * (shouldOpen ? 2 : 4)
      );
    }
    
    // Animate inner glow
    const targetGlow = (unlockPhase === 'opening' || unlockPhase === 'done' || isOpen) ? 3 : 0;
    setInnerGlowIntensity(prev => THREE.MathUtils.lerp(prev, targetGlow, delta * 2));
    
    // Chest idle animation
    if (groupRef.current && unlockPhase === 'idle' && !isOpen) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.015 - 0.3;
    }
    
    // Shake during turning
    if (groupRef.current && unlockPhase === 'turning') {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 30) * 0.02;
    } else if (groupRef.current) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 5);
    }
  });

  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(45, 80%, 55%)"),
    metalness: 0.85,
    roughness: 0.15,
    emissive: new THREE.Color("hsl(45, 80%, 30%)"),
    emissiveIntensity: 0.15,
  }), []);

  const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#5a4332"),
    metalness: 0.05,
    roughness: 0.85,
  }), []);

  const darkWoodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#3d2817"),
    metalness: 0.05,
    roughness: 0.9,
  }), []);

  const velvetMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#8B0000"),
    metalness: 0,
    roughness: 1,
  }), []);

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={0.85}>
      {/* Base of chest */}
      <mesh position={[0, 0, 0]} material={woodMaterial} castShadow receiveShadow>
        <boxGeometry args={[2, 1, 1.2]} />
      </mesh>
      
      {/* Inner velvet lining */}
      <mesh position={[0, 0.1, 0]} material={velvetMaterial}>
        <boxGeometry args={[1.85, 0.85, 1.05]} />
      </mesh>
      
      {/* Front panel with wood grain */}
      <mesh position={[0, 0, 0.605]} material={darkWoodMaterial}>
        <boxGeometry args={[1.9, 0.9, 0.02]} />
      </mesh>
      
      {/* Gold trim - bottom */}
      <mesh position={[0, -0.5, 0]} material={goldMaterial}>
        <boxGeometry args={[2.08, 0.1, 1.28]} />
      </mesh>
      
      {/* Gold trim - top edge */}
      <mesh position={[0, 0.5, 0]} material={goldMaterial}>
        <boxGeometry args={[2.08, 0.06, 1.28]} />
      </mesh>
      
      {/* Gold corner brackets */}
      {[
        [-0.97, -0.2, 0.58], [0.97, -0.2, 0.58], 
        [-0.97, -0.2, -0.58], [0.97, -0.2, -0.58]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} material={goldMaterial}>
          <boxGeometry args={[0.12, 0.7, 0.12]} />
        </mesh>
      ))}
      
      {/* Decorative gold rivets */}
      {[
        [-0.7, 0.3, 0.62], [0.7, 0.3, 0.62],
        [-0.7, -0.3, 0.62], [0.7, -0.3, 0.62],
      ].map((pos, i) => (
        <mesh key={`rivet-${i}`} position={pos as [number, number, number]} material={goldMaterial}>
          <sphereGeometry args={[0.04, 16, 16]} />
        </mesh>
      ))}
      
      {/* Lock plate */}
      {lockVisible && (
        <group ref={lockRef} position={[0, 0.1, 0.63]}>
          {/* Lock base plate */}
          <mesh rotation={[0, 0, 0]} material={goldMaterial}>
            <boxGeometry args={[0.25, 0.3, 0.04]} />
          </mesh>
          {/* Keyhole */}
          <mesh position={[0, -0.02, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Keyhole slot */}
          <mesh position={[0, -0.08, 0.025]}>
            <boxGeometry args={[0.02, 0.08, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      )}
      
      {/* Lid group - pivots from back */}
      <group ref={lidRef} position={[0, 0.5, -0.55]}>
        {/* Lid main body */}
        <mesh position={[0, 0.22, 0.55]} material={woodMaterial} castShadow>
          <boxGeometry args={[2, 0.44, 1.2]} />
        </mesh>
        
        {/* Lid curved top */}
        <mesh position={[0, 0.44, 0.55]} rotation={[0, 0, Math.PI / 2]} material={woodMaterial}>
          <cylinderGeometry args={[0.55, 0.55, 2, 24, 1, false, 0, Math.PI]} />
        </mesh>
        
        {/* Gold bands on lid */}
        {[-0.5, 0, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0.6]} material={goldMaterial}>
            <boxGeometry args={[0.08, 0.5, 0.06]} />
          </mesh>
        ))}
        
        {/* Lid front panel */}
        <mesh position={[0, 0.22, 1.155]} material={darkWoodMaterial}>
          <boxGeometry args={[1.9, 0.38, 0.02]} />
        </mesh>
        
        {/* Gold trim on lid edge */}
        <mesh position={[0, 0.02, 1.16]} material={goldMaterial}>
          <boxGeometry args={[2.08, 0.06, 0.04]} />
        </mesh>
      </group>
      
      {/* Animated key during unlock sequence */}
      {activeKeyId && unlockPhase !== 'idle' && unlockPhase !== 'done' && (
        <AnimatedKey keyId={activeKeyId} phase={unlockPhase as any} />
      )}
      
      {/* Inner glow when opening */}
      <pointLight 
        position={[0, 0.3, 0]} 
        color="#d4af37" 
        intensity={innerGlowIntensity} 
        distance={2.5} 
      />
      
      {/* Sparkles when fully open */}
      {(unlockPhase === 'done' || isOpen) && (
        <Sparkles
          count={60}
          scale={[2.2, 1.8, 1.8]}
          size={4}
          speed={0.4}
          opacity={0.9}
          color="#d4af37"
        />
      )}
    </group>
  );
}

function ChestScene({ 
  isOpen, 
  unlockPhase,
  activeKeyId 
}: { 
  isOpen: boolean; 
  unlockPhase: 'idle' | 'approaching' | 'inserting' | 'turning' | 'opening' | 'done';
  activeKeyId: string | null;
}) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} color="#fff5e6" castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#b3c7ff" />
      <spotLight
        position={[0, 6, 2]}
        angle={0.35}
        penumbra={0.6}
        intensity={1.2}
        color="#d4af37"
        castShadow
      />
      
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
        <ChestModel isOpen={isOpen} unlockPhase={unlockPhase} activeKeyId={activeKeyId} />
      </Float>
      
      {/* Ground with reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial
          color="#080808"
          metalness={0.9}
          roughness={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={Math.PI / 5}
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
  const [unlockPhase, setUnlockPhase] = useState<'idle' | 'approaching' | 'inserting' | 'turning' | 'opening' | 'done'>('idle');
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);

  // Sync with controlled prop
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      if (controlledIsOpen) {
        setUnlockPhase('done');
      }
    }
  }, [controlledIsOpen]);

  // Handle key activation - full unlock sequence
  useEffect(() => {
    if (activeKeyForChest && !isOpen && unlockPhase === 'idle') {
      setActiveKeyId(activeKeyForChest.id);
      
      // Phase 1: Key approaches
      setUnlockPhase('approaching');
      
      setTimeout(() => {
        // Phase 2: Key inserts into lock
        setUnlockPhase('inserting');
        
        setTimeout(() => {
          // Phase 3: Key turns
          setUnlockPhase('turning');
          
          setTimeout(() => {
            // Phase 4: Chest opens
            setUnlockPhase('opening');
            useKey(activeKeyForChest.id);
            setActiveKeyForChest(null);
            setShowParticles(true);
            
            setTimeout(() => {
              // Phase 5: Done
              setUnlockPhase('done');
              setIsOpen(true);
              setActiveKeyId(null);
              onOpen?.();
              
              setTimeout(() => setShowParticles(false), 2500);
            }, 1200);
          }, 800);
        }, 600);
      }, 700);
    }
  }, [activeKeyForChest, isOpen, unlockPhase, onOpen, setActiveKeyForChest, useKey]);

  return (
    <div className="relative w-full h-[400px] md:h-[500px]">
      {/* Drop zone indicator */}
      <div
        id="chest-drop-zone"
        className="absolute inset-0 rounded-lg transition-all duration-300"
      >
        {keys.length > 0 && !isOpen && unlockPhase === 'idle' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-primary/30 z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Lock className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm text-muted-foreground">
              Нажмите на ключ в инвентаре
            </span>
          </div>
        )}
      </div>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.8, 4.5], fov: 40 }}
        shadows
        className="rounded-lg"
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ChestScene isOpen={isOpen} unlockPhase={unlockPhase} activeKeyId={activeKeyId} />
        </Suspense>
      </Canvas>
      
      {/* Phase indicator during unlock */}
      <AnimatePresence>
        {unlockPhase !== 'idle' && unlockPhase !== 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="px-6 py-3 bg-card/90 backdrop-blur-md rounded-lg border border-primary/40 shadow-[0_0_30px_hsl(45_80%_55%/0.3)]">
              <motion.span 
                className="text-primary font-medium"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {unlockPhase === 'approaching' && '🔑 Ключ подлетает...'}
                {unlockPhase === 'inserting' && '🔐 Вставляем в замок...'}
                {unlockPhase === 'turning' && '🔄 Поворачиваем...'}
                {unlockPhase === 'opening' && '✨ Открываем!'}
              </motion.span>
            </div>
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
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  left: '50%',
                  top: '55%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  left: `${50 + (Math.random() - 0.5) * 120}%`,
                  top: `${55 + (Math.random() - 0.5) * 100}%`,
                  scale: Math.random() * 2 + 0.5,
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.4,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_hsl(45_80%_55%)]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Status indicator */}
      <motion.div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-primary/20"
        animate={isOpen ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        {isOpen || unlockPhase === 'done' ? (
          <>
            <Unlock className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Сундук открыт!</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Сундук закрыт</span>
          </>
        )}
      </motion.div>
    </div>
  );
}
