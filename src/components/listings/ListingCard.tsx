import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Clock } from "lucide-react";
import type { Listing } from "@/hooks/use-listings";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const formatPrice = () => {
    if (listing.price_type === "free") return "Бесплатно";
    if (!listing.price) return "Договорная";
    
    const formatted = new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(listing.price);
    
    return listing.price_type === "negotiable" ? `${formatted} (торг)` : formatted;
  };

  const timeAgo = formatDistanceToNow(new Date(listing.created_at), {
    addSuffix: true,
    locale: ru,
  });

  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="group overflow-hidden hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm h-full">
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl opacity-20">📷</span>
            </div>
          )}
          
          {/* Category badge */}
          {listing.category && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
            >
              {listing.category.name}
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Price */}
          <p className="text-xl font-bold text-primary">
            {formatPrice()}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {listing.views_count}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
