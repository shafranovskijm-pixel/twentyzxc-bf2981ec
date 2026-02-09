import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewCardProps {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  createdAt: string;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export const ReviewCard = ({
  id,
  userName,
  userAvatar,
  rating,
  content,
  createdAt,
  isOwner,
  onDelete
}: ReviewCardProps) => {
  const formattedDate = new Date(createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="luxury-card p-6 relative group"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-secondary text-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium text-foreground">{userName}</h4>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        <StarRating rating={rating} readonly size="sm" />
      </div>
      
      <p className="text-muted-foreground leading-relaxed">{content}</p>
      
      {isOwner && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(id)}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
};
