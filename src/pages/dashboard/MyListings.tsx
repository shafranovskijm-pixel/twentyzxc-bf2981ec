import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListings, useDeleteListing, useUpdateListing } from "@/hooks/use-listings";
import { useAuthContext } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyListings() {
  const { user } = useAuthContext();
  const { data: listings, isLoading } = useListings({ userId: user?.id });
  const deleteListing = useDeleteListing();
  const updateListing = useUpdateListing();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteListing.mutateAsync(id);
      toast({
        title: "Объявление удалено",
        description: "Объявление успешно удалено",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить объявление",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "archived" : "active";
    try {
      await updateListing.mutateAsync({ id, status: newStatus });
      toast({
        title: newStatus === "active" ? "Объявление активировано" : "Объявление скрыто",
        description: newStatus === "active" 
          ? "Объявление теперь видно всем" 
          : "Объявление скрыто от просмотра",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активно</Badge>;
      case "archived":
        return <Badge variant="secondary">В архиве</Badge>;
      case "pending":
        return <Badge variant="outline">На модерации</Badge>;
      case "rejected":
        return <Badge variant="destructive">Отклонено</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (listing: any) => {
    if (listing.price_type === "free") return "Бесплатно";
    if (!listing.price) return "Договорная";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(listing.price);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мои объявления</h1>
          <p className="text-muted-foreground mt-1">
            Управляйте своими объявлениями
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Новое объявление
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="w-full md:w-48 h-32 md:h-auto bg-muted flex-shrink-0">
                    {listing.images?.[0] ? (
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        📷
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <Link 
                          to={`/listing/${listing.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {listing.title}
                        </Link>
                        {getStatusBadge(listing.status)}
                      </div>

                      <p className="text-xl font-bold text-primary mb-2">
                        {formatPrice(listing)}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {listing.views_count} просмотров
                        </span>
                        {listing.location && (
                          <span>{listing.location}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/listings/${listing.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Редактировать
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/listing/${listing.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотреть
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(listing.id, listing.status)}
                          >
                            {listing.status === "active" ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Скрыть
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Активировать
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Объявление будет удалено навсегда.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(listing.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              У вас пока нет объявлений
            </p>
            <Button asChild>
              <Link to="/dashboard/listings/new">
                <Plus className="h-4 w-4 mr-2" />
                Создать первое объявление
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
