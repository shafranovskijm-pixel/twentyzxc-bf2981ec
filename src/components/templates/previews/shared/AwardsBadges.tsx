import { motion } from "framer-motion";
import { Award, Trophy, Medal, Star, Crown, Gem } from "lucide-react";

interface AwardsBadgesProps {
  accentColor?: string;
}

export const AwardsBadges = ({ accentColor = "amber" }: AwardsBadgesProps) => {
  const awards = [
    { icon: Trophy, title: "Best Design 2024", org: "Awwwards" },
    { icon: Award, title: "Top Agency", org: "Clutch" },
    { icon: Star, title: "5 Star Rating", org: "Google" },
    { icon: Medal, title: "Excellence Award", org: "CSS Design" },
    { icon: Crown, title: "Leader 2024", org: "G2 Crowd" },
    { icon: Gem, title: "Premium Partner", org: "Webflow" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {awards.map((award, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div className={`w-12 h-12 rounded-full bg-${accentColor}-500/20 flex items-center justify-center`}>
            <award.icon className={`w-6 h-6 text-${accentColor}-400`} />
          </div>
          <div className="text-white text-sm font-medium text-center">{award.title}</div>
          <div className="text-white/50 text-xs">{award.org}</div>
        </motion.div>
      ))}
    </div>
  );
};
