import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, PhoneCall, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const typeLabels = {
  absent: 'Inactive 7+ days',
  inactive: 'Membership inactive',
  trial: 'Trial / Enquiry',
};

export default function FollowUpPopup({ open, onClose, summary }) {
  const navigate = useNavigate();

  if (!summary) return null;

  const goToFollowUps = () => {
    onClose();
    navigate('/follow-ups');
  };

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
          <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-transparent dark:border-white/[0.08]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-[16px] font-semibold text-ink dark:text-zinc-100">
                  {summary.total} member{summary.total === 1 ? '' : 's'} need follow-up
                </h3>
              </div>
              <button
                onClick={onClose}
                className="press-feedback h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X size={16} className="text-ink dark:text-zinc-300" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {summary.counts.absent > 0 && (
                  <Badge status="expired">{summary.counts.absent} absent 7+ days</Badge>
                )}
                {summary.counts.inactive > 0 && (
                  <Badge status="cancelled">{summary.counts.inactive} inactive</Badge>
                )}
                {summary.counts.trial > 0 && (
                  <Badge status="pending">{summary.counts.trial} trial / enquiry</Badge>
                )}
              </div>

              <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-xl divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                {summary.preview.map((c) => (
                  <div key={c.member._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[14px] font-medium text-ink dark:text-zinc-100">{c.member.fullName}</p>
                      <p className="text-[12px] text-ink-tertiary dark:text-zinc-500">
                        {c.member.memberCode} · {c.member.phone}
                      </p>
                    </div>
                    <span className="text-[11px] text-ink-tertiary dark:text-zinc-500">
                      {typeLabels[c.type]}
                    </span>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={goToFollowUps}>
                <PhoneCall size={15} /> View & Follow Up
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}