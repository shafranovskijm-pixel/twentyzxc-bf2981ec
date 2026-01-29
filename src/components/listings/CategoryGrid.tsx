import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/use-categories";
import { Loader2 } from "lucide-react";
import * as Icons from "lucide-react";

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dynamic icon component getter
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-8 w-8" /> : <Icons.Folder className="h-8 w-8" />;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {categories?.map((category) => (
        <Link key={category.id} to={`/services/${category.slug}`}>
          <Card className="group h-full hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {getIcon(category.icon)}
              </div>
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                {category.name}
              </h3>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
