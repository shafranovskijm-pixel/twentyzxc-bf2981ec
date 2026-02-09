import { useState, useCallback, useRef, useEffect } from "react";
import { PlaygroundBlock, PlaygroundSettings, BLOCK_TYPES } from "@/data/playground-effects";

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_SETTINGS: PlaygroundSettings = {
  backgroundColor: "#0a0a0a",
  backgroundPattern: "dots"
};

const MAX_HISTORY = 50;

type Snapshot = {
  blocks: PlaygroundBlock[];
  settings: PlaygroundSettings;
};

export const usePlayground = () => {
  const [blocks, setBlocks] = useState<PlaygroundBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlaygroundSettings>(DEFAULT_SETTINGS);
  const [projectTitle, setProjectTitle] = useState("Мой проект");

  // Undo/Redo history
  const historyRef = useRef<Snapshot[]>([{ blocks: [], settings: DEFAULT_SETTINGS }]);
  const historyIndexRef = useRef(0);
  const skipSnapshotRef = useRef(false);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // Save snapshot after state changes (debounced via effect)
  const pushSnapshot = useCallback((newBlocks: PlaygroundBlock[], newSettings: PlaygroundSettings) => {
    const history = historyRef.current;
    const index = historyIndexRef.current;
    // Truncate any redo history
    historyRef.current = history.slice(0, index + 1);
    historyRef.current.push({
      blocks: JSON.parse(JSON.stringify(newBlocks)),
      settings: JSON.parse(JSON.stringify(newSettings))
    });
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  // Wrap setBlocks to auto-snapshot
  const setBlocksWithHistory = useCallback((updater: PlaygroundBlock[] | ((prev: PlaygroundBlock[]) => PlaygroundBlock[])) => {
    setBlocks(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!skipSnapshotRef.current) {
        // We need settings at this point - schedule snapshot
        setTimeout(() => {
          pushSnapshot(next, settingsRef.current);
        }, 0);
      }
      return next;
    });
  }, [pushSnapshot]);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const setSettingsWithHistory = useCallback((newSettings: PlaygroundSettings) => {
    setSettings(newSettings);
    if (!skipSnapshotRef.current) {
      setTimeout(() => {
        pushSnapshot(blocksRef.current, newSettings);
      }, 0);
    }
  }, [pushSnapshot]);

  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  const undo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index <= 0) return;
    historyIndexRef.current = index - 1;
    const snapshot = historyRef.current[index - 1];
    skipSnapshotRef.current = true;
    setBlocks(JSON.parse(JSON.stringify(snapshot.blocks)));
    setSettings(JSON.parse(JSON.stringify(snapshot.settings)));
    skipSnapshotRef.current = false;
  }, []);

  const redo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index >= historyRef.current.length - 1) return;
    historyIndexRef.current = index + 1;
    const snapshot = historyRef.current[index + 1];
    skipSnapshotRef.current = true;
    setBlocks(JSON.parse(JSON.stringify(snapshot.blocks)));
    setSettings(JSON.parse(JSON.stringify(snapshot.settings)));
    skipSnapshotRef.current = false;
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;


  const addBlock = useCallback((type: PlaygroundBlock['type']) => {
    const blockType = BLOCK_TYPES.find(b => b.type === type);
    const newBlock: PlaygroundBlock = {
      id: generateId(),
      type,
      content: blockType?.defaultContent || '',
      styles: {
        backgroundColor: 'transparent',
        textColor: '#ffffff',
        padding: '16px',
        fontSize: type === 'heading' ? '32px' : '16px',
        borderRadius: '8px',
        textAlign: 'center'
      }
    };
    setBlocksWithHistory(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [setBlocksWithHistory]);

  const updateBlock = useCallback((id: string, updates: Partial<PlaygroundBlock>) => {
    setBlocksWithHistory(prev => prev.map(block =>
      block.id === id ? { ...block, ...updates } : block
    ));
  }, [setBlocksWithHistory]);

  const updateBlockStyles = useCallback((id: string, styles: Partial<PlaygroundBlock['styles']>) => {
    setBlocksWithHistory(prev => prev.map(block =>
      block.id === id ? { ...block, styles: { ...block.styles, ...styles } } : block
    ));
  }, [setBlocksWithHistory]);

  const deleteBlock = useCallback((id: string) => {
    setBlocksWithHistory(prev => prev.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId, setBlocksWithHistory]);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocksWithHistory(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
  }, [setBlocksWithHistory]);

  const duplicateBlock = useCallback((id: string) => {
    setBlocksWithHistory(prev => {
      const block = prev.find(b => b.id === id);
      if (!block) return prev;
      const newBlock: PlaygroundBlock = { ...block, id: generateId() };
      const index = prev.findIndex(b => b.id === id);
      return [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)];
    });
  }, [setBlocksWithHistory]);


  // Keyboard shortcuts (after deleteBlock/duplicateBlock are defined)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) { e.preventDefault(); redo(); }
        else { e.preventDefault(); undo(); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' && !isInput && selectedBlockId) { e.preventDefault(); deleteBlock(selectedBlockId); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isInput && selectedBlockId) { e.preventDefault(); duplicateBlock(selectedBlockId); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedBlockId, deleteBlock, duplicateBlock]);

  const reorderBlocks = useCallback((activeId: string, overId: string) => {
    setBlocksWithHistory(prev => {
      const oldIndex = prev.findIndex(b => b.id === activeId);
      const newIndex = prev.findIndex(b => b.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newBlocks = [...prev];
      const [moved] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, moved);
      return newBlocks;
    });
  }, [setBlocksWithHistory]);

  const clearAll = useCallback(() => {
    setBlocksWithHistory([]);
    setSelectedBlockId(null);
    setSettings(DEFAULT_SETTINGS);
    setProjectTitle("Мой проект");
    // Reset history
    historyRef.current = [{ blocks: [], settings: DEFAULT_SETTINGS }];
    historyIndexRef.current = 0;
  }, [setBlocksWithHistory]);

  const loadTemplate = useCallback((templateBlocks: Omit<PlaygroundBlock, 'id'>[]) => {
    const blocksWithIds = templateBlocks.map(block => ({
      ...block,
      id: generateId()
    }));
    setBlocksWithHistory(blocksWithIds);
    setSelectedBlockId(null);
  }, [setBlocksWithHistory]);

  const addBlocks = useCallback((newBlocks: Omit<PlaygroundBlock, 'id'>[]) => {
    const blocksWithIds = newBlocks.map(block => ({
      ...block,
      id: generateId()
    }));
    setBlocksWithHistory(prev => [...prev, ...blocksWithIds]);
  }, [setBlocksWithHistory]);

  const addImageBlock = useCallback((imageUrl: string) => {
    const newBlock: PlaygroundBlock = {
      id: generateId(),
      type: 'image',
      content: imageUrl,
      styles: {
        backgroundColor: 'transparent',
        textColor: '#ffffff',
        padding: '8px',
        fontSize: '16px',
        borderRadius: '12px',
        textAlign: 'center'
      }
    };
    setBlocksWithHistory(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [setBlocksWithHistory]);

  const exportData = useCallback(() => {
    return { title: projectTitle, blocks, settings };
  }, [projectTitle, blocks, settings]);

  const importData = useCallback((data: { title: string; blocks: PlaygroundBlock[]; settings: PlaygroundSettings }) => {
    setProjectTitle(data.title);
    setBlocksWithHistory(data.blocks);
    setSettings(data.settings);
    setSelectedBlockId(null);
  }, [setBlocksWithHistory]);

  const toggleBlockHidden = useCallback((id: string) => {
    setBlocksWithHistory(prev => prev.map(block =>
      block.id === id ? { ...block, hidden: !block.hidden } : block
    ));
  }, [setBlocksWithHistory]);

  return {
    blocks,
    selectedBlock,
    selectedBlockId,
    settings,
    projectTitle,
    setProjectTitle,
    setSelectedBlockId,
    setSettings: setSettingsWithHistory,
    addBlock,
    updateBlock,
    updateBlockStyles,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    clearAll,
    loadTemplate,
    reorderBlocks,
    addBlocks,
    addImageBlock,
    exportData,
    importData,
    toggleBlockHidden,
    undo,
    redo,
    canUndo,
    canRedo
  };
};
