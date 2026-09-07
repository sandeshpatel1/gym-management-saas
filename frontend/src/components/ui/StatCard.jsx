import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function StatCard({ label, value, sub, icon: Icon, accent = false }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-40, 40], [8, -8]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-40, 40], [-8, 8]), { stiffness: 220, damping: 20 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl rounded-xl2 border border-black/[0.06] dark:border-white/[0.08] shadow-card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-ink-secondary dark:text-zinc-400 font-medium">{label}</p>
          <p className="text-[28px] font-semibold text-ink dark:text-zinc-50 display-text mt-1">
            {value}
          </p>
          {sub && <p className="text-[12px] text-ink-tertiary dark:text-zinc-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              accent
                ? 'bg-brand/10 text-brand dark:bg-brand/20'
                : 'bg-black/[0.04] dark:bg-white/[0.08] text-ink-secondary dark:text-zinc-400'
            }`}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
