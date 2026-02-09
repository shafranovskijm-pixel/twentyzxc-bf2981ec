import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { Send } from "lucide-react";

interface ReviewFormProps {
  onSubmit: (rating: number, content: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReviewForm = ({ onSubmit, isLoading }: ReviewFormProps) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && rating > 0) {
      await onSubmit(rating, content.trim());
      setContent("");
      setRating(5);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="luxury-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Ваша оценка</label>
        <StarRating rating={rating} onChange={setRating} size="lg" />
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Ваш отзыв
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Расскажите о вашем опыте работы с нами..."
          className="min-h-[120px] bg-secondary/50 border-border focus:border-primary resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {content.length}/1000
        </p>
      </div>
      
      <Button
        type="submit"
        variant="hero"
        disabled={!content.trim() || isLoading}
        className="w-full"
      >
        <Send className="w-4 h-4" />
        {isLoading ? "Отправка..." : "Отправить отзыв"}
      </Button>
    </form>
  );
};
