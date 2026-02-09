import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { setAchievementUnlocker } from '@/contexts/InventoryContext';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'exploration' | 'collection' | 'time' | 'secret' | 'contact';
  unlockedAt?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Exploration
  { id: 'first_visit', name: 'Первый шаг', description: 'Посетить сайт впервые', icon: '👣', category: 'exploration' },
  { id: 'traveler', name: 'Путешественник', description: 'Посетить 3 разных страницы', icon: '🧭', category: 'exploration' },
  { id: 'cartographer', name: 'Картограф', description: 'Посетить все основные страницы', icon: '🗺️', category: 'exploration' },
  { id: 'deep_reader', name: 'Глубокий интерес', description: 'Пролистать страницу до конца', icon: '📜', category: 'exploration' },
  
  // Collection
  { id: 'first_key', name: 'Первый ключ', description: 'Собрать первый ключ', icon: '🔑', category: 'collection' },
  { id: 'key_bunch', name: 'Связка ключей', description: 'Собрать 3 ключа', icon: '🗝️', category: 'collection' },
  { id: 'master_key', name: 'Мастер-ключ', description: 'Собрать все 4 ключа услуг', icon: '👑', category: 'collection' },
  { id: 'treasure_hunter', name: 'Хранитель сокровищ', description: 'Открыть сундук', icon: '📦', category: 'collection' },
  
  // Time
  { id: 'thoughtful', name: 'Вдумчивый читатель', description: 'Провести на сайте 3+ минуты', icon: '⏳', category: 'time' },
  { id: 'returning', name: 'Постоянный гость', description: 'Вернуться на сайт повторно', icon: '🔄', category: 'time' },
  { id: 'night_owl', name: 'Ночной странник', description: 'Посетить сайт ночью', icon: '🌙', category: 'time' },
  
  // Secret
  { id: 'syntagma_gates', name: 'Врата Синтагмы', description: 'Открыть анимацию ворот', icon: '✨', category: 'secret' },
  { id: 'curious', name: 'Любопытный', description: 'Нажать на логотип 5 раз', icon: '🔍', category: 'secret' },
  
  // Contact
  { id: 'connected', name: 'На связи', description: 'Отправить заявку через форму', icon: '📩', category: 'contact' },
  { id: 'social', name: 'Социальный', description: 'Кликнуть на соц. сеть', icon: '💬', category: 'contact' },
];

interface AchievementsContextType {
  achievements: Achievement[];
  unlockedAchievements: string[];
  unlockAchievement: (id: string) => void;
  isUnlocked: (id: string) => boolean;
  getProgress: () => { unlocked: number; total: number };
  visitedPages: string[];
  addVisitedPage: (page: string) => void;
  logoClicks: number;
  incrementLogoClicks: () => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

const STORAGE_KEY = '24zxc_achievements';
const VISITED_PAGES_KEY = '24zxc_visited_pages';
const VISIT_COUNT_KEY = '24zxc_visit_count';

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [visitedPages, setVisitedPages] = useState<string[]>([]);
  const [logoClicks, setLogoClicks] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [startTime] = useState(Date.now());
  const [hasCheckedTime, setHasCheckedTime] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setUnlockedAchievements(JSON.parse(saved));
    }
    
    const savedPages = localStorage.getItem(VISITED_PAGES_KEY);
    if (savedPages) {
      setVisitedPages(JSON.parse(savedPages));
    }

    // Check if returning visitor
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    localStorage.setItem(VISIT_COUNT_KEY, String(visitCount + 1));
    
    if (visitCount === 0) {
      // First visit - unlock after a short delay
      setTimeout(() => unlockAchievement('first_visit'), 2000);
    } else if (visitCount > 0) {
      // Returning visitor
      setTimeout(() => unlockAchievement('returning'), 1500);
    }

    // Night owl check
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      setTimeout(() => unlockAchievement('night_owl'), 3000);
    }
  }, []);

  // Time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= 180 && !hasCheckedTime) { // 3 minutes
        unlockAchievement('thoughtful');
        setHasCheckedTime(true);
      }
    }, 10000);
    
    return () => clearInterval(timer);
  }, [startTime, hasCheckedTime]);

  // Scroll tracking for deep_reader
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        unlockAchievement('deep_reader');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setUnlockedAchievements(prev => {
      if (prev.includes(id)) return prev;
      
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        toast({
          title: `🏆 ${achievement.name}`,
          description: achievement.description,
        });
      }
      
      const newUnlocked = [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUnlocked));
      return newUnlocked;
    });
  }, [toast]);

  // Register achievement unlocker for InventoryContext
  useEffect(() => {
    setAchievementUnlocker(unlockAchievement);
  }, [unlockAchievement]);

  const isUnlocked = useCallback((id: string) => {
    return unlockedAchievements.includes(id);
  }, [unlockedAchievements]);

  const getProgress = useCallback(() => {
    return {
      unlocked: unlockedAchievements.length,
      total: ACHIEVEMENTS.length,
    };
  }, [unlockedAchievements]);

  const addVisitedPage = useCallback((page: string) => {
    setVisitedPages(prev => {
      if (prev.includes(page)) return prev;
      
      const newPages = [...prev, page];
      localStorage.setItem(VISITED_PAGES_KEY, JSON.stringify(newPages));
      
      // Check traveler achievement
      if (newPages.length >= 3) {
        setTimeout(() => unlockAchievement('traveler'), 500);
      }
      
      // Check cartographer - main pages: /, /portfolio, /about, /licensing, /frdo
      const mainPages = ['/', '/portfolio', '/about', '/licensing', '/frdo'];
      const visitedMain = mainPages.filter(p => newPages.includes(p));
      if (visitedMain.length >= 5) {
        setTimeout(() => unlockAchievement('cartographer'), 500);
      }
      
      return newPages;
    });
  }, [unlockAchievement]);

  const incrementLogoClicks = useCallback(() => {
    setLogoClicks(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        unlockAchievement('curious');
      }
      return newCount;
    });
  }, [unlockAchievement]);

  return (
    <AchievementsContext.Provider value={{
      achievements: ACHIEVEMENTS,
      unlockedAchievements,
      unlockAchievement,
      isUnlocked,
      getProgress,
      visitedPages,
      addVisitedPage,
      logoClicks,
      incrementLogoClicks,
      isPanelOpen,
      setIsPanelOpen,
    }}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementsProvider');
  }
  return context;
}
