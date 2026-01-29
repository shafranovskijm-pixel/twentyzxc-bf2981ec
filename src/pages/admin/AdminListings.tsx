import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MoreHorizontal, Eye, Trash2, Check, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export default function AdminListings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-listings", search],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          *,
          category:categories(name)
        `)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "archived" | "pending" | "rejected" }) => {
      const { error } = await supabase
        .from("listings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast({ title: "Статус обновлён" });
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast({ title: "Объявление удалено" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      pending: "outline",
      archived: "secondary",
      rejected: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === "active" && "Активно"}
        {status === "pending" && "На модерации"}
        {status === "archived" && "В архиве"}
        {status === "rejected" && "Отклонено"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Все объявления</h1>
        <p className="text-muted-foreground mt-1">
          Управление объявлениями пользователей
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск объявлений..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Просмотры</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings?.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                        {listing.images?.[0] ? (
                          <img 
                            src={listing.images[0]} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">📷</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{listing.title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{listing.category?.name}</TableCell>
                  <TableCell>{getStatusBadge(listing.status)}</TableCell>
                  <TableCell>{listing.views_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(listing.created_at), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                        {listing.status !== "active" && (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: listing.id, status: "active" })}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Активировать
                          </DropdownMenuItem>
                        )}
                        {listing.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: listing.id, status: "archived" })}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Скрыть
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteListing.mutate(listing.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
