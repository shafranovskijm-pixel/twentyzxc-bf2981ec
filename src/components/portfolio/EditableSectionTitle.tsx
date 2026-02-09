import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

interface EditableSectionTitleProps {
  title: string;
  isAdmin: boolean;
  onSave: (newTitle: string) => void;
  isUpdating: boolean;
}

export const EditableSectionTitle = ({
  title,
  isAdmin,
  onSave,
  isUpdating,
}: EditableSectionTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== title) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mb-8">
        <span className="w-8 h-[1px] bg-primary" />
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-2xl font-display font-semibold h-auto py-1 px-2 max-w-xs"
          disabled={isUpdating}
        />
        <Button size="icon" variant="ghost" onClick={handleSave} disabled={isUpdating}>
          <Check className="w-4 h-4 text-primary" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleCancel}>
          <X className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3 group">
      <span className="w-8 h-[1px] bg-primary" />
      {title}
      {isAdmin && (
        <Button
          size="icon"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      )}
    </h2>
  );
};
