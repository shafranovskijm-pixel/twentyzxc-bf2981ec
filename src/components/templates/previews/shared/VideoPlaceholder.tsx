import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface VideoPlaceholderProps {
  accentColor?: string;
  aspectRatio?: "video" | "square" | "portrait";
  title?: string;
  duration?: string;
}

export const VideoPlaceholder = ({ 
  accentColor = "bg-amber-500",
  aspectRatio = "video",
  title = "Видео-обзор",
  duration = "2:45"
}: VideoPlaceholderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[9/16]"
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Simulate playback
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
  };

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} rounded-2xl overflow-hidden bg-black/50 border border-white/10 group cursor-pointer`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
      
      {/* Animated background when playing */}
      {isPlaying && (
        <motion.div
          className={`absolute inset-0 ${accentColor} opacity-5`}
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Video content placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className={`w-20 h-20 rounded-full ${accentColor} flex items-center justify-center mx-auto mb-4 shadow-lg`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlay}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-black" />
            ) : (
              <Play className="w-8 h-8 text-black ml-1" />
            )}
          </motion.div>
          <div className="text-white font-medium">{title}</div>
          <div className="text-white/50 text-sm">{duration}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-3">
          <motion.div 
            className={`h-full ${accentColor}`}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <span>{Math.floor(progress * 0.0275)}:{String(Math.floor((progress * 1.65) % 60)).padStart(2, '0')}</span>
            <span>/</span>
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button className="text-white/60 hover:text-white transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 rounded text-xs text-white/60">
        HD
      </div>
    </div>
  );
};
