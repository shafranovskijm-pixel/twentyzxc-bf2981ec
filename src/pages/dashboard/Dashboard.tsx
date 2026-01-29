import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/use-listings";
import { useAuthContext } from "@/contexts/AuthContext";
import { FileText, Eye, Plus, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthContext();
  const { data: listings } = useListings({ 
    userId: user?.id 
  });

  const activeListings = listings?.filter(l => l.status === "active") || [];
  const totalViews = listings?.reduce((acc, l) => acc + (l.views_count || 0), 0) || 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Личный кабинет</h1>
        <p className="text-muted-foreground mt-1">
          Добро пожаловать! Управляйте своими объявлениями
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего объявлений</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Активных: {activeListings.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просмотров</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              За всё время
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статистика</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeListings.length > 0 
                ? Math.round(totalViews / activeListings.length) 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Просмотров на объявление
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to="/dashboard/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              Новое объявление
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/listings">
              <FileText className="h-4 w-4 mr-2" />
              Мои объявления
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/services">
              Каталог услуг
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent listings */}
      {listings && listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Недавние объявления</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {listings.slice(0, 5).map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                      {listing.images?.[0] ? (
                        <img 
                          src={listing.images[0]} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          📷
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.views_count} просмотров
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    listing.status === "active" 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {listing.status === "active" ? "Активно" : listing.status}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
