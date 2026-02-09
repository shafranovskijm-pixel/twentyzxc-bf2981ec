import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TypewriterTextProps {
  texts: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export const TypewriterText = ({
  texts,
  className = "",
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: TypewriterTextProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting) {
      if (displayText === "") {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      } else {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deletingSpeed);
        return () => clearTimeout(timer);
      }
    } else {
      if (displayText === currentFullText) {
        setIsPaused(true);
      } else {
        const timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timer);
      }
    }
  }, [displayText, isDeleting, isPaused, currentTextIndex, texts, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-[3px] h-[1em] bg-current ml-1 align-middle"
      />
    </span>
  );
};

// Static text with reveal animation
export const RevealText = ({ 
  text, 
  className = "",
  delay = 0 
}: { 
  text: string; 
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: delay + i * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};
