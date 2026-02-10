import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock = ({
  code,
  language = "javascript",
  className = "",
  showLineNumbers = true,
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  // Simple syntax highlighting colors
  const highlightSyntax = (line: string) => {
    // First escape HTML entities to prevent XSS
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    return escaped
      .replace(/(const|let|var|function|return|import|export|from|async|await)/g, '<span class="text-cyan-400">$1</span>')
      .replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, '<span class="text-emerald-400">$1</span>')
      .replace(/(\d+)/g, '<span class="text-amber-400">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-zinc-500">$1</span>')
      .replace(/(\{|\}|\(|\)|\[|\])/g, '<span class="text-zinc-400">$1</span>');
  };

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-zinc-500 ml-2 font-mono uppercase">
            {language}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Code content */}
      <div className="bg-zinc-950 p-4 overflow-x-auto">
        <pre className="font-mono text-sm">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span className="select-none text-zinc-600 w-8 text-right pr-4 flex-shrink-0">
                  {i + 1}
                </span>
              )}
              <code
                className="text-zinc-300"
                dangerouslySetInnerHTML={{ __html: highlightSyntax(line) || "&nbsp;" }}
              />
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

// Animated typing code block
export const AnimatedCodeBlock = ({
  code,
  language = "javascript",
  typingSpeed = 30,
  className = "",
}: CodeBlockProps & { typingSpeed?: number }) => {
  const [displayedCode, setDisplayedCode] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useState(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= code.length) {
        setDisplayedCode(code.slice(0, index));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, typingSpeed);
    return () => clearInterval(interval);
  });

  return (
    <div className={className}>
      <CodeBlock code={displayedCode} language={language} />
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-cyan-400 ml-1"
        />
      )}
    </div>
  );
};
