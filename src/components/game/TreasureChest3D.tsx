import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Sparkles } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { useInventory, KeyItem } from "@/contexts/InventoryContext";
import * as THREE from "three";

// Sound effect for chest opening
const playChestSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create multiple oscillators for a rich "chest opening" sound
  const createTone = (freq: number, startTime: number, duration: number, gain: number) => {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + startTime);
    osc.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
    gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
    
    osc.start(audioContext.currentTime + startTime);
    osc.stop(audioContext.currentTime + startTime + duration);
  };
  
  // Creak sound (low frequency sweep)
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  osc1.connect(gain1);
  gain1.connect(audioContext.destination);
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(80, audioContext.currentTime);
  osc1.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.3);
  osc1.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.5);
  gain1.gain.setValueAtTime(0.1, audioContext.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
  osc1.start();
  osc1.stop(audioContext.currentTime + 0.5);
  
  // Magic sparkle tones
  createTone(800, 0.1, 0.3, 0.08);
  createTone(1200, 0.15, 0.25, 0.06);
  createTone(1600, 0.2, 0.3, 0.04);
  createTone(2000, 0.25, 0.2, 0.03);
  
  // Deep thud
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  osc2.connect(gain2);
  gain2.connect(audioContext.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(60, audioContext.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.2);
  gain2.gain.setValueAtTime(0.15, audioContext.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
  osc2.start();
  osc2.stop(audioContext.currentTime + 0.3);
};

// Key colors for different services
const keyColors: Record<string, { main: string; accent: string; gem: string }> = {
  landing: { main: "#d4af37", accent: "#f4d03f", gem: "#e74c3c" },
  corporate: { main: "#c0c0c0", accent: "#e8e8e8", gem: "#3498db" },
  ecommerce: { main: "#cd7f32", accent: "#daa520", gem: "#2ecc71" },
  webapp: { main: "#b87333", accent: "#da8a67", gem: "#9b59b6" },
  ads: { main: "#ffd700", accent: "#ffec8b", gem: "#e67e22" },
  license: { main: "#4a4a4a", accent: "#6a6a6a", gem: "#1abc9c" },
  frdo: { main: "#8b4513", accent: "#a0522d", gem: "#f1c40f" },
};

// 3D Key component
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

  const getBladePattern = () => {
    switch (keyId) {
      case 'landing': return [0.08, 0.06, 0.04, 0.07, 0.05];
      case 'corporate': return [0.05, 0.08, 0.05, 0.08, 0.05];
      case 'ecommerce': return [0.03, 0.06, 0.09, 0.06, 0.03];
      case 'webapp': return [0.07, 0.04, 0.07, 0.04, 0.07];
      default: return [0.06, 0.05, 0.07, 0.04, 0.06];
    }
  };

  const bladePattern = getBladePattern();

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0, 0]} material={mainMaterial}>
        <torusGeometry args={[0.15, 0.04, 16, 32]} />
      </mesh>
      <mesh position={[0, 0, 0]} material={accentMaterial}>
        <torusGeometry args={[0.1, 0.02, 16, 32]} />
      </mesh>
      <mesh position={[0, 0, 0.03]} material={gemMaterial}>
        <octahedronGeometry args={[0.05]} />
      </mesh>
      <mesh position={[0, -0.35, 0]} material={mainMaterial}>
        <boxGeometry args={[0.06, 0.5, 0.03]} />
      </mesh>
      <mesh position={[0, -0.12, 0]} material={accentMaterial}>
        <boxGeometry args={[0.1, 0.04, 0.05]} />
      </mesh>
      <mesh position={[0.05, -0.55, 0]} material={mainMaterial}>
        <boxGeometry args={[0.15, 0.12, 0.02]} />
      </mesh>
      {bladePattern.map((height, i) => (
        <mesh key={i} position={[0.02 + i * 0.03, -0.62 - height / 2, 0]} material={mainMaterial}>
          <boxGeometry args={[0.02, height, 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

// Animated key inserting into lock
function AnimatedKey({ keyId, phase }: { keyId: string; phase: 'approaching' | 'inserting' | 'turning' | 'done' }) {
  const groupRef = useRef<THREE.Group>(null);
  const keyMeshRef = useRef<THREE.Group>(null);
  
  // Position animation
  const posY = useRef(1.5);
  const posZ = useRef(2.5);
  // Separate turn rotation (around local axis of the key shaft)
  const turnRotation = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current || !keyMeshRef.current) return;
    
    let targetY = 0.05;
    let targetZ = 0.95;
    let targetTurn = 0;
    
    switch (phase) {
      case 'approaching':
        targetY = 0.3;
        targetZ = 1.6;
        targetTurn = 0;
        break;
      case 'inserting':
        targetY = 0.05;
        targetZ = 0.95;
        targetTurn = 0;
        break;
      case 'turning':
        // Position stays the same, only turn
        targetY = 0.05;
        targetZ = 0.95;
        targetTurn = Math.PI * 0.5; // 90 degrees clockwise
        break;
      case 'done':
        return;
    }
    
    // Smooth movement
    posY.current = THREE.MathUtils.lerp(posY.current, targetY, delta * 4);
    posZ.current = THREE.MathUtils.lerp(posZ.current, targetZ, delta * 4);
    turnRotation.current = THREE.MathUtils.lerp(turnRotation.current, targetTurn, delta * 3);
    
    // Parent group handles position only
    groupRef.current.position.set(0, posY.current, posZ.current);
    // Parent orientation: key tilted forward (blade points into lock)
    groupRef.current.rotation.set(Math.PI * 0.5, 0, 0);
    
    // Child group handles ONLY the turn rotation around the key's shaft axis
    // Rotating around Y in local space = rotating around the shaft
    keyMeshRef.current.rotation.set(0, turnRotation.current, 0);
  });

  if (phase === 'done') return null;

  return (
    <group ref={groupRef}>
      {/* Inner group for turn rotation only */}
      <group ref={keyMeshRef}>
        <Key3D keyId={keyId} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={1.2} />
      </group>
      
      {/* Glow effect */}
      <pointLight 
        position={[0, 0, 0.1]} 
        color="#d4af37" 
        intensity={phase === 'turning' ? 4 : 2} 
        distance={1.5} 
      />
      
      {/* Sparkles during approach */}
      {phase === 'approaching' && (
        <Sparkles count={10} scale={0.5} size={2} speed={0.8} color="#ffd700" />
      )}
    </group>
  );
}

// Simple chest with detailed wood planks
function ChestModel({ 
  isOpen, 
  unlockPhase,
  activeKeyId,
  isHovered
}: { 
  isOpen: boolean; 
  unlockPhase: 'idle' | 'approaching' | 'inserting' | 'turning' | 'opening' | 'done';
  activeKeyId: string | null;
  isHovered: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const [lockVisible, setLockVisible] = useState(true);
  const [innerGlowIntensity, setInnerGlowIntensity] = useState(0);

  useEffect(() => {
    if (unlockPhase === 'opening' || unlockPhase === 'done') {
      setLockVisible(false);
    } else if (unlockPhase === 'idle') {
      setLockVisible(true);
    }
  }, [unlockPhase]);

  useFrame((state, delta) => {
    if (lidRef.current) {
      const shouldOpen = unlockPhase === 'opening' || unlockPhase === 'done' || isOpen;
      const targetAngle = shouldOpen ? -Math.PI * 0.65 : 0;
      lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, targetAngle, delta * (shouldOpen ? 2 : 4));
    }
    
    const targetGlow = (unlockPhase === 'opening' || unlockPhase === 'done' || isOpen) ? 3 : 0;
    setInnerGlowIntensity(prev => THREE.MathUtils.lerp(prev, targetGlow, delta * 2));
    
    if (groupRef.current && unlockPhase === 'idle' && !isOpen) {
      // Hover wiggle animation - more pronounced when hovered
      const wiggleIntensity = isHovered ? 0.08 : 0.03;
      const wiggleSpeed = isHovered ? 3 : 0.5;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * wiggleSpeed) * wiggleIntensity;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * (isHovered ? 4 : 0.8)) * (isHovered ? 0.04 : 0.015) - 0.3;
      
      // Add slight tilt on hover
      if (isHovered) {
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2.5) * 0.03;
      } else {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 5);
      }
    }
    
    if (groupRef.current && unlockPhase === 'turning') {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 30) * 0.02;
    } else if (groupRef.current) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 5);
    }
  });

  // Materials
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d4a84b"),
    metalness: 0.9,
    roughness: 0.12,
    emissive: new THREE.Color("#8b6914"),
    emissiveIntensity: 0.15,
  }), []);

  const darkWood = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2d1a0f"),
    metalness: 0.02,
    roughness: 0.95,
  }), []);

  const mediumWood = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#4a3525"),
    metalness: 0.02,
    roughness: 0.9,
  }), []);

  const lightWood = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#5c4033"),
    metalness: 0.02,
    roughness: 0.85,
  }), []);

  const velvetMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#6B0F1A"),
    metalness: 0,
    roughness: 1,
    emissive: new THREE.Color("#3d0000"),
    emissiveIntensity: 0.1,
  }), []);

  // Plank materials alternating
  const plankMaterials = [darkWood, mediumWood, lightWood, mediumWood];

  // Wood plank helper - creates individual planks
  const renderPlanks = (count: number, width: number, height: number, depth: number, basePos: [number, number, number], axis: 'horizontal' | 'vertical') => {
    const planks = [];
    const gap = 0.008;
    
    if (axis === 'horizontal') {
      const plankHeight = (height - gap * (count - 1)) / count;
      for (let i = 0; i < count; i++) {
        const y = basePos[1] + (i - (count - 1) / 2) * (plankHeight + gap);
        planks.push(
          <mesh key={`plank-h-${i}`} position={[basePos[0], y, basePos[2]]} material={plankMaterials[i % plankMaterials.length]}>
            <boxGeometry args={[width, plankHeight - 0.005, depth]} />
          </mesh>
        );
        // Add groove line between planks
        if (i < count - 1) {
          planks.push(
            <mesh key={`groove-h-${i}`} position={[basePos[0], y + plankHeight / 2 + gap / 2, basePos[2] + 0.001]}>
              <boxGeometry args={[width * 0.98, 0.004, 0.002]} />
              <meshStandardMaterial color="#1a0f08" />
            </mesh>
          );
        }
      }
    }
    
    return planks;
  };

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={0.85}>
      {/* BASE BODY - frame */}
      <mesh position={[0, 0, 0]} material={darkWood} castShadow receiveShadow>
        <boxGeometry args={[2, 1, 1.2]} />
      </mesh>
      
      {/* Inner velvet */}
      <mesh position={[0, 0.08, 0]} material={velvetMaterial}>
        <boxGeometry args={[1.85, 0.88, 1.05]} />
      </mesh>
      
      {/* FRONT PANEL - wooden planks */}
      {renderPlanks(5, 1.9, 0.9, 0.04, [0, 0, 0.6], 'horizontal')}
      
      {/* BACK PANEL - wooden planks */}
      {renderPlanks(5, 1.9, 0.9, 0.04, [0, 0, -0.6], 'horizontal')}
      
      {/* LEFT PANEL - wooden planks */}
      <group rotation={[0, Math.PI / 2, 0]}>
        {renderPlanks(5, 1.1, 0.9, 0.04, [0, 0, 1.0], 'horizontal')}
      </group>
      
      {/* RIGHT PANEL - wooden planks */}
      <group rotation={[0, Math.PI / 2, 0]}>
        {renderPlanks(5, 1.1, 0.9, 0.04, [0, 0, -1.0], 'horizontal')}
      </group>
      
      {/* GOLD BANDS */}
      {/* Bottom band */}
      <mesh position={[0, -0.52, 0]} material={goldMaterial}>
        <boxGeometry args={[2.08, 0.06, 1.28]} />
      </mesh>
      
      {/* Top edge */}
      <mesh position={[0, 0.52, 0]} material={goldMaterial}>
        <boxGeometry args={[2.08, 0.05, 1.28]} />
      </mesh>
      
      {/* Corner posts */}
      {[[-0.98, 0, 0.58], [0.98, 0, 0.58], [-0.98, 0, -0.58], [0.98, 0, -0.58]].map((pos, i) => (
        <mesh key={`corner-${i}`} position={pos as [number, number, number]} material={goldMaterial}>
          <boxGeometry args={[0.08, 1.08, 0.08]} />
        </mesh>
      ))}
      
      {/* Vertical straps on front */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={`strap-${i}`} position={[x, 0, 0.62]} material={goldMaterial}>
          <boxGeometry args={[0.08, 1.0, 0.03]} />
        </mesh>
      ))}
      
      {/* LOCK PLATE */}
      {lockVisible && (
        <group position={[0, 0.05, 0.64]}>
          <mesh material={goldMaterial}>
            <boxGeometry args={[0.28, 0.35, 0.04]} />
          </mesh>
          {/* Keyhole circle */}
          <mesh position={[0, 0.02, 0.025]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
          {/* Keyhole slot */}
          <mesh position={[0, -0.05, 0.025]}>
            <boxGeometry args={[0.015, 0.08, 0.02]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
        </group>
      )}
      
      {/* LID */}
      <group ref={lidRef} position={[0, 0.52, -0.55]}>
        {/* Lid base frame */}
        <mesh position={[0, 0.18, 0.55]} material={darkWood} castShadow>
          <boxGeometry args={[2, 0.36, 1.2]} />
        </mesh>
        
        {/* Lid curved top */}
        <mesh position={[0, 0.38, 0.55]} rotation={[0, 0, Math.PI / 2]} material={mediumWood}>
          <cylinderGeometry args={[0.45, 0.45, 2.02, 32, 1, false, 0, Math.PI]} />
        </mesh>
        
        {/* Lid front planks */}
        {[0.28, 0.14, 0, -0.14].map((y, i) => (
          <mesh key={`lid-plank-${i}`} position={[0, y, 1.15]} material={plankMaterials[i % plankMaterials.length]}>
            <boxGeometry args={[1.88, 0.12, 0.03]} />
          </mesh>
        ))}
        
        {/* Lid gold bands - arched */}
        {[-0.6, 0, 0.6].map((x, i) => (
          <group key={`lid-band-${i}`}>
            <mesh position={[x, 0.18, 1.16]} material={goldMaterial}>
              <boxGeometry args={[0.08, 0.38, 0.03]} />
            </mesh>
            <mesh position={[x, 0.42, 0.55]} rotation={[0, 0, Math.PI / 2]} material={goldMaterial}>
              <torusGeometry args={[0.38, 0.03, 8, 16, Math.PI * 0.85]} />
            </mesh>
          </group>
        ))}
        
        {/* Lid edges */}
        <mesh position={[0, 0, 1.16]} material={goldMaterial}>
          <boxGeometry args={[2.06, 0.04, 0.03]} />
        </mesh>
        <mesh position={[1.01, 0.18, 0.55]} material={goldMaterial}>
          <boxGeometry args={[0.04, 0.38, 1.22]} />
        </mesh>
        <mesh position={[-1.01, 0.18, 0.55]} material={goldMaterial}>
          <boxGeometry args={[0.04, 0.38, 1.22]} />
        </mesh>
      </group>
      
      {/* Inner glow */}
      <pointLight position={[0, 0.3, 0]} color="#d4af37" intensity={innerGlowIntensity} distance={2} />
      
      {/* Show sparkles when open */}
      {(unlockPhase === 'opening' || unlockPhase === 'done' || isOpen) && (
        <Sparkles count={30} scale={1.5} size={3} speed={0.4} color="#d4af37" position={[0, 0.6, 0]} />
      )}
      
      {/* Animated key */}
      {activeKeyId && unlockPhase !== 'idle' && unlockPhase !== 'done' && (
        <AnimatedKey keyId={activeKeyId} phase={unlockPhase as 'approaching' | 'inserting' | 'turning'} />
      )}
    </group>
  );
}

// Main component
export function TreasureChest3D({ onOpen, isOpen, onLockedClick }: { onOpen: () => void; isOpen: boolean; onLockedClick?: () => void }) {
  const { keys, activeKeyForChest, setActiveKeyForChest, removeKey } = useInventory();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [unlockPhase, setUnlockPhase] = useState<'idle' | 'approaching' | 'inserting' | 'turning' | 'opening' | 'done'>('idle');
  const [usedKeyId, setUsedKeyId] = useState<string | null>(null);
  const unlockStartedRef = useRef(false);

  // Handle click on locked chest
  const handleLockedChestClick = () => {
    if (!isOpen && unlockPhase === 'idle' && keys.length === 0 && onLockedClick) {
      onLockedClick();
    }
  };

  // Handle key drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const keyId = e.dataTransfer.getData("keyId");
    if (keyId && !isOpen && unlockPhase === 'idle') {
      triggerUnlock(keyId);
    }
  };

  // Start unlock animation sequence with better timings
  const triggerUnlock = (keyId: string) => {
    if (unlockStartedRef.current) return;
    unlockStartedRef.current = true;
    
    setUsedKeyId(keyId);
    setUnlockPhase('approaching');
    
    // Approach: key flies toward lock (1s)
    setTimeout(() => setUnlockPhase('inserting'), 1000);
    // Insert: key slides into keyhole (0.8s)
    setTimeout(() => setUnlockPhase('turning'), 1800);
    // Turn: key rotates 90 degrees (1.2s)
    setTimeout(() => {
      setUnlockPhase('opening');
      playChestSound(); // Play chest opening sound
      removeKey(keyId);
      onOpen();
    }, 3000);
    // Done: cleanup
    setTimeout(() => {
      setUnlockPhase('done');
      unlockStartedRef.current = false;
    }, 3800);
  };

  // Handle click from inventory
  useEffect(() => {
    if (activeKeyForChest && !isOpen && unlockPhase === 'idle' && !unlockStartedRef.current) {
      const keyId = activeKeyForChest.id;
      setActiveKeyForChest(null);
      triggerUnlock(keyId);
    }
  }, [activeKeyForChest, isOpen, unlockPhase, setActiveKeyForChest]);

  // Reset when chest closes
  useEffect(() => {
    if (!isOpen && unlockPhase === 'done') {
      setUnlockPhase('idle');
      setUsedKeyId(null);
    }
  }, [isOpen, unlockPhase]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isOpen) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        id="chest-drop-zone"
        className={`relative w-full max-w-md aspect-square rounded-lg transition-all duration-300 cursor-pointer ${
          isDragOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleLockedChestClick}
      >
        {/* Ambient glow - enhanced */}
        <div className={`absolute inset-0 rounded-lg transition-all duration-700 ${
          isDragOver || isOpen 
            ? 'bg-gradient-radial from-primary/30 via-primary/10 to-transparent opacity-100' 
            : isHovered
              ? 'bg-gradient-radial from-primary/20 via-primary/5 to-transparent opacity-100'
              : 'bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-50'
        }`} />
        
        {/* Pulsing glow ring when hovered */}
        {isHovered && !isOpen && unlockPhase === 'idle' && (
          <div className="absolute inset-4 rounded-lg border-2 border-primary/30 animate-pulse" />
        )}
        
        {/* Opening glow burst */}
        {(unlockPhase === 'opening' || unlockPhase === 'done') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            className="absolute inset-0 bg-gradient-radial from-primary/40 via-primary/20 to-transparent rounded-lg"
          />
        )}
        
        <Canvas
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={isHovered ? 0.6 : 0.4} />
            <directionalLight position={[5, 5, 5]} intensity={isHovered ? 1.3 : 1} castShadow />
            <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#ffd4a3" />
            <pointLight position={[0, 2, 2]} intensity={isHovered ? 0.8 : 0.5} color="#d4af37" />
            {/* Extra glow light when hovered */}
            {isHovered && (
              <pointLight position={[0, 0, 3]} intensity={0.6} color="#ffd700" distance={5} />
            )}
            
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
              <ChestModel isOpen={isOpen} unlockPhase={unlockPhase} activeKeyId={usedKeyId} isHovered={isHovered || isDragOver} />
            </Float>
            
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2.2}
              minAzimuthAngle={-Math.PI / 6}
              maxAzimuthAngle={Math.PI / 6}
            />
          </Suspense>
        </Canvas>
        
        {/* Status indicator */}
        <AnimatePresence>
          {!isOpen && unlockPhase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50"
            >
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {keys.length > 0 ? "Перетащите ключ" : "Соберите ключ"}
              </span>
            </motion.div>
          )}
          
          {unlockPhase !== 'idle' && unlockPhase !== 'done' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30"
            >
              <motion.div animate={{ rotate: unlockPhase === 'turning' ? 90 : 0 }} transition={{ duration: 0.5 }}>
                <Unlock className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm text-primary font-medium">
                {unlockPhase === 'approaching' && "Ключ приближается..."}
                {unlockPhase === 'inserting' && "Вставляю ключ..."}
                {unlockPhase === 'turning' && "Открываю..."}
                {unlockPhase === 'opening' && "Открыто!"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
