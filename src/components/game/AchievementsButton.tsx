import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAchievements } from '@/contexts/AchievementsContext';

export function AchievementsButton() {
  const { getProgress, setIsPanelOpen, unlockedAchievements } = useAchievements();
  const progress = getProgress();

  return (
    <motion.button
      onClick={() => setIsPanelOpen(true)}
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-primary/50 transition-all group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="relative">
        <Trophy className="w-4 h-4 text-primary" />
        {unlockedAchievements.length > 0 && (
          <motion.div 
            className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        )}
      </div>
      <span className="text-xs font-medium">
        {progress.unlocked}/{progress.total}
      </span>
    </motion.button>
  );
}
