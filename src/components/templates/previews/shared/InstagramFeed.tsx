import { motion } from "framer-motion";
import { Instagram, Heart, MessageCircle } from "lucide-react";

interface InstagramFeedProps {
  accentColor?: string;
}

export const InstagramFeed = ({ accentColor = "bg-amber-500" }: InstagramFeedProps) => {
  const posts = [
    { id: 1, likes: 234, comments: 12 },
    { id: 2, likes: 189, comments: 8 },
    { id: 3, likes: 456, comments: 23 },
    { id: 4, likes: 312, comments: 15 },
    { id: 5, likes: 278, comments: 19 },
    { id: 6, likes: 523, comments: 31 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center`}>
            <Instagram className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-white font-medium">@brandname</div>
            <div className="text-white/50 text-sm">Подписаться</div>
          </div>
        </div>
        <motion.button
          className={`px-4 py-2 rounded-lg ${accentColor} text-black text-sm font-medium`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Подписаться
        </motion.button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            className="aspect-square rounded-lg bg-white/5 border border-white/10 overflow-hidden cursor-pointer group relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Gradient placeholder */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              i % 3 === 0 ? "from-amber-500/20 to-orange-500/20" :
              i % 3 === 1 ? "from-purple-500/20 to-pink-500/20" :
              "from-blue-500/20 to-cyan-500/20"
            }`} />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-white">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{post.likes}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{post.comments}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
