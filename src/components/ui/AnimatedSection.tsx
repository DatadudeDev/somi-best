import { motion } from 'framer-motion';
import { transitions } from '../../styles/tokens';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

export default function AnimatedSection({ children, className, style, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ ...transitions.fadeUp, delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
