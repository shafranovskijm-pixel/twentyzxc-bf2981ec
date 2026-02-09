import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  rating: number;
  content: string;
  created_at: string;
  is_approved: boolean;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async (rating: number, content: string) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const userName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split("@")[0] || 
                       "Пользователь";
      const userAvatar = user.user_metadata?.avatar_url || null;

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        user_name: userName,
        user_avatar: userAvatar,
        rating,
        content
      });

      if (error) throw error;

      toast({
        title: "Отзыв отправлен!",
        description: "Спасибо за ваш отзыв",
      });

      await fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить отзыв",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Отзыв удалён",
      });

      await fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить отзыв",
        variant: "destructive"
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    reviews,
    user,
    isLoading,
    isSubmitting,
    submitReview,
    deleteReview,
    signOut
  };
};
