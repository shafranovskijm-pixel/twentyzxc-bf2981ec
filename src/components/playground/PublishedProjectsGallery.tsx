import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  preview_image: string | null;
  created_at: string;
}

export const PublishedProjectsGallery = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("playground_projects")
        .select("id, slug, title, author_name, preview_image, created_at")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 4, projects.length));
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-video bg-secondary/40 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="py-16 border-t border-border">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
            Сайты пользователей
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Работы, созданные в нашем конструкторе и опубликованные на 24zxc.ru
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.slice(0, visibleCount).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/p/${project.slug}`}
                className="group block rounded-lg overflow-hidden border border-border bg-secondary/20 hover:border-primary/50 transition-all duration-300"
              >
                <div className="aspect-video bg-background relative overflow-hidden">
                  {project.preview_image ? (
                    <img
                      src={project.preview_image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <span className="text-4xl font-display font-bold">24</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span className="text-sm text-foreground flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      Открыть
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <User className="w-3 h-3" />
                    {project.author_name || "Аноним"}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {visibleCount < projects.length && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={handleShowMore}>
              <ChevronDown className="w-4 h-4 mr-2" />
              Показать ещё
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
