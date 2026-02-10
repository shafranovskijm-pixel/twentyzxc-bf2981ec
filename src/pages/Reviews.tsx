import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { LogOut, Star, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { GoogleAuthButton } from "@/components/reviews/GoogleAuthButton";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Reviews = () => {
  const {
    reviews,
    user,
    isLoading,
    isSubmitting,
    submitReview,
    deleteReview,
    signOut
  } = useReviews();

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <>
      <Helmet>
        <title>Отзывы клиентов | 24ZXC</title>
        <meta name="description" content="Отзывы наших клиентов о веб-разработке и рекламных услугах. Узнайте мнение тех, кто уже работал с нами." />
        <link rel="canonical" href="https://24zxc.ru/reviews" />
      </Helmet>

      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Decorative background */}
        <div className="fixed inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
              backgroundSize: "40px 40px"
            }}
          />
          <motion.div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)"
            }}
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)"
            }}
            animate={{ 
              x: [0, -40, 0],
              y: [0, -40, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <Header />
        
        <main className="pt-32 pb-20">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <AnimatedSection className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-6">
                  <Star className="w-4 h-4 fill-primary" />
                  <span>Отзывы клиентов</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                  <span className="gradient-gold-text">Что говорят</span>
                  <br />
                  о нашей работе
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Реальные отзывы от реальных клиентов. Войдите через Google, чтобы оставить свой отзыв.
                </p>
              </AnimatedSection>

              {/* Stats */}
              <AnimatedSection delay={0.1} className="flex justify-center gap-8 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-gold-text">{averageRating}</div>
                  <div className="text-sm text-muted-foreground">Средняя оценка</div>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-gold-text">{reviews.length}</div>
                  <div className="text-sm text-muted-foreground">Отзывов</div>
                </div>
              </AnimatedSection>

              {/* Auth section */}
              <AnimatedSection delay={0.2} className="mb-12">
                {user ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 luxury-card">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-border">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-secondary">
                            {(user.user_metadata?.name || user.email)?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">Вы вошли через Google</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={signOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Выйти
                      </Button>
                    </div>
                    <ReviewForm onSubmit={submitReview} isLoading={isSubmitting} />
                  </div>
                ) : (
                  <div className="luxury-card p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Оставьте отзыв</h3>
                    <p className="text-muted-foreground mb-6">
                      Войдите через Google, чтобы поделиться своим опытом
                    </p>
                    <GoogleAuthButton />
                  </div>
                )}
              </AnimatedSection>

              {/* Reviews list */}
              <AnimatedSection delay={0.3}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Все отзывы
                </h2>
                
                {isLoading ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="luxury-card p-6 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-secondary" />
                          <div className="space-y-2">
                            <div className="w-32 h-4 bg-secondary rounded" />
                            <div className="w-20 h-3 bg-secondary rounded" />
                          </div>
                        </div>
                        <div className="w-full h-16 bg-secondary rounded" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="grid gap-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        id={review.id}
                        userName={review.user_name}
                        userAvatar={review.user_avatar || undefined}
                        rating={review.rating}
                        content={review.content}
                        createdAt={review.created_at}
                        isOwner={user?.id === review.user_id}
                        onDelete={deleteReview}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="luxury-card p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Пока нет отзывов. Будьте первым!
                    </p>
                  </div>
                )}
              </AnimatedSection>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Reviews;
