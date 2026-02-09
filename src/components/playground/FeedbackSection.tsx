import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, Trash2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface Feedback {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
}

interface FeedbackSectionProps {
  isAdmin: boolean;
}

export const FeedbackSection = ({ isAdmin }: FeedbackSectionProps) => {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    fetchFeedbacks();
    return () => subscription.unsubscribe();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("playground_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (e) {
      console.error("Error fetching feedback:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Ошибка входа", description: String(error), variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;
    setIsSending(true);
    try {
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Аноним";
      const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      const { error } = await supabase.from("playground_feedback").insert({
        user_id: user.id,
        user_name: userName,
        user_avatar: userAvatar,
        content: content.trim(),
      });
      if (error) throw error;
      setContent("");
      toast({ title: "Отправлено!", description: "Спасибо за предложение" });
      fetchFeedbacks();
    } catch (e) {
      console.error("Error submitting feedback:", e);
      toast({ title: "Ошибка", description: "Не удалось отправить", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить это предложение?")) return;
    try {
      const { error } = await supabase.from("playground_feedback").delete().eq("id", id);
      if (error) throw error;
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      toast({ title: "Удалено" });
    } catch (e) {
      console.error("Error deleting feedback:", e);
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="py-16 border-t border-border">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
            Предложения и идеи
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Расскажите, что улучшить в конструкторе — войдите через Google и оставьте предложение
          </p>
        </motion.div>

        {/* Form */}
        <div className="max-w-2xl mx-auto mb-10">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                  <AvatarFallback>{(user.user_metadata?.full_name || user.email || "U")[0]}</AvatarFallback>
                </Avatar>
                <span>{user.user_metadata?.full_name || user.email}</span>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Напишите ваше предложение..."
                className="min-h-[80px]"
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{content.length}/1000</span>
                <Button onClick={handleSubmit} disabled={isSending || !content.trim()} size="sm">
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  {isSending ? "Отправка..." : "Отправить"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 rounded-lg border border-border bg-secondary/20">
              <p className="text-muted-foreground mb-3">Войдите, чтобы оставить предложение</p>
              <Button onClick={handleSignIn} variant="outline">
                <LogIn className="w-4 h-4 mr-2" />
                Войти через Google
              </Button>
            </div>
          )}
        </div>

        {/* Feedback list */}
        {isLoading ? (
          <div className="max-w-2xl mx-auto space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-secondary/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <p className="text-center text-muted-foreground">Пока нет предложений. Будьте первым!</p>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {feedbacks.map((fb, index) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg border border-border bg-secondary/10 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="w-8 h-8 mt-0.5">
                      <AvatarImage src={fb.user_avatar || undefined} />
                      <AvatarFallback>{fb.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{fb.user_name}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(fb.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{fb.content}</p>
                    </div>
                  </div>
                  {(isAdmin || user?.id === fb.user_id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => handleDelete(fb.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
