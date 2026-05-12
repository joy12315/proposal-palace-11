import { motion } from "framer-motion";

interface GradientTextProps {
  text: string;
  className?: string;
}

export function GradientText({ text, className = "" }: GradientTextProps) {
  const chars = Array.from(text);
  return (
    <span className={`inline-block bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent ${className}`}>
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: "0.4em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.06 }}
          className="inline-block"
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}