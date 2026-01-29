import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { useListings } from "@/hooks/use-listings";
import { useCategoryBySlug } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import * as Icons from "lucide-react";

export default function ServiceCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthContext();
  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(slug);
  
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    sortBy: "created_at" as "created_at" | "price" | "views_count",
    sortOrder: "desc" as "asc" | "desc",
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
  });

  const { data: listings, isLoading: listingsLoading } = useListings({
    categorySlug: slug,
    search: filters.search || undefined,
    location: filters.location || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    limit: 20,
  });

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-10 w-10" /> : <Icons.Folder className="h-10 w-10" />;
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Категория не найдена</h1>
            <Button asChild>
              <Link to="/services">Вернуться к каталогу</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="relative py-12 px-4 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            {/* Breadcrumb */}
            <Link 
              to="/services" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Все категории
            </Link>

            {/* Category header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {getIcon(category.icon)}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-muted-foreground">{category.description}</p>
                )}
              </div>
            </div>

            {/* Action button */}
            <div className="flex gap-4">
              {user ? (
                <Button asChild variant="hero">
                  <Link to={`/dashboard/listings/new?category=${category.id}`}>
                    <Plus className="h-5 w-5 mr-2" />
                    Разместить объявление
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="hero">
                  <Link to="/auth">
                    <Plus className="h-5 w-5 mr-2" />
                    Разместить объявление
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Listings section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto">
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
            {listingsLoading ? (
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
                  В этой категории пока нет объявлений
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
