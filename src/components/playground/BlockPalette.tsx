import { motion } from "framer-motion";
import { Type, AlignLeft, MousePointer, Image, Minus, Square, ArrowUpDown } from "lucide-react";
import { BLOCK_TYPES } from "@/data/playground-effects";
import { PlaygroundBlock } from "@/data/playground-effects";

const iconMap: Record<string, React.ReactNode> = {
  Type: <Type className="w-4 h-4" />,
  AlignLeft: <AlignLeft className="w-4 h-4" />,
  MousePointer: <MousePointer className="w-4 h-4" />,
  Image: <Image className="w-4 h-4" />,
  Minus: <Minus className="w-4 h-4" />,
  Square: <Square className="w-4 h-4" />,
  ArrowUpDown: <ArrowUpDown className="w-4 h-4" />
};

interface BlockPaletteProps {
  onAddBlock: (type: PlaygroundBlock['type']) => void;
}

export const BlockPalette = ({ onAddBlock }: BlockPaletteProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1 mb-3">Добавить блок</h3>
      <div className="grid grid-cols-2 gap-2">
        {BLOCK_TYPES.map((block) => (
          <motion.button
            key={block.type}
            onClick={() => onAddBlock(block.type)}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {iconMap[block.icon]}
            <span className="text-xs">{block.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
