import { PlaygroundBlock, BLOCK_TYPES } from "@/data/playground-effects";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayerListProps {
  blocks: PlaygroundBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onToggleHidden?: (id: string) => void;
}

export const LayerList = ({ blocks, selectedBlockId, onSelectBlock, onDeleteBlock, onToggleHidden }: LayerListProps) => {
  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground text-xs text-center py-4">
        Нет блоков на странице
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        const blockType = BLOCK_TYPES.find(b => b.type === block.type);
        const isSelected = block.id === selectedBlockId;
        const label = blockType?.name || block.type;
        const preview = block.content.slice(0, 30).replace(/\n/g, ' ');
        const isHidden = block.hidden;

        return (
          <button
            key={block.id}
            onClick={() => onSelectBlock(block.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors group",
              isSelected
                ? "bg-primary/20 text-foreground border border-primary/30"
                : "hover:bg-secondary/60 text-muted-foreground border border-transparent",
              isHidden && "opacity-50"
            )}
          >
            <span className="text-muted-foreground/50 w-4 text-center shrink-0">{index + 1}</span>
            <span className="font-medium shrink-0">{label}</span>
            <span className="truncate opacity-50 flex-1">{preview}</span>
            {onToggleHidden && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleHidden(block.id); }}
                className="p-0.5 hover:text-primary transition-all shrink-0"
                title={isHidden ? "Показать" : "Скрыть"}
              >
                {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all shrink-0"
              title="Удалить"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </button>
        );
      })}
    </div>
  );
};
