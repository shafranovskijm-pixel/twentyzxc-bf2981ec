import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler, Info } from "lucide-react";

interface SizeRow {
  size: string;
  chest?: string;
  waist?: string;
  hips?: string;
  length?: string;
  eu?: string;
  us?: string;
  uk?: string;
}

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  sizes?: SizeRow[];
  className?: string;
}

const defaultSizes: SizeRow[] = [
  { size: "XS", chest: "82-86", waist: "62-66", hips: "86-90", eu: "34", us: "0-2", uk: "6" },
  { size: "S", chest: "86-90", waist: "66-70", hips: "90-94", eu: "36", us: "4-6", uk: "8" },
  { size: "M", chest: "90-94", waist: "70-74", hips: "94-98", eu: "38", us: "8-10", uk: "10" },
  { size: "L", chest: "94-98", waist: "74-78", hips: "98-102", eu: "40", us: "12-14", uk: "12" },
  { size: "XL", chest: "98-102", waist: "78-82", hips: "102-106", eu: "42", us: "16", uk: "14" },
];

export const SizeGuideModal = ({
  isOpen,
  onClose,
  title = "Таблица размеров",
  sizes = defaultSizes,
  className = "",
}: SizeGuideModalProps) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

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
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-auto ${className}`}
          >
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Size selector */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {sizes.map((row) => (
                    <button
                      key={row.size}
                      onClick={() => setSelectedSize(row.size === selectedSize ? null : row.size)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${selectedSize === row.size
                          ? "bg-primary text-primary-foreground"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }
                      `}
                    >
                      {row.size}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Размер</th>
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Грудь (см)</th>
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Талия (см)</th>
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Бёдра (см)</th>
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">EU</th>
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">US</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((row) => (
                        <motion.tr
                          key={row.size}
                          animate={{
                            backgroundColor: selectedSize === row.size ? "rgba(var(--primary), 0.1)" : "transparent",
                          }}
                          className="border-b border-zinc-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-white">{row.size}</td>
                          <td className="py-3 px-4 text-zinc-300">{row.chest}</td>
                          <td className="py-3 px-4 text-zinc-300">{row.waist}</td>
                          <td className="py-3 px-4 text-zinc-300">{row.hips}</td>
                          <td className="py-3 px-4 text-zinc-300">{row.eu}</td>
                          <td className="py-3 px-4 text-zinc-300">{row.us}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-zinc-400">
                      <p className="mb-2">Как измерить:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong className="text-zinc-300">Грудь:</strong> измерьте по самой выступающей части</li>
                        <li><strong className="text-zinc-300">Талия:</strong> измерьте по самому узкому месту</li>
                        <li><strong className="text-zinc-300">Бёдра:</strong> измерьте по самой широкой части</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Trigger button
interface SizeGuideButtonProps {
  onClick: () => void;
  className?: string;
}

export const SizeGuideButton = ({ onClick, className = "" }: SizeGuideButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-sm text-primary hover:underline ${className}`}
    >
      <Ruler className="w-4 h-4" />
      <span>Таблица размеров</span>
    </button>
  );
};
