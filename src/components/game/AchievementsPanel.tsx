import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Lock } from 'lucide-react';
import { useAchievements } from '@/contexts/AchievementsContext';

export function AchievementsPanel() {
  const { achievements, isUnlocked, getProgress, isPanelOpen, setIsPanelOpen } = useAchievements();
  const progress = getProgress();

  const categories = [
    { id: 'exploration', name: 'Исследователь', icon: '🧭' },
    { id: 'collection', name: 'Коллекционер', icon: '🔑' },
    { id: 'time', name: 'Время', icon: '⏳' },
    { id: 'secret', name: 'Секреты', icon: '🔮' },
    { id: 'contact', name: 'Контакт', icon: '💬' },
  ];

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setIsPanelOpen(false)}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-display font-bold">Достижения</h2>
                  <p className="text-sm text-muted-foreground">
                    {progress.unlocked} из {progress.total} разблокировано
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="p-2 hover:bg-secondary rounded-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="px-6 py-4">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.unlocked / progress.total) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
            
            {/* Achievements list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {categories.map(category => {
                const categoryAchievements = achievements.filter(a => a.category === category.id);
                const unlockedCount = categoryAchievements.filter(a => isUnlocked(a.id)).length;
                
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{category.icon}</span>
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">
                        {category.name}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {unlockedCount}/{categoryAchievements.length}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {categoryAchievements.map(achievement => {
                        const unlocked = isUnlocked(achievement.id);
                        
                        return (
                          <motion.div
                            key={achievement.id}
                            className={`p-3 rounded-sm border transition-all ${
                              unlocked 
                                ? 'bg-primary/5 border-primary/30' 
                                : 'bg-secondary/30 border-border/50 opacity-60'
                            }`}
                            whileHover={{ scale: unlocked ? 1.02 : 1 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`text-2xl ${!unlocked && 'grayscale opacity-50'}`}>
                                {unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm ${!unlocked && 'text-muted-foreground'}`}>
                                  {unlocked ? achievement.name : '???'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {achievement.description}
                                </div>
                              </div>
                              {unlocked && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer hint */}
            <div className="p-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Исследуйте сайт, чтобы открыть все достижения ✨
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
