import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListing } from "@/hooks/use-listings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  MapPin, 
  Eye, 
  Clock, 
  Phone, 
  Mail, 
  MessageCircle,
  Share2,
  Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import * as Icons from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);

  const formatPrice = () => {
    if (!listing) return "";
    if (listing.price_type === "free") return "Бесплатно";
    if (!listing.price) return "Договорная";
    
    const formatted = new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(listing.price);
    
    return listing.price_type === "negotiable" ? `${formatted} (торг)` : formatted;
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Icons.Folder className="h-5 w-5" />;
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: listing?.title,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Объявление не найдено</h1>
            <Button asChild>
              <Link to="/services">Вернуться к каталогу</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(listing.created_at), {
    addSuffix: true,
    locale: ru,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/services" className="hover:text-foreground">
              Каталог
            </Link>
            <span>/</span>
            {listing.category && (
              <>
                <Link 
                  to={`/services/${listing.category.slug}`} 
                  className="hover:text-foreground"
                >
                  {listing.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground truncate">{listing.title}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Images */}
              <Card className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span className="text-6xl opacity-20">📷</span>
                    </div>
                  )}
                </div>
                
                {/* Image thumbnails */}
                {listing.images && listing.images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {listing.images.map((img, index) => (
                      <div 
                        key={index}
                        className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted"
                      >
                        <img
                          src={img}
                          alt={`${listing.title} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Description */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Описание</h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {listing.description ? (
                      <p className="whitespace-pre-wrap">{listing.description}</p>
                    ) : (
                      <p className="text-muted-foreground">Описание не указано</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price and title */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <h1 className="text-2xl font-bold">{listing.title}</h1>

                  {/* Category */}
                  {listing.category && (
                    <Link to={`/services/${listing.category.slug}`}>
                      <Badge variant="secondary" className="gap-1">
                        {getIcon(listing.category.icon)}
                        {listing.category.name}
                      </Badge>
                    </Link>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {listing.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {listing.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {listing.views_count} просмотров
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {timeAgo}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact buttons */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold mb-4">Связаться с продавцом</h3>
                  
                  {listing.contact_phone && (
                    <Button asChild className="w-full" variant="default">
                      <a href={`tel:${listing.contact_phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        {listing.contact_phone}
                      </a>
                    </Button>
                  )}

                  {listing.contact_telegram && (
                    <Button asChild className="w-full" variant="outline">
                      <a 
                        href={`https://t.me/${listing.contact_telegram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Telegram: {listing.contact_telegram}
                      </a>
                    </Button>
                  )}

                  {listing.contact_email && (
                    <Button asChild className="w-full" variant="outline">
                      <a href={`mailto:${listing.contact_email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Написать на email
                      </a>
                    </Button>
                  )}

                  {!listing.contact_phone && !listing.contact_telegram && !listing.contact_email && (
                    <p className="text-muted-foreground text-sm text-center">
                      Контактные данные не указаны
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
