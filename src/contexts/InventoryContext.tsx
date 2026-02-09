import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export interface KeyItem {
  id: string;
  label: string;
  collectedAt: number;
}

export interface FlyingKeyState {
  keyId: string;
  label: string;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  phase: 'flying' | 'arriving' | 'done';
}

interface InventoryContextType {
  keys: KeyItem[];
  addKey: (keyId: string, label: string, startPosition?: { x: number; y: number }) => void;
  removeKey: (keyId: string) => void;
  useKey: (keyId: string) => KeyItem | null;
  isKeyCollected: (keyId: string) => boolean;
  flyingKey: FlyingKeyState | null;
  setFlyingKey: (state: FlyingKeyState | null) => void;
  inventoryRef: React.RefObject<HTMLDivElement> | null;
  setInventoryRef: (ref: React.RefObject<HTMLDivElement>) => void;
  chestUnlocked: boolean;
  setChestUnlocked: (unlocked: boolean) => void;
  activeKeyForChest: KeyItem | null;
  setActiveKeyForChest: (key: KeyItem | null) => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEY = 'inventory-keys';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<KeyItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [flyingKey, setFlyingKey] = useState<FlyingKeyState | null>(null);
  const [inventoryRef, setInventoryRef] = useState<React.RefObject<HTMLDivElement> | null>(null);
  const [chestUnlocked, setChestUnlocked] = useState(false);
  const [activeKeyForChest, setActiveKeyForChest] = useState<KeyItem | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  }, [keys]);

  const addKey = useCallback((keyId: string, label: string, startPosition?: { x: number; y: number }) => {
    // Check if already collected
    if (keys.some(k => k.id === keyId)) return;

    const newKey: KeyItem = {
      id: keyId,
      label,
      collectedAt: Date.now(),
    };

    // If we have a start position and inventory ref, trigger flying animation
    if (startPosition && inventoryRef?.current) {
      const inventoryRect = inventoryRef.current.getBoundingClientRect();
      const endPosition = {
        x: inventoryRect.left + inventoryRect.width / 2,
        y: inventoryRect.top + inventoryRect.height / 2,
      };

      setFlyingKey({
        keyId,
        label,
        startPosition,
        endPosition,
        phase: 'flying',
      });

      // Add key after animation completes
      setTimeout(() => {
        setFlyingKey(prev => prev ? { ...prev, phase: 'arriving' } : null);
        setTimeout(() => {
          setKeys(prev => [...prev, newKey]);
          setFlyingKey(null);
        }, 300);
      }, 800);
    } else {
      // Add immediately without animation
      setKeys(prev => [...prev, newKey]);
    }
  }, [keys, inventoryRef]);

  const removeKey = useCallback((keyId: string) => {
    setKeys(prev => prev.filter(k => k.id !== keyId));
  }, []);

  const useKey = useCallback((keyId: string): KeyItem | null => {
    const key = keys.find(k => k.id === keyId);
    if (key) {
      removeKey(keyId);
      return key;
    }
    return null;
  }, [keys, removeKey]);

  const isKeyCollected = useCallback((keyId: string) => {
    return keys.some(k => k.id === keyId);
  }, [keys]);

  return (
    <InventoryContext.Provider
      value={{
        keys,
        addKey,
        removeKey,
        useKey,
        isKeyCollected,
        flyingKey,
        setFlyingKey,
        inventoryRef,
        setInventoryRef,
        chestUnlocked,
        setChestUnlocked,
        activeKeyForChest,
        setActiveKeyForChest,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
}
