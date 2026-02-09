import { useState, useCallback } from "react";
import { PlaygroundBlock, PlaygroundSettings, BLOCK_TYPES } from "@/data/playground-effects";

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_SETTINGS: PlaygroundSettings = {
  backgroundColor: "#0a0a0a",
  backgroundPattern: "dots"
};

export const usePlayground = () => {
  const [blocks, setBlocks] = useState<PlaygroundBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlaygroundSettings>(DEFAULT_SETTINGS);
  const [projectTitle, setProjectTitle] = useState("Мой проект");

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

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
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<PlaygroundBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, []);

  const updateBlockStyles = useCallback((id: string, styles: Partial<PlaygroundBlock['styles']>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, styles: { ...block.styles, ...styles } } : block
    ));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    
    const newBlock: PlaygroundBlock = {
      ...block,
      id: generateId()
    };
    
    const index = blocks.findIndex(b => b.id === id);
    setBlocks(prev => [
      ...prev.slice(0, index + 1),
      newBlock,
      ...prev.slice(index + 1)
    ]);
    setSelectedBlockId(newBlock.id);
  }, [blocks]);

  const clearAll = useCallback(() => {
    setBlocks([]);
    setSelectedBlockId(null);
    setSettings(DEFAULT_SETTINGS);
    setProjectTitle("Мой проект");
  }, []);

  const loadTemplate = useCallback((templateBlocks: Omit<PlaygroundBlock, 'id'>[]) => {
    const blocksWithIds = templateBlocks.map(block => ({
      ...block,
      id: generateId()
    }));
    setBlocks(blocksWithIds);
    setSelectedBlockId(null);
  }, []);

  const exportData = useCallback(() => {
    return {
      title: projectTitle,
      blocks,
      settings
    };
  }, [projectTitle, blocks, settings]);

  const reorderBlocks = useCallback((activeId: string, overId: string) => {
    setBlocks(prev => {
      const oldIndex = prev.findIndex(b => b.id === activeId);
      const newIndex = prev.findIndex(b => b.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newBlocks = [...prev];
      const [moved] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, moved);
      return newBlocks;
    });
  }, []);

  const importData = useCallback((data: { title: string; blocks: PlaygroundBlock[]; settings: PlaygroundSettings }) => {
    setProjectTitle(data.title);
    setBlocks(data.blocks);
    setSettings(data.settings);
    setSelectedBlockId(null);
  }, []);

  return {
    blocks,
    selectedBlock,
    selectedBlockId,
    settings,
    projectTitle,
    setProjectTitle,
    setSelectedBlockId,
    setSettings,
    addBlock,
    updateBlock,
    updateBlockStyles,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    clearAll,
    loadTemplate,
    reorderBlocks,
    exportData,
    importData
  };
};
