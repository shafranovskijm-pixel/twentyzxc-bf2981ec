import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface ListingFiltersProps {
  onSearchChange: (search: string) => void;
  onLocationChange: (location: string) => void;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onPriceRangeChange: (min?: number, max?: number) => void;
}

export function ListingFilters({
  onSearchChange,
  onLocationChange,
  onSortChange,
  onPriceRangeChange,
}: ListingFiltersProps) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearchChange(search);
  };

  const handleClearFilters = () => {
    setSearch("");
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    onSearchChange("");
    onLocationChange("");
    onPriceRangeChange(undefined, undefined);
  };

  const handlePriceChange = () => {
    onPriceRangeChange(
      priceMin ? Number(priceMin) : undefined,
      priceMax ? Number(priceMax) : undefined
    );
  };

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск объявлений..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>
          Найти
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <label className="text-sm font-medium mb-1 block">Город</label>
            <Input
              placeholder="Введите город"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                onLocationChange(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Цена от</label>
            <Input
              type="number"
              placeholder="0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onBlur={handlePriceChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Цена до</label>
            <Input
              type="number"
              placeholder="999999"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onBlur={handlePriceChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Сортировка</label>
            <Select 
              defaultValue="created_at-desc"
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split("-");
                onSortChange(sortBy, sortOrder);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Сначала новые</SelectItem>
                <SelectItem value="created_at-asc">Сначала старые</SelectItem>
                <SelectItem value="price-asc">Сначала дешевые</SelectItem>
                <SelectItem value="price-desc">Сначала дорогие</SelectItem>
                <SelectItem value="views_count-desc">По популярности</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-4 flex justify-end">
            <Button variant="ghost" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Сбросить фильтры
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
