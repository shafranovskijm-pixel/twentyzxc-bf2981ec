import { motion, AnimatePresence } from "framer-motion";
import { X, Command, Search, Settings, Plus, Save, Trash2 } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  icon?: typeof Command;
}

interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: ShortcutCategory[];
  className?: string;
}

const defaultCategories: ShortcutCategory[] = [
  {
    name: "Общие",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Открыть поиск", icon: Search },
      { keys: ["⌘", ","], description: "Настройки", icon: Settings },
      { keys: ["⌘", "N"], description: "Создать новый", icon: Plus },
      { keys: ["⌘", "S"], description: "Сохранить", icon: Save },
    ],
  },
  {
    name: "Навигация",
    shortcuts: [
      { keys: ["G", "H"], description: "Перейти на главную" },
      { keys: ["G", "D"], description: "Перейти в Dashboard" },
      { keys: ["G", "S"], description: "Перейти в настройки" },
      { keys: ["?"], description: "Показать горячие клавиши" },
    ],
  },
  {
    name: "Редактирование",
    shortcuts: [
      { keys: ["⌘", "Z"], description: "Отменить" },
      { keys: ["⌘", "⇧", "Z"], description: "Повторить" },
      { keys: ["⌘", "C"], description: "Копировать" },
      { keys: ["⌘", "V"], description: "Вставить" },
      { keys: ["⌫"], description: "Удалить", icon: Trash2 },
    ],
  },
];

export const KeyboardShortcuts = ({
  isOpen,
  onClose,
  categories = defaultCategories,
  className = "",
}: KeyboardShortcutsProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl ${className}`}
          >
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Command className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Горячие клавиши</h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((category, catIndex) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIndex * 0.1 }}
                    >
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">
                        {category.name}
                      </h4>
                      <div className="space-y-2">
                        {category.shortcuts.map((shortcut, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {shortcut.icon && (
                                <shortcut.icon className="w-4 h-4 text-zinc-500" />
                              )}
                              <span className="text-sm text-zinc-300">
                                {shortcut.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <kbd
                                  key={keyIndex}
                                  className="min-w-[24px] h-6 px-1.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-mono flex items-center justify-center"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                <p className="text-xs text-zinc-500 text-center">
                  Нажмите <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">?</kbd> чтобы показать эту справку
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Keyboard key component
interface KeyProps {
  children: React.ReactNode;
  className?: string;
}

export const Key = ({ children, className = "" }: KeyProps) => {
  return (
    <kbd
      className={`
        inline-flex items-center justify-center min-w-[24px] h-6 px-1.5
        rounded bg-zinc-800 border border-zinc-700
        text-xs text-zinc-300 font-mono ${className}
      `}
    >
      {children}
    </kbd>
  );
};

// Shortcut hint inline component
interface ShortcutHintProps {
  keys: string[];
  className?: string;
}

export const ShortcutHint = ({ keys, className = "" }: ShortcutHintProps) => {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {keys.map((key, i) => (
        <Key key={i}>{key}</Key>
      ))}
    </span>
  );
};
