import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className={`relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full ${width} max-h-[88vh] overflow-y-auto border border-transparent dark:border-white/[0.08]`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur">
              <h3 className="text-[16px] font-semibold text-ink dark:text-zinc-100">{title}</h3>
              <button
                onClick={onClose}
                className="press-feedback h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X size={16} className="text-ink dark:text-zinc-300" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
