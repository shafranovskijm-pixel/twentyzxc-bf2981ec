import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CategoryGrid } from "@/components/listings/CategoryGrid";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { useListings } from "@/hooks/use-listings";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Services() {
  const { user } = useAuthContext();
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    sortBy: "created_at" as "created_at" | "price" | "views_count",
    sortOrder: "desc" as "asc" | "desc",
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
  });

  const { data: listings, isLoading } = useListings({
    search: filters.search || undefined,
    location: filters.location || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="relative py-16 px-4 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                <span className="bg-gradient-to-r from-primary via-gold to-primary bg-clip-text text-transparent">
                  Все услуги в одном месте
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Найдите нужную услугу или разместите своё объявление бесплатно
              </p>
            </div>

            {/* Action button */}
            <div className="flex justify-center mb-8">
              {user ? (
                <Button asChild size="lg" variant="hero">
                  <Link to="/dashboard/listings/new">
                    <Plus className="h-5 w-5 mr-2" />
                    Разместить объявление
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="hero">
                  <Link to="/auth">
                    <Plus className="h-5 w-5 mr-2" />
                    Разместить объявление
                  </Link>
                </Button>
              )}
            </div>

            {/* Categories */}
            <div className="mb-16">
              <h2 className="text-2xl font-semibold mb-6">Категории</h2>
              <CategoryGrid />
            </div>
          </div>
        </section>

        {/* Listings section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Последние объявления</h2>
            
            {/* Filters */}
            <div className="mb-8">
              <ListingFilters
                onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
                onLocationChange={(location) => setFilters((f) => ({ ...f, location }))}
                onSortChange={(sortBy, sortOrder) => 
                  setFilters((f) => ({ 
                    ...f, 
                    sortBy: sortBy as any, 
                    sortOrder: sortOrder as any 
                  }))
                }
                onPriceRangeChange={(priceMin, priceMax) => 
                  setFilters((f) => ({ ...f, priceMin, priceMax }))
                }
              />
            </div>

            {/* Listings grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  Объявления не найдены
                </p>
                <Button asChild variant="outline">
                  <Link to="/dashboard/listings/new">
                    Стать первым — разместить объявление
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
